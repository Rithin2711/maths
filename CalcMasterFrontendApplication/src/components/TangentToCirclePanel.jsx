import React, { useState } from "react";
import PropTypes from "prop-types";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import nerdamer from "nerdamer";
import "nerdamer/Algebra";
import "nerdamer/Calculus";
import "nerdamer/Solve";
import "nerdamer/Extra";

/**
 * PUBLIC_INTERFACE
 * Panel for computing the equation of the tangent to a circle at a specified point.
 * Inputs:
 *  - Center (h, k)
 *  - Radius r (> 0)
 *  - Point of tangency (x1, y1)
 *
 * The panel validates that the point lies on the circle (within a small tolerance),
 * and then displays the tangent equation in two forms with KaTeX:
 *  1) Point form: (x1-h)(x-h) + (y1-k)(y-k) = r^2
 *  2) Expanded linear form: A x + B y + C = 0
 *
 * @param {function} onBack - Callback to navigate back
 */
function TangentToCirclePanel({ onBack }) {
  // Inputs as strings so users can enter values like "pi/4"
  const [h, setH] = useState("0");
  const [k, setK] = useState("0");
  const [r, setR] = useState("1");
  const [x1, setX1] = useState("");
  const [y1, setY1] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results
  const [result, setResult] = useState({
    error: "",
    show: false,
    latexIntro: "",
    latexPointForm: "",
    latexLinearForm: "",
    numericSummary: "",
  });

  // Helpers
  function evalNum(expr) {
    // Evaluate numeric string using nerdamer to allow "pi/2", "sqrt(2)", etc.
    try {
      const val = Number(nerdamer(expr).evaluate().text());
      if (!Number.isFinite(val)) throw new Error("Non-finite");
      return val;
    } catch {
      throw new Error(`Invalid numeric value: "${expr}"`);
    }
  }

  function numLatex(val) {
    if (!Number.isFinite(val)) return "NaN";
    // If close to integer, display integer
    if (Math.abs(val - Math.round(val)) < 1e-10) return String(Math.round(val));
    // Otherwise reasonable precision
    return Number(val).toPrecision(8).replace(/\.?0+$/,"");
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult({
      error: "",
      show: false,
      latexIntro: "",
      latexPointForm: "",
      latexLinearForm: "",
      numericSummary: "",
    });

    try {
      // Parse inputs
      const hNum = evalNum(h);
      const kNum = evalNum(k);
      const rNum = evalNum(r);
      const xNum = evalNum(x1);
      const yNum = evalNum(y1);

      if (!(rNum > 0)) {
        throw new Error("Radius r must be a positive number.");
      }

      // Validate point on circle
      const lhs = (xNum - hNum) ** 2 + (yNum - kNum) ** 2;
      const rhs = rNum ** 2;
      if (Math.abs(lhs - rhs) > 1e-4) {
        throw new Error(
          "The specified point is not on the circle (within tolerance). Ensure (x1 - h)^2 + (y1 - k)^2 = r^2."
        );
      }

      // Tangent forms
      // Point form: (x1-h)(x-h) + (y1-k)(y-k) = r^2
      const A = xNum - hNum; // coefficient of x in linear form
      const B = yNum - kNum; // coefficient of y in linear form
      // Linear: A x + B y - (r^2 + A*h + B*k) = 0
      const D = rNum * rNum + A * hNum + B * kNum; // RHS for Ax + By = D
      const C = -D;

      // Build LaTeX strings
      const latexIntro = `\\textbf{Circle: }(x-${numLatex(hNum)})^{2} + (y-${numLatex(kNum)})^{2} = ${numLatex(
        rNum
      )}^{2},\\;\\text{point }(x_{1},y_{1})=(${numLatex(xNum)}, ${numLatex(yNum)})`;

      const latexPointForm =
        `(x_{1}-h)\\,(x-h) + (y_{1}-k)\\,(y-k) = r^{2} \\;\\Rightarrow\\; ` +
        `(${numLatex(A)})\\,(x-${numLatex(hNum)}) + (${numLatex(B)})\\,(y-${numLatex(
          kNum
        )}) = ${numLatex(rNum)}^{2}`;

      const latexLinearForm =
        `\\text{Expanded linear form: }\\; ` +
        `\\boxed{ ${numLatex(A)}\\,x + ${numLatex(B)}\\,y ${C >= 0 ? "+ " : "- "}${numLatex(Math.abs(C))} = 0 }`;

      const numericSummary =
        `A = ${numLatex(A)},\\; B = ${numLatex(B)},\\; C = ${numLatex(C)};\\; \\text{ i.e., } ${numLatex(
          A
        )}x + ${numLatex(B)}y ${C >= 0 ? "+ " : "- "}${numLatex(Math.abs(C))} = 0`;

      setResult({
        error: "",
        show: true,
        latexIntro,
        latexPointForm,
        latexLinearForm,
        numericSummary,
      });
    } catch (err) {
      setResult({
        error:
          typeof err === "string"
            ? err
            : err?.message || "Could not compute the tangent. Please check your inputs.",
        show: true,
        latexIntro: "",
        latexPointForm: "",
        latexLinearForm: "",
        numericSummary: "",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <main className="container py-5" style={{ maxWidth: 650 }}>
      <h2 className="fw-bold text-primary mb-4" tabIndex={0}>
        ⚪ Tangent to a Circle
      </h2>
      <form autoComplete="off" onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-6">
            <label htmlFor="circle-h" className="form-label fw-semibold">
              Center h
            </label>
            <input
              id="circle-h"
              className="form-control"
              type="text"
              value={h}
              onChange={(e) => setH(e.target.value)}
              placeholder="e.g. 0"
              style={{ borderRadius: 10, fontFamily: "Menlo, monospace" }}
              spellCheck={false}
              aria-label="Circle center h"
            />
          </div>
          <div className="col-6">
            <label htmlFor="circle-k" className="form-label fw-semibold">
              Center k
            </label>
            <input
              id="circle-k"
              className="form-control"
              type="text"
              value={k}
              onChange={(e) => setK(e.target.value)}
              placeholder="e.g. 0"
              style={{ borderRadius: 10, fontFamily: "Menlo, monospace" }}
              spellCheck={false}
              aria-label="Circle center k"
            />
          </div>
          <div className="col-6">
            <label htmlFor="circle-r" className="form-label fw-semibold">
              Radius r
            </label>
            <input
              id="circle-r"
              className="form-control"
              type="text"
              value={r}
              onChange={(e) => setR(e.target.value)}
              placeholder="e.g. 5"
              style={{ borderRadius: 10, fontFamily: "Menlo, monospace" }}
              spellCheck={false}
              aria-label="Circle radius r"
            />
          </div>
          <div className="col-6"></div>
          <div className="col-6">
            <label htmlFor="circle-x1" className="form-label fw-semibold">
              Point x₁
            </label>
            <input
              id="circle-x1"
              className="form-control"
              type="text"
              value={x1}
              onChange={(e) => setX1(e.target.value)}
              placeholder="e.g. 3"
              style={{ borderRadius: 10, fontFamily: "Menlo, monospace" }}
              spellCheck={false}
              aria-label="Point x1"
            />
          </div>
          <div className="col-6">
            <label htmlFor="circle-y1" className="form-label fw-semibold">
              Point y₁
            </label>
            <input
              id="circle-y1"
              className="form-control"
              type="text"
              value={y1}
              onChange={(e) => setY1(e.target.value)}
              placeholder="e.g. 4"
              style={{ borderRadius: 10, fontFamily: "Menlo, monospace" }}
              spellCheck={false}
              aria-label="Point y1"
            />
          </div>
        </div>
        <div className="small text-muted mt-2">
          Provide numeric values or expressions (e.g., pi/4, sqrt(2)). The point must lie on the circle:
          (x₁−h)² + (y₁−k)² = r².
        </div>
        <div className="d-flex justify-content-between mt-4">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onBack}
            style={{ borderRadius: 10, fontWeight: 500 }}
            aria-label="Go Back"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ borderRadius: 10, fontWeight: 600, minWidth: 140 }}
            aria-label="Compute tangent to circle"
          >
            {isSubmitting ? "Working..." : "Compute Tangent"}
          </button>
        </div>
      </form>

      {/* Results */}
      {result.show && (
        <section className="mt-4" aria-live="polite">
          {result.error ? (
            <div
              className="alert alert-danger"
              role="alert"
              style={{ borderRadius: 10, fontSize: "1.03rem" }}
              tabIndex={0}
            >
              <span style={{ fontSize: 20, marginRight: 6 }}>❌</span>
              {result.error}
            </div>
          ) : (
            <div
              className="card shadow-sm my-3"
              style={{ borderRadius: 13, background: "#f9fbff", border: "2px solid #e2e8fb" }}
              tabIndex={0}
            >
              <div className="card-body">
                <h3 className="card-title fs-6 fw-bold mb-2">Tangent Equation</h3>
                <div style={{ fontSize: "1.05rem" }}>
                  <BlockMath>{result.latexIntro}</BlockMath>
                  <BlockMath>{result.latexPointForm}</BlockMath>
                  <BlockMath>{result.latexLinearForm}</BlockMath>
                  <div className="small text-muted mt-2">
                    <BlockMath>{result.numericSummary}</BlockMath>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

TangentToCirclePanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default TangentToCirclePanel;
