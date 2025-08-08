import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import nerdamer from "nerdamer";
import "nerdamer/Calculus";
import "nerdamer/Algebra";
import "nerdamer/Solve";
import "nerdamer/Extra";

/**
 * PUBLIC_INTERFACE
 * Panel for performing Normal (Definite or Indefinite) Integration.
 * Users may enter limits for definite integrals, or leave them blank for an indefinite integral.
 * Displays the result in a styled area. Handles errors gracefully.
 *
 * @param {function} onBack - Callback to return to Integral Options page.
 */
function NormalIntegrationPanel({ onBack }) {
  const [lower, setLower] = useState("");
  const [upper, setUpper] = useState("");
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState({ latex: "", plaintext: "", error: "", isIndefinite: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef();

  // List of symbols for quick-entry
  const QUICK_SYMBOLS = [
    { label: "sin", insert: "sin()", tip: "Insert sine" },
    { label: "cos", insert: "cos()", tip: "Insert cosine" },
    { label: "tan", insert: "tan()", tip: "Insert tangent" },
    { label: "π", insert: "pi", tip: "Insert pi" },
    { label: "e", insert: "e", tip: "Insert Euler's number" },
    { label: "√", insert: "sqrt()", tip: "Insert square root" },
    { label: "∫", insert: "∫ ", tip: "Integral symbol" },
    { label: "^", insert: "^", tip: "Insert exponent" },
  ];

  // Insert symbol at cursor position or append
  const handleSymbolClick = (sym) => {
    if (inputRef.current) {
      const el = inputRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const before = expr.substring(0, start);
      const after = expr.substring(end);
      let insertValue = sym;

      // If function with parentheses, put cursor inside
      let newCursorPos = start + sym.length;
      if (sym.endsWith("()")) {
        insertValue = sym;
        newCursorPos = start + sym.indexOf("(") + 1;
      }

      const newVal = before + insertValue + after;
      setExpr(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setExpr(expr + sym);
    }
  };

  // Handle math computation on form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult({ latex: "", plaintext: "", error: "", isIndefinite: false });
    try {
      // Validate the expression
      if (!expr.trim()) throw new Error("Please enter the integrand expression.");

      // Find integration variable (guess x by default)
      let intVar = "x";
      // Try to guess variable from the integrand (simple heuristic: find last alphabetic letter)
      const varMatch = expr.match(/[a-zA-Z]+/g);
      if (varMatch && varMatch.length > 0) {
        intVar = varMatch[varMatch.length - 1];
      }

      // Check if both lower and upper are provided (definite), or neither (indefinite)
      let resultLatex = "";
      let resultRaw = "";
      let isIndefinite = false;
      if ((lower.trim() && upper.trim())) {
        // Definite integral
        // Integrate and evaluate at bounds
        const symIntegral = nerdamer(`integrate(${expr}, ${intVar})`).toString();
        const valueUpper = nerdamer(symIntegral, { [intVar]: `(${upper})` }).evaluate().text();
        const valueLower = nerdamer(symIntegral, { [intVar]: `(${lower})` }).evaluate().text();
        const numericResult = nerdamer(`(${valueUpper})-(${valueLower})`).evaluate().text();

        // Build a nice latex output
        const latexIntegral = nerdamer(`latex(integrate(${expr},${intVar}))`).toString();
        resultLatex = `\\int_{${lower}}^{${upper}} ${nerdamer(`latex(${expr})`)}\\,d${intVar} = ${numericResult}`;
        resultRaw = `Definite integral: ${numericResult}`;
        isIndefinite = false;
      } else if (!lower.trim() && !upper.trim()) {
        // Indefinite integral
        const symIntegral = nerdamer(`integrate(${expr}, ${intVar})`).toString();
        const latexIntegral = nerdamer(`latex(integrate(${expr},${intVar}))`).toString();
        resultLatex = `${latexIntegral}`;
        resultRaw = `Indefinite integral: ${symIntegral} + C`;
        isIndefinite = true;
      } else {
        // One limit provided, the other blank: error
        throw new Error("Please provide both limits for definite integral, or leave both blank for indefinite integral.");
      }
      setResult({ latex: resultLatex, plaintext: resultRaw, error: "", isIndefinite });
    } catch (err) {
      let errorMsg = "";
      if (typeof err === "string") errorMsg = err;
      else errorMsg = err?.message ?? "Unknown error occurred while integrating.";
      setResult({ latex: "", plaintext: "", error: errorMsg, isIndefinite: false });
    }
    setIsSubmitting(false);
  };

  // Guidance text for users
  const infoText = (
    <div className="mt-2 small text-muted" style={{ fontSize: 14 }}>
      <span>
        Enter lower and upper limits for a definite integral, OR leave them blank for an indefinite integral.<br />
        Expression example: <code>sin(x) + e^x</code> &nbsp; &bull; &nbsp;<code>cos(pi*x)</code>
        <br />
        Use the quick-entry buttons for common symbols/functions.
      </span>
    </div>
  );

  // Result panel
  const renderResult = () => {
    if (!result.error && !result.latex && !result.plaintext) return null;
    return (
      <div
        className="card shadow-sm mt-4 mb-2 animate__animated animate__fadeInUp"
        style={{
          borderRadius: 13,
          maxWidth: 440,
          margin: "0 auto",
          background: "#fffefb",
          border: result.error ? "2px solid #ffe1e1" : "2px solid #d0e6f6"
        }}
        tabIndex={0}
        aria-live="polite"
      >
        <div className="card-body">
          <h3 className="card-title fs-6 fw-bold mb-2">{result.error ? "Error" : "Result"}</h3>
          {/* LaTeX render */}
          {result.latex && (
            <div className="mb-2" style={{ fontSize: "1.17rem", display: "flex", alignItems: "center" }}>
              {/* Safe KaTeX render */}
              <span
                style={{ fontFamily: "serif, math", color: "#27395a" }}
                dangerouslySetInnerHTML={{
                  __html: window.katex
                    ? window.katex.renderToString(result.latex, { throwOnError: false })
                    : result.latex
                }}
              />
              {/* Show + C plainly, only for indefinite */}
              {result.isIndefinite && (
                <span style={{ marginLeft: 7, color: "#e87a41", fontWeight: 600, fontSize: "1.11em", fontFamily: "inherit" }}>+ C</span>
              )}
            </div>
          )}
          {result.plaintext && !result.latex && (
            <pre
              className="bg-light px-2 py-1 rounded border border-1 mt-1"
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: ".97rem" }}
            >{result.plaintext}</pre>
          )}
          {result.error && (
            <div className="alert alert-danger mt-2 py-1 px-2" style={{ borderRadius: 7, fontSize: "1rem" }}>
              <span style={{ fontSize: "1.22rem", marginRight: 7 }}>❌</span>{result.error}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="container py-5" style={{ maxWidth: 540 }}>
      <h2 className="fw-bold text-primary mb-4" tabIndex={0}>
        ∫ Normal Integration
      </h2>
      <form autoComplete="off" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="lower-limit" className="form-label fw-semibold">
            Lower Limit
          </label>
          <input
            id="lower-limit"
            className="form-control"
            type="text"
            value={lower}
            onChange={e => setLower(e.target.value)}
            placeholder="e.g. 0"
            inputMode="decimal"
            style={{ borderRadius: 10 }}
            autoComplete="off"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="upper-limit" className="form-label fw-semibold">
            Upper Limit
          </label>
          <input
            id="upper-limit"
            className="form-control"
            type="text"
            value={upper}
            onChange={e => setUpper(e.target.value)}
            placeholder="e.g. pi"
            inputMode="decimal"
            style={{ borderRadius: 10 }}
            autoComplete="off"
          />
        </div>
        <div className="mb-2">
          <label htmlFor="integrand" className="form-label fw-semibold">
            Integrand Expression
          </label>
          <div className="d-flex flex-wrap gap-2 mb-1">
            {QUICK_SYMBOLS.map(symbol =>
              <button
                type="button"
                key={symbol.label}
                className="btn btn-sm btn-outline-secondary"
                style={{ fontWeight: 650, fontSize: 15, borderRadius: 8 }}
                title={symbol.tip}
                tabIndex={0}
                onClick={() => handleSymbolClick(symbol.insert)}
                aria-label={symbol.tip}
              >
                {symbol.label}
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            id="integrand"
            className="form-control"
            type="text"
            value={expr}
            onChange={e => setExpr(e.target.value)}
            autoComplete="off"
            placeholder="Enter integrand, e.g. sin(x) + x^2"
            style={{
              borderRadius: 10,
              fontFamily: "'JetBrains Mono', 'Menlo', 'Consolas', monospace",
              fontSize: "1.1rem",
            }}
            aria-label="Integrand expression"
            spellCheck={false}
          />
        </div>
        {infoText}
        <div className="mt-4 d-flex justify-content-between">
          <button
            type="button"
            className="btn btn-outline-secondary"
            style={{ borderRadius: 10, fontWeight: 500 }}
            onClick={onBack}
            aria-label="Go Back"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ borderRadius: 10, fontWeight: 600 }}
            disabled={isSubmitting || !expr.trim() || ((lower.trim() && !upper.trim()) || (!lower.trim() && upper.trim()))}
            tabIndex={0}
            aria-label="Integrate"
          >
            {isSubmitting ? "Working..." : "Compute Integral"}
          </button>
        </div>
      </form>
      {renderResult()}
    </main>
  );
}

NormalIntegrationPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default NormalIntegrationPanel;
