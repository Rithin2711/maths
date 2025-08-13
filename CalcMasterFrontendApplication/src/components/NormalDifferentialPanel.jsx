import React, { useState } from "react";
import PropTypes from "prop-types";
import nerdamer from "nerdamer";
import "nerdamer/Calculus";
import "nerdamer/Algebra";
import "nerdamer/Solve";
import "nerdamer/Extra";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import PrettyMathResult from "./PrettyMathResult";

/**
 * PUBLIC_INTERFACE
 * Panel for Normal Differential calculus.
 * User chooses Partial or Full Differential. For Partial:
 *  - Inputs: f(x, y) and select variable (x or y) to differentiate by.
 *  - Calculates ∂f/∂x or ∂f/∂y using nerdamer, shows LaTeX and result.
 * For Full Differential:
 *  - Accepts a single-variable expression and computes ordinary derivative.
 *
 * @param {function} onBack - Callback to return to options/select page
 */
function NormalDifferentialPanel({ onBack }) {
  // --- Tab State ---
  const [option, setOption] = useState("partial"); // "partial" or "full"

  // --- Partial Differential State ---
  const [expr, setExpr] = useState("");
  const [varToDiff, setVarToDiff] = useState("x");
  const [result, setResult] = useState({ latex: "", error: "", show: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Full Differential State ---
  const [fullExpr, setFullExpr] = useState("");
  const [singleVar, setSingleVar] = useState(""); // detected variable
  const [fullResult, setFullResult] = useState({ latex: "", error: "", show: false });
  const [fullIsSubmitting, setFullIsSubmitting] = useState(false);

  // --- Partial Handler ---
  const handleOptionChange = (val) => {
    setOption(val);
    // reset state when switching types
    setExpr("");
    setResult({ latex: "", error: "", show: false });
    setFullExpr("");
    setFullResult({ latex: "", error: "", show: false });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult({ latex: "", error: "", show: false });

    // Validate
    if (!expr.trim() || !varToDiff) {
      setResult({
        latex: "",
        error: "Please enter an equation and select a variable for differentiation.",
        show: true,
      });
      setIsSubmitting(false);
      return;
    }
    // Try to perform the partial derivative (nerdamer)
    try {
      const d = nerdamer(`diff(${expr},${varToDiff})`).toString();
      const latexResult = nerdamer(`latex(diff(${expr},${varToDiff}))`).toString();
      setResult({
        latex: `\\frac{\\partial f}{\\partial ${varToDiff}} = ${latexResult}`,
        error: "",
        show: true,
      });
    } catch (err) {
      setResult({
        latex: "",
        error: "Could not compute derivative. Check that your function is valid in x and y.",
        show: true,
      });
    }
    setIsSubmitting(false);
  };

  // --- Full Differential (Ordinary Derivative) ---
  // Helper: Detect single variable in input using regex
  function detectSingleVariable(expr) {
    if (!expr) return "";
    const matches = expr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    // Remove known math functions and constants that are not variables:
    const blacklist = [
      "sin", "cos", "tan", "sec", "csc", "cot",
      "arcsin", "arccos", "arctan",
      "log", "ln", "exp", "sqrt", "abs", "min", "max",
      "e", "pi", "PI"
    ];
    const freq = {};
    for (const w of matches) {
      if (!blacklist.includes(w)) freq[w] = (freq[w] || 0) + 1;
    }
    const vars = Object.keys(freq);
    return vars.length === 1 ? vars[0] : "";
  }

  const handleFullSubmit = (e) => {
    e.preventDefault();
    setFullIsSubmitting(true);
    setFullResult({ latex: "", error: "", show: false });

    if (!fullExpr.trim()) {
      setFullResult({
        latex: "",
        error: "Please enter an expression to differentiate.",
        show: true,
      });
      setFullIsSubmitting(false);
      return;
    }
    // Determine single variable
    const v = detectSingleVariable(fullExpr);
    setSingleVar(v || "");
    if (!v) {
      setFullResult({
        latex: "",
        error: "The expression should contain exactly one variable (e.g. only x or only y).",
        show: true,
      });
      setFullIsSubmitting(false);
      return;
    }
    try {
      // Compute ordinary derivative using nerdamer
      const deriv = nerdamer(`diff(${fullExpr},${v})`).toString();
      const latexDeriv = nerdamer(`latex(diff(${fullExpr},${v}))`).toString();
      const inputLatex = nerdamer(`latex(${fullExpr})`).toString();
      setFullResult({
        latex: `\\frac{d}{d${v}}\\left(${inputLatex}\\right) = ${latexDeriv}`,
        error: "",
        show: true,
      });
    } catch (err) {
      setFullResult({
        latex: "",
        error: "Could not compute derivative. Please check your expression is valid and uses only one variable.",
        show: true,
      });
    }
    setFullIsSubmitting(false);
  };

  // --- UIs ---
  const partialUI = (
    <form
      className="card shadow-sm p-4"
      style={{
        borderRadius: 16,
        background: "#f9fafd",
        maxWidth: 530,
        margin: "0 auto",
      }}
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      <div className="mb-3">
        <label htmlFor="partial-expr" className="form-label fw-semibold">
          Equation (function of two variables)
        </label>
        <input
          id="partial-expr"
          className="form-control"
          type="text"
          value={expr}
          onChange={e => setExpr(e.target.value)}
          placeholder="e.g. x^2*y + sin(x*y)"
          inputMode="text"
          required
          spellCheck={false}
          aria-label="Equation for differentiation, e.g. x^2*y + sin(x*y)"
          style={{
            borderRadius: 10,
            fontFamily: "'JetBrains Mono', Menlo, monospace",
            fontSize: "1.08rem",
            background: "#fafbf3",
          }}
        />
        <div className="form-text mt-1" style={{ fontSize: 13 }}>
          Enter a valid function of <code>x</code> and <code>y</code>.
        </div>
      </div>
      <div className="mb-2">
        <label htmlFor="var-to-diff" className="form-label fw-semibold">
          Differentiate with respect to:
        </label>
        <select
          id="var-to-diff"
          className="form-select"
          value={varToDiff}
          onChange={e => setVarToDiff(e.target.value)}
          style={{ maxWidth: 140, borderRadius: 10 }}
          aria-label="Variable for partial differentiation"
        >
          <option value="x">x</option>
          <option value="y">y</option>
        </select>
        <div className="form-text">
          This finds the partial derivative ∂f/∂x or ∂f/∂y.
        </div>
      </div>
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
          className="btn btn-danger"
          style={{ borderRadius: 10, fontWeight: 600, minWidth: 145 }}
          disabled={isSubmitting || !expr.trim() || !varToDiff}
          aria-label="Compute Partial Derivative"
        >
          {isSubmitting ? "Calculating..." : "Compute Partial Derivative"}
        </button>
      </div>
      {/* Result or error */}
      {result.show && (
        <div className="mt-4">
          {result.error && (
            <div className="alert alert-danger" tabIndex={0} style={{ borderRadius: 8, fontSize: "1.02rem" }}>
              <span style={{ marginRight: 7, fontSize: 19 }}>❌</span>{result.error}
            </div>
          )}
          {result.latex && (
            <div className="mt-3">
              <PrettyMathResult
                title="Partial Derivative"
                subtitle={`with respect to ${varToDiff}`}
                latex={result.latex}
                accentColor="#dc3545"
                ariaLabel={`Partial derivative with respect to ${varToDiff}`}
              />
            </div>
          )}
        </div>
      )}
    </form>
  );

  const fullUI = (
    <form
      className="card shadow-sm p-4"
      style={{ borderRadius: 16, background: "#f9fafd", maxWidth: 530, margin: "0 auto" }}
      autoComplete="off"
      onSubmit={handleFullSubmit}
    >
      <h4 className="fw-bold mb-3">Full Differential (Ordinary Derivative)</h4>
      <div className="mb-3">
        <label htmlFor="full-ordinary-expr" className="form-label fw-semibold">
          Expression (single variable)
        </label>
        <input
          id="full-ordinary-expr"
          className="form-control"
          type="text"
          value={fullExpr}
          onChange={e => { setFullExpr(e.target.value); setFullResult({ latex: "", error: "", show: false }); }}
          placeholder="e.g. x^3 + 7*x - 8"
          inputMode="text"
          spellCheck={false}
          required
          aria-label="Expression (single variable) for full differential"
          style={{
            borderRadius: 10,
            fontFamily: "'JetBrains Mono', Menlo, monospace",
            fontSize: "1.08rem",
            background: "#fcf9ed"
          }}
        />
        <div className="form-text mt-1" style={{ fontSize: 13 }}>
          Enter an expression involving only a single variable (e.g. x or y, not both).
        </div>
      </div>
      <div className="d-flex gap-3 mb-3">
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
          style={{ borderRadius: 10, fontWeight: 600, minWidth: 170 }}
          disabled={fullIsSubmitting || !fullExpr.trim()}
          aria-label="Compute Ordinary Derivative"
        >
          {fullIsSubmitting ? "Calculating..." : "Compute Derivative"}
        </button>
      </div>
      {/* Result or error */}
      {fullResult.show && (
        <div className="mt-4">
          {fullResult.error && (
            <div className="alert alert-danger" tabIndex={0} style={{ borderRadius: 8, fontSize: "1.02rem" }}>
              <span style={{ marginRight: 7, fontSize: 19 }}>❌</span>
              {fullResult.error}
            </div>
          )}
          {fullResult.latex && (
            <div className="mt-3">
              <PrettyMathResult
                title="Derivative Result"
                subtitle={singleVar ? `with respect to ${singleVar}` : undefined}
                latex={fullResult.latex}
                accentColor="#0d6efd"
                ariaLabel={`Derivative result${singleVar ? ` with respect to ${singleVar}` : ""}`}
              />
            </div>
          )}
        </div>
      )}
    </form>
  );

  // Tab selectors at the top
  const tabSelectors = (
    <div className="d-flex justify-content-center gap-3 mb-4 mt-1">
      <button
        type="button"
        className={`btn ${option === "partial" ? "btn-danger" : "btn-outline-danger"}`}
        style={{
          fontWeight: 650,
          borderRadius: 12,
          padding: "7px 21px",
          minWidth: 126,
          transition: "box-shadow .15s",
          boxShadow: option === "partial" ? "0 2px 14px #e87a4115" : undefined,
        }}
        aria-pressed={option === "partial"}
        aria-label="Partial Differential"
        onClick={() => handleOptionChange("partial")}
      >
        ∂ Partial Differential
      </button>
      <button
        type="button"
        className={`btn ${option === "full" ? "btn-primary" : "btn-outline-primary"}`}
        style={{
          fontWeight: 650,
          borderRadius: 12,
          padding: "7px 21px",
          minWidth: 126,
          transition: "box-shadow .15s",
          boxShadow: option === "full" ? "0 2px 14px #156bed12" : undefined,
        }}
        aria-pressed={option === "full"}
        aria-label="Full Differential"
        onClick={() => handleOptionChange("full")}
      >
        Δ Full Differential
      </button>
    </div>
  );

  return (
    <main className="container py-5" style={{ maxWidth: 610 }}>
      <h2 className="fw-bold text-danger mb-3" tabIndex={0}>
        🟥 Differential Calculator
      </h2>
      {/* Tab selectors */}
      {tabSelectors}
      {/* Selected tab UI */}
      {option === "partial" ? partialUI : fullUI}
    </main>
  );
}

NormalDifferentialPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default NormalDifferentialPanel;
