import { create, all } from "mathjs";
import nerdamer from "nerdamer";
import "nerdamer/Calculus";
import "nerdamer/Algebra";
import "nerdamer/Solve";
import "nerdamer/Extra";

// MathJS config: disable function assignment for security
const math = create(all, { 
  number: "auto",
  matrix: "Matrix",
  predictable: true,
  // More config to harden mathjs
  unsafe: false
});

const sanitizeInput = (input) =>
  input.replace(/[^\w\s^\-+\\*/().,_={}\[\]|:<>!#%&"',@]/g, ""); // basic sanitization

// PUBLIC_INTERFACE
/**
 * Checks and validates a math expression string.
 * Returns {valid: boolean, message: string}
 */
export function validateMathExpression(expr, operation) {
  if (!expr.trim()) {
    return { valid: false, message: "Please enter a mathematical expression." };
  }
  try {
    const sanitized = sanitizeInput(expr);
    // For trigonometric simple check:
    if (operation === "trigonometric") {
      if (!/sin|cos|tan|arcsin|arccos|arctan/i.test(sanitized)) {
        return {
          valid: false,
          message: "Enter a valid trigonometric expression (e.g., sin(x), tan(30)).",
        };
      }
    }
    // Try parsing with mathjs (quick fail for basic syntax)
    math.parse(sanitized);
    return { valid: true, message: "Looks good!" };
  } catch (err) {
    return { valid: false, message: "Syntax error: " + (err?.message ?? "Invalid expression.") };
  }
}

// PUBLIC_INTERFACE
/**
 * Calculates the math expression for the given operation.
 * Returns {formatted: LaTeX string, raw: string}
 * Throws on error
 */
export async function calculateMathExpression(expr, operation) {
  const sanitized = sanitizeInput(expr);
  if (!sanitized.trim())
    throw new Error("No input expression. Please enter a value.");

  let resultLatex = "";
  let resultRaw = "";

  switch (operation) {
    case "limit": {
      // Try extracting as lim_{x->a} f(x)
      // Parse for lim_, \lim, or limit, extract var and value
      let limMatch =
        sanitized.match(/lim_{(\w+)\\?to([\-.\w]+)}/i) ||
        sanitized.match(/limit\((\w+),([^\)]+)\)/i);
      let variable = "x";
      let toValue = 0;
      let func = sanitized;
      if (limMatch) {
        variable = limMatch[1]?.trim() || "x";
        toValue = limMatch[2]?.trim() || "0";
        func = sanitized.replace(limMatch[0], ""); // Remove lim symbol part
      }
      try {
        const nerdamerExpr = nerdamer(func);
        const symbolic = nerdamer(`limit(${nerdamerExpr.text()}, ${variable}, ${toValue})`).toString();
        resultLatex = nerdamer(`latex(${symbolic})`).toString();
        resultRaw = symbolic;
      } catch (errS) {
        // Fallback: mathjs numeric approach (approximation)
        const scope = {};
        scope[variable] = Number(toValue);
        const value = math.evaluate(func, scope);
        resultLatex = `\\lim_{${variable}\\to${toValue}} ${math.parse(func).toTex()} = ${value}`;
        resultRaw = "" + value;
      }
      break;
    }
    case "integral": {
      // allow syntax: \int x^2 dx, int(x^2, x), integrate(x^2, x)
      let intMatch = sanitized.match(/\int\s?([^\ ]+)\s*([dx]*)/i) || sanitized.match(/integrate?\(([^\)]+)\)/i);
      let exprToIntegrate = "";
      let intVar = "x";
      if (intMatch) {
        exprToIntegrate = intMatch[1] || sanitized;
        // Find integration variable (dx, dy)
        const dx = intMatch[2];
        if (dx && dx.length > 1) intVar = dx.slice(1);
      } else {
        exprToIntegrate = sanitized;
      }
      try {
        const symbolic = nerdamer(`integrate(${exprToIntegrate}, ${intVar})`).toString();
        resultLatex = nerdamer(`latex(${symbolic})`).toString();
        resultRaw = symbolic;
      } catch (errS) {
        // Fallback: mathjs numeric
        const numVal = math.integral ? math.integral(exprToIntegrate, intVar).toString() : "(numeric integration unavailable)";
        resultLatex = `${math.parse(exprToIntegrate).toTex()}\\ dx \\approx ${numVal}`;
        resultRaw = numVal;
      }
      break;
    }
    case "trigonometric": {
      // Evaluate using math.js for numeric, but format as math
      let val;
      try {
        val = math.evaluate(sanitized);
        resultRaw = "" + val;
        resultLatex = `${math.parse(sanitized).toTex()} = ${math.format(val, { precision: 10 })}`;
      } catch (err) {
        throw new Error("Trigonometric evaluation failed: " + (err?.message || ""));
      }
      break;
    }
    default:
      throw new Error("Unknown operation type.");
  }
  return { formatted: resultLatex, raw: resultRaw };
}
