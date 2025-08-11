import React, { useState, useRef } from "react";
import nerdamer from "nerdamer";
import PropTypes from "prop-types";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

/**
 * PUBLIC_INTERFACE
 * Panel for calculating and displaying the tangent line to a curve y = f(x) at x = x0.
 * - Users input the curve (in terms of x) and the x-coordinate.
 * - Computes the derivative, evaluates the slope at x0, and constructs the tangent line's equation.
 * - Displays formatted math output and error handling.
 *
 * @param {function} onBack - Callback function to return to previous options page.
 */
function TangentAtPointPanel({ onBack }) {
  // Input state
  const [curveExpr, setCurveExpr] = useState("");
  const [x0, setX0] = useState("");
  const [result, setResult] = useState({ latex: "", error: "", show: false, equationLatex: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef();

  // Handles form submission, tangent calculation, and error reporting
  const handleSubmit = (e) => {
    // Dynamically import nerdamer side effect plugins to ensure React build compatibility
    require("nerdamer/Calculus");
    require("nerdamer/Algebra");
    require("nerdamer/Solve");
    require("nerdamer/Extra");
    e.preventDefault();
    setIsSubmitting(true);
    setResult({ latex: "", error: "", show: false, equationLatex: "" });

    // Input validation
    if (!curveExpr.trim() || !x0.trim()) {
      setResult({
        latex: "",
        error: "Please enter both the curve equation (in x) and the value of x₀.",
        show: true,
        equationLatex: "",
      });
      setIsSubmitting(false);
      return;
    }

    let xNum = null;
    try {
      xNum = Number(nerdamer(x0).evaluate().text());
      if (!Number.isFinite(xNum)) throw new Error("x₀ must evaluate to a real number.");
    } catch {
      setResult({
        latex: "",
        error: "The specified x₀ is invalid or could not be evaluated.",
        show: true,
        equationLatex: "",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Compute derivative
      const derNerd = nerdamer(`diff(${curveExpr},x)`).toString();
      // 2. Compute y₀ = f(x₀)
      const y0Nerd = nerdamer(curveExpr, { x: xNum }).evaluate().text();
      const y0Num = Number(y0Nerd);
      // 3. Evaluate slope m = f'(x₀)
      const mNerd = nerdamer(derNerd, { x: xNum }).evaluate().text();
      const mNum = Number(mNerd);
      if (!Number.isFinite(mNum) || !Number.isFinite(y0Num)) throw new Error();
      // 4. Write the tangent line equation: y = m(x - x0) + y0
      //    For display: y = m x + b, b = y0 - m*x0
      const bNum = y0Num - mNum * xNum;
      // For precise display, show symbolic if possible
      const x0Latex = nerdamer(`latex(${xNum})`).toString();
      const y0Latex = nerdamer(`latex(${y0Num})`).toString();
      const mLatex = nerdamer(`latex(${mNum})`).toString();
      const bLatex = nerdamer(`latex(${bNum})`).toString();

      const lineLatex = `y = ${mLatex} x + ${bLatex}`;
      const detailsLatex =
        `\\text{Curve:}\\; y = ${nerdamer(`latex(${curveExpr})`).toString()}\\\\` +
        `\\text{At } x_0 = ${x0Latex},~ y_0 = ${y0Latex}\\\\` +
        `\\text{Slope:}\\; m = ${mLatex}\\\\` +
        `\\text{Tangent line:}\\; \\boxed{ ${lineLatex} }`;

      setResult({
        latex: detailsLatex,
        error: "",
        show: true,
        equationLatex: lineLatex,
      });
    } catch (err) {
      setResult({
        latex: "",
        error:
          "Could not compute tangent. Please check your curve equation is valid and in terms of x, e.g. x^2 + 2.",
        show: true,
        equationLatex: "",
      });
    }
    setIsSubmitting(false);
  };

  // Render the result card for tangent calculation
  const renderResult = () => {
    if (!result.show) return null;
    if (result.error) {
      return (
        <div
          className="alert alert-danger mt-3"
          role="alert"
          tabIndex={0}
          style={{ borderRadius: 10, fontSize: "1.03rem" }}
        >
          <span style={{ fontSize: 20, marginRight: 7 }}>❌</span>
          {result.error}
        </div>
      );
    }
    return (
      <div
        className="card shadow-sm my-4 animate__animated animate__fadeInUp"
        style={{
          borderRadius: 13,
          maxWidth: 520,
          margin: "0 auto",
          background: "#fcfdff",
          border: "2px solid #c2d3fa55"
        }}
        tabIndex={0}
        aria-live="polite"
      >
        <div className="card-body">
          <h3 className="card-title fs-6 fw-bold mb-3">Tangent Line at the Chosen Point</h3>
          <BlockMath>{result.latex}</BlockMath>
        </div>
      </div>
    );
  };

  return (
    <main className="container py-5" style={{ maxWidth: 540 }}>
      <h2 className="fw-bold text-secondary mb-4" tabIndex={0}>
        📏 Tangent at a Point
      </h2>
      <form autoComplete="off" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="curve-expression" className="form-label fw-semibold">
            Curve Equation <span className="text-muted ms-1" style={{ fontWeight: 400, fontSize: 14 }}>(in x)</span>
          </label>
          <input
            ref={inputRef}
            id="curve-expression"
            className="form-control"
            type="text"
            value={curveExpr}
            onChange={e => setCurveExpr(e.target.value)}
            placeholder="e.g. x^2 + 3*x - 4"
            inputMode="text"
            style={{
              borderRadius: 10,
              fontFamily: "'JetBrains Mono', Menlo, monospace",
              fontSize: "1.08rem"
            }}
            autoComplete="off"
            required
            aria-label="Curve equation as a function of x"
            spellCheck={false}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="point-x0" className="form-label fw-semibold">
            x-coordinate of tangency point (<span className="text-primary" style={{ fontWeight: 450, fontSize: 16 }}>x₀</span>)
          </label>
          <input
            id="point-x0"
            className="form-control"
            type="text"
            value={x0}
            onChange={e => setX0(e.target.value)}
            placeholder="e.g. 2 or pi/4"
            inputMode="text"
            style={{ borderRadius: 10, fontFamily: "Menlo, monospace", fontSize: "1.08rem" }}
            autoComplete="off"
            required
            aria-label="x-coordinate to find tangent"
            spellCheck={false}
          />
        </div>
        <div className="small text-muted mb-3">
          Enter your curve as a function of x (e.g. <code>x^3-2*x+1</code>), and specify the x-coordinate.
        </div>
        <div className="d-flex justify-content-between mt-4">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onBack}
            style={{ borderRadius: 10, fontWeight: 500 }}
            aria-label="Go Back"
            tabIndex={0}
          >
            ← Back
          </button>
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={isSubmitting}
            style={{ borderRadius: 10, fontWeight: 600, minWidth: 133 }}
            aria-label="Compute tangent at point"
          >
            {isSubmitting ? "Working..." : "Find Tangent"}
          </button>
        </div>
      </form>
      {renderResult()}
    </main>
  );
}
TangentAtPointPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};
export default TangentAtPointPanel;
