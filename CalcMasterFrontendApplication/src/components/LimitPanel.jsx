import React, { useState, useRef } from "react";
import nerdamer from "nerdamer";
import "nerdamer/Calculus";
import "nerdamer/Algebra";
import "nerdamer/Solve";
import "nerdamer/Extra";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import PropTypes from "prop-types";

// PUBLIC_INTERFACE
/**
 * Panel for evaluating limits with step-by-step solution details.
 * Allows input of function f(x), a limit variable (default x), and a limiting value.
 * Computes symbolic limits via nerdamer, displays result and attempted step-by-step details.
 * @param {function} onBack - Callback to return to previous options/home.
 */
function LimitPanel({ onBack }) {
  const [func, setFunc] = useState("");
  const [limVar, setLimVar] = useState("x");
  const [limitTo, setLimitTo] = useState("");
  const [result, setResult] = useState({
    latex: "",
    steps: [],
    error: "",
    show: false,
    finalVal: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const funcInputRef = useRef();

  // Basic input validation for safety
  function validateLimitInputs() {
    if (!func.trim()) return "Please enter a function for the limit.";
    if (!limVar.trim()) return "Please enter the variable of approach (e.g. 'x').";
    if (!limitTo.trim()) return "Please enter the value to which the variable approaches.";
    return "";
  }

  /**
   * Simulates rudimentary step-by-step limit solution by checking for direct substitution,
   * then attempts algebraic/simplified forms (nerdamer's steps are not granular, so we provide best effort).
   */
  function getLimitSteps(funcStr, variable, limValue) {
    const steps = [];
    // Step 1: Substitute lim point directly
    let subExpr;
    try {
      subExpr = nerdamer(funcStr).substitute(variable, nerdamer(limValue)).expand().toString();
      steps.push({
        description: `Direct substitution: Substitute ${variable} = ${limValue}`,
        expr: `f(${limValue}) = ${subExpr}`,
        latex:
          "\\text{Direct sub:}\\qquad " +
          `f(${limValue})=` +
          nerdamer(`latex(${subExpr})`).toString(),
      });
    } catch {
      steps.push({
        description: `Direct substitution: Unable to compute substitution.`,
        expr: "",
        latex: "",
      });
    }
    // Step 2: Check if direct sub yields a determinate value
    try {
      const val = nerdamer(subExpr).evaluate().text();
      if (/NaN|undefined|Infinity/i.test(val)) {
        steps.push({
          description: `Substitution yields an indeterminate form (${val}). Attempting to simplify.`,
          expr: "",
          latex:
            "\\text{Indeterminate:}\\qquad " +
            nerdamer(`latex(${subExpr})`).toString(),
        });
        // Try to factor/simplify the function
        let simplified;
        try {
          simplified = nerdamer(`simplify(${funcStr})`).toString();
          if (simplified !== funcStr) {
            steps.push({
              description: "Simplify the original function:",
              expr: simplified,
              latex:
                "\\text{Simplified:}\\qquad " +
                nerdamer(`latex(${simplified})`).toString(),
            });
            // Try substitution again
            const sub2 = nerdamer(simplified)
              .substitute(variable, nerdamer(limValue))
              .toString();
            const val2 = nerdamer(sub2).evaluate().text();
            steps.push({
              description: `Substitute limiting value in the simplified function:`,
              expr: `${sub2} = ${val2}`,
              latex:
                "\\text{After simplification:}\\qquad " +
                nerdamer(`latex(${sub2})`).toString() +
                `=${val2}`,
            });
          }
        } catch {
          // can't simplify
        }
      } else {
        steps.push({
          description: `Direct substitution yields determinate value: ${val}`,
          expr: `${val}`,
          latex: "\\text{Value: }" + val,
        });
      }
    } catch {
      /* do nothing */
    }
    // Step 3: Always show the symbolic limit
    try {
      const limEval = nerdamer(`limit(${funcStr}, ${variable}, ${limValue})`);
      steps.push({
        description: `Compute the limit symbolically:`,
        expr: limEval.text(),
        latex:
          "\\lim_{" +
          variable +
          "\\to" +
          nerdamer(`latex(${limValue})`).toString() +
          "}~" +
          nerdamer(`latex(${funcStr})`).toString() +
          " = " +
          nerdamer(`latex(${limEval})`).toString(),
      });
    } catch {
      // If nerdamer fails, only use what we have
    }
    return steps;
  }

  // Handle form submission: compute the limit and steps
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult({ latex: "", steps: [], error: "", show: false, finalVal: "" });
    const err = validateLimitInputs();
    if (err) {
      setResult((_) => ({
        latex: "",
        steps: [],
        error: err,
        show: true,
        finalVal: "",
      }));
      setIsSubmitting(false);
      return;
    }
    // Try to compute limit and steps
    try {
      // The symbolic answer
      let symbolicLatex = "";
      let finalVal = "";
      try {
        const limRes = nerdamer(`limit(${func}, ${limVar}, ${limitTo})`);
        const latexRes = nerdamer(`latex(${limRes})`).toString();
        finalVal = limRes.text();
        symbolicLatex =
          "\\lim_{" +
          limVar +
          "\\to" +
          nerdamer(`latex(${limitTo})`).toString() +
          "} " +
          nerdamer(`latex(${func})`).toString() +
          " = " +
          latexRes;
      } catch (err) {
        symbolicLatex =
          "Unable to compute limit symbolically. Try a different function or value.";
      }
      // Fetch step-by-step
      const steps = getLimitSteps(func, limVar, limitTo);
      setResult({
        latex: symbolicLatex,
        steps,
        error: "",
        show: true,
        finalVal,
      });
    } catch (err) {
      setResult({
        latex: "",
        steps: [],
        error:
          typeof err === "string"
            ? err
            : err?.message ||
              "An error occurred while evaluating the limit. Please check your input.",
        show: true,
        finalVal: "",
      });
    }
    setIsSubmitting(false);
  };

  // Render results and steps: Polished, structured mathematical step display
  const renderSteps = () => {
    if (!result.show) return null;
    if (result.error) {
      return (
        <div
          className="alert alert-danger mt-3"
          tabIndex={0}
          role="alert"
          style={{ borderRadius: 10, fontSize: "1.07rem" }}
        >
          <span style={{ marginRight: 7, fontSize: 20 }}>❌</span>
          {result.error}
        </div>
      );
    }
    if (result.latex || (result.steps && result.steps.length)) {
      // Helper for accessibility numbering
      const stepLabel = (idx) => (
        <span
          className="d-inline-block rounded-circle bg-primary text-white fw-bold"
          style={{
            minWidth: 29, height: 29, display: "inline-flex", justifyContent: "center", alignItems: "center",
            marginRight: 10, fontSize: 16, verticalAlign: "middle", boxShadow: "0 2px 6px #c9f5de4f"
          }}
        >
          {idx + 1}
        </span>
      );
      return (
        <div
          className="limit-steps-panel card shadow-sm my-4 animate__animated animate__fadeInUp"
          style={{
            borderRadius: 16,
            maxWidth: 540,
            margin: "0 auto",
            background: "#f9fcfe",
            border: "2px solid #dbeef9",
            boxShadow: "0 4px 32px #e1ebfa3e"
          }}
          tabIndex={0}
          aria-live="polite"
        >
          <div className="card-body">
            <h3
              className="card-title fs-5 fw-bold mb-3"
              style={{
                color: "#148861",
                letterSpacing: ".015em",
                textShadow: "0 2px 8px #e6f7ff6e",
              }}>
              🧩 Solution Steps
            </h3>
            {result.steps && result.steps.length > 0 && (
              <ol className="ps-1" style={{ listStyle: "none", marginLeft: 0 }}>
                {result.steps.map((step, idx) => (
                  <li key={idx}
                    className="mb-4"
                    style={{
                        background: "#fff",
                        border: "1.5px solid #bee9fb",
                        borderRadius: 11,
                        padding: "14px 17px 8px 14px",
                        marginBottom: 19,
                        boxShadow: "0 2px 18px #dbf8fa2e",
                        position: "relative",
                        transition: "box-shadow .18s"
                    }}>
                    <div className="fw-semibold pb-1 d-flex align-items-center" style={{ fontSize: 15 }}>
                        {stepLabel(idx)}
                        <span style={{ color: "#177b56", fontWeight: 600 }}>{step.description}</span>
                    </div>
                    {step.latex && (
                      <div style={{ fontSize: "1.19rem", margin: "7px 0 2px 0" }}>
                        <BlockMath>{step.latex}</BlockMath>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {result.latex && (
              <div
                className="p-3 mt-2 border-0 shadow-sm animate__animated animate__pulse"
                style={{
                  background: "#e8fbe4",
                  borderRadius: 13,
                  boxShadow: "0 2px 14px #cdebd847",
                  fontWeight: 610
                }}>
                <span className="fw-bold" style={{ fontSize: "1.07rem", color: "#199345" }}>
                  <span aria-label="Final Answer" className="me-1" style={{ fontSize: "1.17rem" }}>✔️ Final Answer:</span>
                </span>
                <div className="mt-2 mb-2">
                  <BlockMath>{result.latex}</BlockMath>
                </div>
                {result.finalVal && (
                  <div className="text-success small fw-semibold" style={{ fontSize: 15 }}>
                    <span aria-label="limit value">Value: </span>
                    <span style={{
                      fontSize: "1.16em",
                      background: "#dbfbe6",
                      padding: "2px 10px",
                      borderRadius: 7,
                      fontFamily: "JetBrains Mono, Menlo, monospace"
                    }}>{result.finalVal}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Accessibility/contextual help
  const info = (
    <div className="mt-2 small text-muted" style={{ fontSize: 14 }}>
      Enter your function in terms of a variable (e.g. <code>x</code>).
      <br />
      Specify the variable and the value it approaches.
      <br />
      Example: <code>f(x) = sin(x)/x</code>, <code>x → 0</code> computes {String.fromCharCode(955)}<sub>x→0</sub> (sin(x)/x).
      <br />
      Supports symbolic functions and direct substitution. Handles indeterminate forms via simplification.
    </div>
  );

  return (
    <main className="container py-5" style={{ maxWidth: 520 }}>
      <h2 className="fw-bold text-success mb-3" tabIndex={0}>
        🍀 Limit Evaluation
      </h2>
      <form autoComplete="off" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="limit-function" className="form-label fw-semibold">
            Function <span className="text-muted ms-1">(in terms of variable)</span>
          </label>
          <input
            ref={funcInputRef}
            id="limit-function"
            className="form-control"
            type="text"
            value={func}
            onChange={e => setFunc(e.target.value)}
            placeholder="e.g. sin(x)/x"
            inputMode="text"
            style={{
              borderRadius: 10,
              fontFamily: "Menlo, monospace",
              fontSize: "1.08rem"
            }}
            autoComplete="off"
            required
            aria-label="Function for limit calculation"
            spellCheck={false}
          />
        </div>
        <div className="mb-3 row">
          <div className="col-6">
            <label htmlFor="limit-var" className="form-label fw-semibold">
              Variable
            </label>
            <input
              id="limit-var"
              className="form-control"
              type="text"
              value={limVar}
              onChange={e => setLimVar(e.target.value)}
              placeholder="e.g. x"
              inputMode="text"
              style={{ borderRadius: 10 }}
              autoComplete="off"
              required
              aria-label="Variable in limit"
              spellCheck={false}
            />
          </div>
          <div className="col-6">
            <label htmlFor="limit-to" className="form-label fw-semibold">
              Approaches
            </label>
            <input
              id="limit-to"
              className="form-control"
              type="text"
              value={limitTo}
              onChange={e => setLimitTo(e.target.value)}
              placeholder="e.g. 0"
              inputMode="text"
              style={{ borderRadius: 10 }}
              autoComplete="off"
              required
              aria-label="Limiting value"
              spellCheck={false}
            />
          </div>
        </div>
        {info}
        <div className="d-flex gap-3 mt-4">
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
            className="btn btn-success"
            style={{ borderRadius: 10, fontWeight: 600, minWidth: 160 }}
            disabled={isSubmitting}
            aria-label="Compute Limit"
          >
            {isSubmitting ? "Calculating..." : "Compute Limit"}
          </button>
        </div>
      </form>
      {renderSteps()}
    </main>
  );
}

LimitPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default LimitPanel;
