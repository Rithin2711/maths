import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import nerdamer from "nerdamer";
import "nerdamer/Algebra";
import "nerdamer/Calculus";
import "nerdamer/Solve";
import "nerdamer/Extra";
import Plot from "./PlotlyLite";

/**
 * PUBLIC_INTERFACE
 * Panel for computing the equation of the tangent to a circle at a specified point.
 * Inputs:
 *  - Center (h, k)
 *  - Radius r (> 0)
 *  - Point of tangency (x1, y1)
 *
 * Smart input feature:
 *  - User can enter either x1 OR y1 (only one is necessary).
 *  - When one coordinate is provided, the other is automatically computed from the circle equation:
 *      (x1 - h)^2 + (y1 - k)^2 = r^2
 *      => y1 = k ± sqrt( r^2 - (x1 - h)^2 ), or x1 = h ± sqrt( r^2 - (y1 - k)^2 )
 *  - Displays the equations used and the two candidate solutions (+/-). A simple toggle lets users swap between them.
 *  - Provides friendly feedback if the input does not yield a real solution.
 *
 * The panel validates that the point lies on the circle (within a small tolerance),
 * and then displays the tangent equation in two forms with KaTeX:
 *  1) Point form: (x1-h)(x-h) + (y1-k)(y-k) = r^2
 *  2) Expanded linear form: A x + B y + C = 0
 *
 * Renders an interactive graph using Plotly showing the circle, the tangent line,
 * the tangency point, and the center.
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

  // Track which coordinate was last edited by the user to know which way to auto-solve.
  const [lastEdited, setLastEdited] = useState(null); // 'x' | 'y' | null
  // Track whether the opposite coordinate is currently auto-filled (so we can keep updating it as user types).
  const [autoY, setAutoY] = useState(true);
  const [autoX, setAutoX] = useState(true);

  // Auto-solve info for UI feedback
  const [autoInfo, setAutoInfo] = useState({
    error: "",
    latexUsed: "",
    detailsLatex: "",
    solutionsLatex: "",
    using: "", // '+ branch' or '- branch'
  });

  // Results
  const [result, setResult] = useState({
    error: "",
    show: false,
    latexIntro: "",
    latexPointForm: "",
    latexLinearForm: "",
    numericSummary: "",
    plotData: null,
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

  function tryEvalNum(expr) {
    try {
      return evalNum(expr);
    } catch {
      return NaN;
    }
  }

  function numLatex(val) {
    if (!Number.isFinite(val)) return "NaN";
    // If close to integer, display integer
    if (Math.abs(val - Math.round(val)) < 1e-10) return String(Math.round(val));
    // Otherwise reasonable precision
    return Number(val).toPrecision(8).replace(/\.?0+$/, "");
  }

  // Auto compute missing coordinate when user types in one of them.
  useEffect(() => {
    // Only attempt when we have radius and center parseable
    const hNum = tryEvalNum(h);
    const kNum = tryEvalNum(k);
    const rNum = tryEvalNum(r);
    if (!Number.isFinite(hNum) || !Number.isFinite(kNum) || !Number.isFinite(rNum) || !(rNum > 0)) {
      setAutoInfo({
        error: "",
        latexUsed: "",
        detailsLatex: "",
        solutionsLatex: "",
        using: "",
      });
      return;
    }

    const EPS = 1e-12;

    // Solve Y from X
    if (lastEdited === "x" && x1.trim()) {
      // Only auto-fill if y is empty or previously auto-filled
      if (!y1.trim() || autoY) {
        const xNum = tryEvalNum(x1);
        if (!Number.isFinite(xNum)) {
          setAutoInfo({
            error: "x₁ is not a valid number/expression.",
            latexUsed: "",
            detailsLatex: "",
            solutionsLatex: "",
            using: "",
          });
          return;
        }
        const rad = rNum * rNum - (xNum - hNum) * (xNum - hNum);
        const latexUsed = String.raw`\text{Using: }(x_1-h)^2 + (y_1-k)^2 = r^2`;
        const detailsLatex = String.raw`y_1 = k \pm \sqrt{\,r^2 - (x_1-h)^2\,}`;

        if (rad < -1e-10) {
          setAutoInfo({
            error:
              "No real y₁ satisfies the circle equation for the provided x₁ (radicand < 0).",
            latexUsed,
            detailsLatex,
            solutionsLatex: "",
            using: "",
          });
          // do not change y1
          return;
        }
        const root = Math.sqrt(Math.max(0, rad));
        const yPlus = kNum + root;
        const yMinus = kNum - root;

        // Choose solution close to previous numeric y (if any); else take '+' branch by default.
        let chosen = yPlus;
        let using = "+ branch";
        const prevY = tryEvalNum(y1);
        if (Number.isFinite(prevY)) {
          const dPlus = Math.abs(prevY - yPlus);
          const dMinus = Math.abs(prevY - yMinus);
          if (dMinus + EPS < dPlus) {
            chosen = yMinus;
            using = "- branch";
          }
        }

        // Write chosen y1, and keep it auto-updatable
        setY1(String(chosen));
        setAutoY(true);
        setAutoInfo({
          error: "",
          latexUsed,
          detailsLatex,
          solutionsLatex: String.raw`\text{Solutions: }~ y_1 = ${numLatex(yPlus)} \quad\text{or}\quad y_1 = ${numLatex(yMinus)}`,
          using,
        });
      }
    }

    // Solve X from Y
    if (lastEdited === "y" && y1.trim()) {
      // Only auto-fill if x is empty or previously auto-filled
      if (!x1.trim() || autoX) {
        const yNum = tryEvalNum(y1);
        if (!Number.isFinite(yNum)) {
          setAutoInfo({
            error: "y₁ is not a valid number/expression.",
            latexUsed: "",
            detailsLatex: "",
            solutionsLatex: "",
            using: "",
          });
          return;
        }
        const rad = rNum * rNum - (yNum - kNum) * (yNum - kNum);
        const latexUsed = String.raw`\text{Using: }(x_1-h)^2 + (y_1-k)^2 = r^2`;
        const detailsLatex = String.raw`x_1 = h \pm \sqrt{\,r^2 - (y_1-k)^2\,}`;

        if (rad < -1e-10) {
          setAutoInfo({
            error:
              "No real x₁ satisfies the circle equation for the provided y₁ (radicand < 0).",
            latexUsed,
            detailsLatex,
            solutionsLatex: "",
            using: "",
          });
          // do not change x1
          return;
        }
        const root = Math.sqrt(Math.max(0, rad));
        const xPlus = hNum + root;
        const xMinus = hNum - root;

        // Choose solution close to previous numeric x (if any); else take '+' branch by default.
        let chosen = xPlus;
        let using = "+ branch";
        const prevX = tryEvalNum(x1);
        if (Number.isFinite(prevX)) {
          const dPlus = Math.abs(prevX - xPlus);
          const dMinus = Math.abs(prevX - xMinus);
          if (dMinus + EPS < dPlus) {
            chosen = xMinus;
            using = "- branch";
          }
        }

        // Write chosen x1, and keep it auto-updatable
        setX1(String(chosen));
        setAutoX(true);
        setAutoInfo({
          error: "",
          latexUsed,
          detailsLatex,
          solutionsLatex: String.raw`\text{Solutions: }~ x_1 = ${numLatex(xPlus)} \quad\text{or}\quad x_1 = ${numLatex(xMinus)}`,
          using,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h, k, r, x1, y1, lastEdited]);

  // Allow user to swap between +/- branch quickly
  const handleSwapBranch = () => {
    try {
      const hNum = evalNum(h);
      const kNum = evalNum(k);
      const rNum = evalNum(r);
      if (!(rNum > 0)) return;

      if (lastEdited === "x" && x1.trim()) {
        const xNum = evalNum(x1);
        const rad = rNum * rNum - (xNum - hNum) * (xNum - hNum);
        if (rad < -1e-10) return;
        const root = Math.sqrt(Math.max(0, rad));
        const yPlus = kNum + root;
        const yMinus = kNum - root;
        const cur = tryEvalNum(y1);
        if (Number.isFinite(cur)) {
          const swapped = Math.abs(cur - yPlus) < 1e-9 ? yMinus : yPlus;
          setY1(String(swapped));
          setAutoY(true);
          setAutoInfo((ai) => ({
            ...ai,
            using: Math.abs(swapped - yPlus) < 1e-9 ? "+ branch" : "- branch",
          }));
        }
      } else if (lastEdited === "y" && y1.trim()) {
        const yNum = evalNum(y1);
        const rad = rNum * rNum - (yNum - kNum) * (yNum - kNum);
        if (rad < -1e-10) return;
        const root = Math.sqrt(Math.max(0, rad));
        const xPlus = hNum + root;
        const xMinus = hNum - root;
        const cur = tryEvalNum(x1);
        if (Number.isFinite(cur)) {
          const swapped = Math.abs(cur - xPlus) < 1e-9 ? xMinus : xPlus;
          setX1(String(swapped));
          setAutoX(true);
          setAutoInfo((ai) => ({
            ...ai,
            using: Math.abs(swapped - xPlus) < 1e-9 ? "+ branch" : "- branch",
          }));
        }
      }
    } catch {
      // ignore
    }
  };

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
      plotData: null,
    });

    try {
      // Parse inputs
      const hNum = evalNum(h);
      const kNum = evalNum(k);
      const rNum = evalNum(r);

      // At least one of x1,y1 must be provided; auto-fill should have happened.
      if (!x1.trim() && !y1.trim()) {
        throw new Error("Please provide either x₁ or y₁ for the tangency point.");
      }

      // Try numeric x1,y1 (if either missing, attempt a final auto-compute).
      let xNum = tryEvalNum(x1);
      let yNum = tryEvalNum(y1);

      if (!Number.isFinite(xNum) && Number.isFinite(yNum)) {
        // compute x from y
        const rad = rNum * rNum - (yNum - kNum) * (yNum - kNum);
        if (rad < -1e-10) throw new Error("No real x₁ for given y₁ and circle parameters.");
        xNum = hNum + Math.sqrt(Math.max(0, rad));
      } else if (!Number.isFinite(yNum) && Number.isFinite(xNum)) {
        // compute y from x
        const rad = rNum * rNum - (xNum - hNum) * (xNum - hNum);
        if (rad < -1e-10) throw new Error("No real y₁ for given x₁ and circle parameters.");
        yNum = kNum + Math.sqrt(Math.max(0, rad));
      }

      if (!(rNum > 0)) {
        throw new Error("Radius r must be a positive number.");
      }
      if (!Number.isFinite(xNum) || !Number.isFinite(yNum)) {
        throw new Error("The tangency point coordinates could not be evaluated to real numbers.");
      }

      // Validate point on circle
      const lhs = (xNum - hNum) ** 2 + (yNum - kNum) ** 2;
      const rhs = rNum ** 2;
      if (Math.abs(lhs - rhs) > 1e-4) {
        throw new Error(
          "The specified point is not on the circle (within tolerance). Ensure (x₁−h)² + (y₁−k)² = r²."
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
      const latexIntro = `\\textbf{Circle: }(x-${numLatex(hNum)})^{2} + (y-${numLatex(
        kNum
      )})^{2} = ${numLatex(rNum)}^{2},\\;\\text{point }(x_{1},y_{1})=(${numLatex(
        xNum
      )}, ${numLatex(yNum)})`;

      const latexPointForm =
        `(x_{1}-h)\\,(x-h) + (y_{1}-k)\\,(y-k) = r^{2} \\;\\Rightarrow\\; ` +
        `(${numLatex(A)})\\,(x-${numLatex(hNum)}) + (${numLatex(B)})\\,(y-${numLatex(
          kNum
        )}) = ${numLatex(rNum)}^{2}`;

      const latexLinearForm =
        `\\text{Expanded linear form: }\\; ` +
        `\\boxed{ ${numLatex(A)}\\,x + ${numLatex(B)}\\,y ${C >= 0 ? "+ " : "- "}${numLatex(
          Math.abs(C)
        )} = 0 }`;

      const numericSummary = `A = ${numLatex(A)},\\; B = ${numLatex(B)},\\; C = ${numLatex(
        C
      )};\\; \\text{ i.e., } ${numLatex(A)}x + ${numLatex(B)}y ${
        C >= 0 ? "+ " : "- "
      }${numLatex(Math.abs(C))} = 0`;

      // --- Build Plotly visualization ---
      // Circle points
      const n = 360;
      const xc = new Array(n + 1);
      const yc = new Array(n + 1);
      for (let i = 0; i <= n; i++) {
        const t = (2 * Math.PI * i) / n;
        xc[i] = hNum + rNum * Math.cos(t);
        yc[i] = kNum + rNum * Math.sin(t);
      }

      // View bounds with padding
      const pad = Math.max(0.35 * rNum, 1);
      let xMin = hNum - rNum - pad;
      let xMax = hNum + rNum + pad;
      let yMin = kNum - rNum - pad;
      let yMax = kNum + rNum + pad;

      // Tangent line points from Ax + By + C = 0
      let xLine = [];
      let yLine = [];
      const EPS = 1e-12;
      if (Math.abs(B) > EPS) {
        xLine = [xMin, xMax];
        yLine = xLine.map((x) => (-A * x - C) / B);
      } else if (Math.abs(A) > EPS) {
        // Vertical line x = -C/A
        const xConst = -C / A;
        xLine = [xConst, xConst];
        yLine = [yMin, yMax];
        // widen x-range to include the vertical line if out of [xMin, xMax]
        xMin = Math.min(xMin, xConst - pad * 0.4);
        xMax = Math.max(xMax, xConst + pad * 0.4);
      } else {
        // Degenerate line (should not happen): skip plotting the line
        xLine = [];
        yLine = [];
      }

      // Traces
      const circleTrace = {
        x: xc,
        y: yc,
        name: "Circle",
        mode: "lines",
        type: "scatter",
        line: { color: "#4c6fff", width: 3 },
        hoverlabel: { bgcolor: "#eef2ff", font: { color: "#2a3fb4" } },
        showlegend: true,
      };
      const tangentTrace = {
        x: xLine,
        y: yLine,
        name: "Tangent Line",
        mode: "lines",
        type: "scatter",
        line: { color: "#e87a41", width: 3, dash: "dashdot" },
        hoverlabel: { bgcolor: "#ffedcc", font: { color: "#a54a06" } },
        showlegend: true,
      };
      const pointTrace = {
        x: [xNum],
        y: [yNum],
        name: "Point of Tangency",
        mode: "markers+text",
        type: "scatter",
        marker: {
          color: "#31d07e",
          size: 12,
          line: { width: 2, color: "#2b7a4b" },
          symbol: "circle",
        },
        text: ["(x₁, y₁)"],
        textposition: "top center",
        textfont: { color: "#2d7e52", size: 14, family: "inherit" },
        showlegend: true,
      };
      const centerTrace = {
        x: [hNum],
        y: [kNum],
        name: "Center",
        mode: "markers",
        type: "scatter",
        marker: {
          color: "#6c757d",
          size: 10,
          symbol: "x",
          line: { width: 1, color: "#495057" },
        },
        showlegend: true,
      };

      const plotData = {
        data: [circleTrace, tangentTrace, pointTrace, centerTrace],
        layout: {
          title: {
            text: "Circle and Tangent",
            font: { size: 20, family: "inherit" },
            x: 0.5,
            xref: "paper",
          },
          legend: { x: 1, y: 1, bgcolor: "#fff", bordercolor: "#e3e7ee" },
          xaxis: { title: "x", range: [xMin, xMax], zeroline: true, showgrid: true },
          yaxis: {
            title: "y",
            range: [yMin, yMax],
            zeroline: true,
            showgrid: true,
            scaleanchor: "x", // keep aspect ratio for true circle
            scaleratio: 1,
          },
          autosize: true,
          margin: { t: 60, l: 50, r: 30, b: 50 },
          paper_bgcolor: "#f9fbff",
          plot_bgcolor: "#fafeff",
          font: { family: "inherit", size: 15 },
        },
        config: {
          responsive: true,
          displayModeBar: false,
          toImageButtonOptions: { format: "png", filename: "tangent-circle", scale: 2 },
        },
      };

      setResult({
        error: "",
        show: true,
        latexIntro,
        latexPointForm,
        latexLinearForm,
        numericSummary,
        plotData,
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
        plotData: null,
      });
    }
    setIsSubmitting(false);
  };

  return (
    <main className="container py-5" style={{ maxWidth: 700 }}>
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
              onChange={(e) => {
                setH(e.target.value);
              }}
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
              onChange={(e) => {
                setK(e.target.value);
              }}
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
              onChange={(e) => {
                setR(e.target.value);
              }}
              placeholder="e.g. 5"
              style={{ borderRadius: 10, fontFamily: "Menlo, monospace" }}
              spellCheck={false}
              aria-label="Circle radius r"
            />
          </div>
          <div className="col-6"></div>
          <div className="col-6">
            <label htmlFor="circle-x1" className="form-label fw-semibold">
              Point x₁ <span className="text-muted small ms-1">(enter x₁ or y₁)</span>
            </label>
            <input
              id="circle-x1"
              className="form-control"
              type="text"
              value={x1}
              onChange={(e) => {
                setX1(e.target.value);
                setLastEdited("x");
                // when user changes x, we mark we can auto-fill y
                setAutoY(true);
              }}
              placeholder="e.g. 3"
              style={{ borderRadius: 10, fontFamily: "Menlo, monospace" }}
              spellCheck={false}
              aria-label="Point x1"
            />
          </div>
          <div className="col-6">
            <label htmlFor="circle-y1" className="form-label fw-semibold">
              Point y₁ <span className="text-muted small ms-1">(enter y₁ or x₁)</span>
            </label>
            <input
              id="circle-y1"
              className="form-control"
              type="text"
              value={y1}
              onChange={(e) => {
                setY1(e.target.value);
                setLastEdited("y");
                // when user changes y, we mark we can auto-fill x
                setAutoX(true);
                // If user typed y, this y should not be auto-overwritten unless they later change x
                setAutoY(false);
              }}
              placeholder="e.g. 4"
              style={{ borderRadius: 10, fontFamily: "Menlo, monospace" }}
              spellCheck={false}
              aria-label="Point y1"
            />
          </div>
        </div>

        {/* Smart auto-solve helper */}
        <div className="mt-3">
          {(x1.trim() || y1.trim()) && (
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: 12, background: "#f7fbff" }}
            >
              <div className="card-body py-3">
                <h3 className="card-title fs-6 fw-bold mb-2">Smart fill</h3>
                {autoInfo.error ? (
                  <div
                    className="alert alert-warning py-2"
                    role="alert"
                    style={{ borderRadius: 10, fontSize: "0.98rem" }}
                  >
                    ⚠️ {autoInfo.error}
                  </div>
                ) : (
                  <>
                    {autoInfo.latexUsed && <BlockMath>{autoInfo.latexUsed}</BlockMath>}
                    {autoInfo.detailsLatex && <BlockMath>{autoInfo.detailsLatex}</BlockMath>}
                    {autoInfo.solutionsLatex && (
                      <div className="small text-muted">
                        <BlockMath>{autoInfo.solutionsLatex}</BlockMath>
                      </div>
                    )}
                    {autoInfo.using && (
                      <div className="d-flex align-items-center gap-2 mt-2">
                        <span className="badge bg-primary" aria-live="polite">
                          Using {autoInfo.using}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={handleSwapBranch}
                          aria-label="Swap to the other solution branch"
                          style={{ borderRadius: 10 }}
                        >
                          Swap solution
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="small text-muted mt-2">
          Provide numeric values or expressions (e.g., pi/4, sqrt(2)). You may enter either x₁ or y₁;
          the other coordinate will be computed from (x₁−h)² + (y₁−k)² = r².
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

                {/* Plot visualization */}
                {result.plotData && (
                  <div className="mt-3" aria-label="Circle and tangent graph visualization">
                    <Plot
                      data={result.plotData.data}
                      layout={result.plotData.layout}
                      config={result.plotData.config}
                      style={{ width: "100%", height: "360px", minHeight: 260 }}
                      useResizeHandler={true}
                    />
                    <div className="mt-1 small text-muted" aria-live="polite">
                      <span style={{ color: "#4c6fff", fontWeight: 600 }}>Blue</span>: circle 
                      <span style={{ color: "#e87a41", fontWeight: 600 }}>Orange dashed</span>: tangent 
                      <span style={{ color: "#31d07e" }}>Green dot</span>: tangency 
                      <span style={{ color: "#6c757d" }}>X</span>: center
                    </div>
                  </div>
                )}
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
