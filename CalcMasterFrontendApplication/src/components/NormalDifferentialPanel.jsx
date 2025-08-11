import React, { useState } from "react";
import PropTypes from "prop-types";
import nerdamer from "nerdamer";
import "nerdamer/Calculus";
import "nerdamer/Algebra";
import "nerdamer/Solve";
import "nerdamer/Extra";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

/**
 * PUBLIC_INTERFACE
 * Panel for Normal Differential calculus.
 * User chooses Partial or Full Differential. For Partial:
 *  - Inputs: f(x, y) and select variable (x or y) to differentiate by.
 *  - Calculates ∂f/∂x or ∂f/∂y using nerdamer, shows LaTeX and result.
 *  - For Full Differential, offers a description/placeholder.
 *
 * @param {function} onBack - Callback to return to options/select page
 */
function NormalDifferentialPanel({ onBack }) {
  const [option, setOption] = useState("partial"); // "partial" or "full"
  // Partial Differential State
  const [expr, setExpr] = useState("");
  const [varToDiff, setVarToDiff] = useState("x");
  const [result, setResult] = useState({ latex: "", error: "", show: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handler for Differential type
  const handleOptionChange = (val) => {
    setOption(val);
    // reset state when switching types
    setExpr("");
    setResult({ latex: "", error: "", show: false });
  };

  // Handler for calculation of partial derivative
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

  // Partial Differential Inputs and result display
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
            <div className="mt-3 card bg-light shadow-sm" style={{ borderRadius: 11, padding: 12 }}>
              <div className="fw-bold mb-2 text-danger">Partial Derivative:</div>
              <BlockMath>{result.latex}</BlockMath>
            </div>
          )}
        </div>
      )}
    </form>
  );

  // Full Differential (not implemented, so just a placeholder)
  const fullUI = (
    <div
      className="card shadow-sm p-4 text-center"
      style={{ borderRadius: 16, background: "#f9fafd", maxWidth: 530, margin: "0 auto" }}
      tabIndex={0}
    >
      <h4 className="fw-bold mb-2">Full Differential (Coming Soon)</h4>
      <div style={{ color: "#b05b19", fontSize: "1.13rem" }}>
        <p>
          The Full Differential computes <span className="fw-bold">df</span> for a function f(x, y), that is:
        </p>
        <BlockMath>{"df = \\frac{\\partial f}{\\partial x} dx + \\frac{\\partial f}{\\partial y} dy"}</BlockMath>
        <p className="text-muted mb-0">This feature will be added soon!</p>
      </div>
      <button
        type="button"
        className="btn btn-outline-secondary mt-4"
        style={{ borderRadius: 10, fontWeight: 500 }}
        onClick={onBack}
        aria-label="Go Back"
      >
        ← Back
      </button>
    </div>
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
