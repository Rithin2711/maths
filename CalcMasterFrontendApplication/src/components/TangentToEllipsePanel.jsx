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
 * Panel for computing the equation of the tangent to an ellipse at a specified point.
 * Ellipse (centered at (h,k) with semi-axes a, b):
 *   ((x-h)^2)/a^2 + ((y-k)^2)/b^2 = 1
 *
 * Smart input feature:
 *  - User can enter either x1 OR y1.
 *  - Auto-compute the other using:
 *      y1 = k ± b sqrt( 1 - ((x1-h)^2)/a^2 ), or
 *      x1 = h ± a sqrt( 1 - ((y1-k)^2)/b^2 ).
 *  - Show equations used, display candidate solutions and allow swapping the branch.
 *  - Feedback if input does not yield a real solution (radicand < 0).
 *
 * Tangent at (x1, y1) on the ellipse:
 *   ((x1-h)(x-h))/a^2 + ((y1-k)(y-k))/b^2 = 1
 *
 * Expanded linear form: A x + B y + C = 0,
 *   where A = (x1-h)/a^2, B = (y1-k)/b^2, and
 *         C = -[ 1 + (x1-h)h/a^2 + (y1-k)k/b^2 ].
 *
 * Adds an interactive Plotly visualization showing the ellipse, tangent, point of tangency, and center.
 *
 * @param {function} onBack - Callback to navigate back
 */
function TangentToEllipsePanel({ onBack }) {
  // Inputs as strings for expression support
  const [h, setH] = useState("0");
  const [k, setK] = useState("0");
  const [a, setA] = useState("3");
  const [b, setB] = useState("2");
  const [x1, setX1] = useState("");
  const [y1, setY1] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track last edited and auto-fill flags
  const [lastEdited, setLastEdited] = useState(null); // 'x' | 'y' | null
  const [autoY, setAutoY] = useState(true);
  const [autoX, setAutoX] = useState(true);

  // Smart helper display
  const [autoInfo, setAutoInfo] = useState({
    error: "",
    latexUsed: "",
    detailsLatex: "",
    solutionsLatex: "",
    using: "",
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

  function evalNum(expr) {
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
    if (Math.abs(val - Math.round(val)) < 1e-10) return String(Math.round(val));
    return Number(val).toPrecision(8).replace(/\.?0+$/, "");
  }

  // Auto-solve missing coordinate from ellipse equation.
  useEffect(() => {
    const hNum = tryEvalNum(h);
    const kNum = tryEvalNum(k);
    const aNum = tryEvalNum(a);
    const bNum = tryEvalNum(b);
    if (!Number.isFinite(hNum) || !Number.isFinite(kNum) || !(aNum > 0) || !(bNum > 0)) {
      setAutoInfo({ error: "", latexUsed: "", detailsLatex: "", solutionsLatex: "", using: "" });
      return;
    }
    const EPS = 1e-12;

    // Solve y from x
    if (lastEdited === "x" && x1.trim()) {
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
        const part = 1 - ((xNum - hNum) * (xNum - hNum)) / (aNum * aNum);
        const latexUsed = String.raw`\text{Using: }\frac{(x_1-h)^2}{a^2} + \frac{(y_1-k)^2}{b^2} = 1`;
        const detailsLatex = String.raw`y_1 = k \pm b\,\sqrt{\,1 - \frac{(x_1-h)^2}{a^2}\,}`;

        if (part < -1e-10) {
          setAutoInfo({
            error:
              "No real y₁ satisfies the ellipse equation for the provided x₁ (radicand < 0).",
            latexUsed,
            detailsLatex,
            solutionsLatex: "",
            using: "",
          });
          return;
        }
        const root = Math.sqrt(Math.max(0, part));
        const yPlus = kNum + bNum * root;
        const yMinus = kNum - bNum * root;

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

        setY1(String(chosen));
        setAutoY(true);
        setAutoInfo({
          error: "",
          latexUsed,
          detailsLatex,
          solutionsLatex: String.raw`\text{Solutions: }~ y_1 = ${numLatex(
            yPlus
          )} \quad\text{or}\quad y_1 = ${numLatex(yMinus)}`,
          using,
        });
      }
    }

    // Solve x from y
    if (lastEdited === "y" && y1.trim()) {
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
        const part = 1 - ((yNum - kNum) * (yNum - kNum)) / (bNum * bNum);
        const latexUsed = String.raw`\text{Using: }\frac{(x_1-h)^2}{a^2} + \frac{(y_1-k)^2}{b^2} = 1`;
        const detailsLatex = String.raw`x_1 = h \pm a\,\sqrt{\,1 - \frac{(y_1-k)^2}{b^2}\,}`;

        if (part < -1e-10) {
          setAutoInfo({
            error:
              "No real x₁ satisfies the ellipse equation for the provided y₁ (radicand < 0).",
            latexUsed,
            detailsLatex,
            solutionsLatex: "",
            using: "",
          });
          return;
        }
        const root = Math.sqrt(Math.max(0, part));
        const xPlus = hNum + aNum * root;
        const xMinus = hNum - aNum * root;

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

        setX1(String(chosen));
        setAutoX(true);
        setAutoInfo({
          error: "",
          latexUsed,
          detailsLatex,
          solutionsLatex: String.raw`\text{Solutions: }~ x_1 = ${numLatex(
            xPlus
          )} \quad\text{or}\quad x_1 = ${numLatex(xMinus)}`,
          using,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h, k, a, b, x1, y1, lastEdited]);

  const handleSwapBranch = () => {
    try {
      const hNum = evalNum(h);
      const kNum = evalNum(k);
      const aNum = evalNum(a);
      const bNum = evalNum(b);
      if (!(aNum > 0) || !(bNum > 0)) return;

      if (lastEdited === "x" && x1.trim()) {
        const xNum = evalNum(x1);
        const part = 1 - ((xNum - hNum) * (xNum - hNum)) / (aNum * aNum);
        if (part < -1e-10) return;
        const root = Math.sqrt(Math.max(0, part));
        const yPlus = kNum + bNum * root;
        const yMinus = kNum - bNum * root;
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
        const part = 1 - ((yNum - kNum) * (yNum - kNum)) / (bNum * bNum);
        if (part < -1e-10) return;
        const root = Math.sqrt(Math.max(0, part));
        const xPlus = hNum + aNum * root;
        const xMinus = hNum - aNum * root;
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
      // Parse/validate
      const hNum = evalNum(h);
      const kNum = evalNum(k);
      const aNum = evalNum(a);
      const bNum = evalNum(b);

      if (!(aNum > 0) || !(bNum > 0)) {
        throw new Error("Semi-axes a and b must be positive numbers.");
      }
      if (!x1.trim() && !y1.trim()) {
        throw new Error("Please provide either x₁ or y₁ for the tangency point.");
      }

      // Ensure both numeric coordinates, computing missing one if necessary
      let xNum = tryEvalNum(x1);
      let yNum = tryEvalNum(y1);

      if (!Number.isFinite(xNum) && Number.isFinite(yNum)) {
        const part = 1 - ((yNum - kNum) * (yNum - kNum)) / (bNum * bNum);
        if (part < -1e-10) throw new Error("No real x₁ for given y₁ and ellipse parameters.");
        xNum = hNum + aNum * Math.sqrt(Math.max(0, part));
      } else if (!Number.isFinite(yNum) && Number.isFinite(xNum)) {
        const part = 1 - ((xNum - hNum) * (xNum - hNum)) / (aNum * aNum);
        if (part < -1e-10) throw new Error("No real y₁ for given x₁ and ellipse parameters.");
        yNum = kNum + bNum * Math.sqrt(Math.max(0, part));
      }

      if (!Number.isFinite(xNum) || !Number.isFinite(yNum)) {
        throw new Error("The tangency point coordinates could not be evaluated to real numbers.");
      }

      // Check that point lies on ellipse
      const lhs =
        ((xNum - hNum) ** 2) / (aNum * aNum) + ((yNum - kNum) ** 2) / (bNum * bNum);
      if (Math.abs(lhs - 1) > 1e-4) {
        throw new Error(
          "The specified point is not on the ellipse (within tolerance). Ensure ((x₁−h)²)/a² + ((y₁−k)²)/b² = 1."
        );
      }

      // Coefficients
      const A = (xNum - hNum) / (aNum * aNum);
      const B = (yNum - kNum) / (bNum * bNum);
      const D =
        1 +
        ((xNum - hNum) * hNum) / (aNum * aNum) +
        ((yNum - kNum) * kNum) / (bNum * bNum);
      const C = -D;

      // Latex construction
      const latexIntro =
        `\\textbf{Ellipse: }\\; \\frac{(x-${numLatex(hNum)})^{2}}{${numLatex(
          aNum
        )}^{2}} + \\frac{(y-${numLatex(kNum)})^{2}}{${numLatex(
          bNum
        )}^{2}} = 1,\\; \\text{point }(x_{1},y_{1})=(${numLatex(xNum)}, ${numLatex(yNum)})`;

      const latexPointForm =
        `\\frac{(x_{1}-h)(x-h)}{a^{2}} + \\frac{(y_{1}-k)(y-k)}{b^{2}} = 1 \\;\\Rightarrow\\; ` +
        `\\frac{(${numLatex(xNum - hNum)})(x-${numLatex(hNum)})}{${numLatex(
          aNum
        )}^{2}} + ` +
        `\\frac{(${numLatex(yNum - kNum)})(y-${numLatex(kNum)})}{${numLatex(bNum)}^{2}} = 1`;

      const latexLinearForm =
        `\\text{Expanded linear form: }\\; \\boxed{ ${numLatex(A)}\\,x + ${numLatex(B)}\\,y ${
          C >= 0 ? "+ " : "- "
        }${numLatex(Math.abs(C))} = 0 }`;

      const numericSummary = `A = ${numLatex(A)},\\; B = ${numLatex(B)},\\; C = ${numLatex(
        C
      )};\\; \\text{ i.e., } ${numLatex(A)}x + ${numLatex(B)}y ${
        C >= 0 ? "+ " : "- "
      }${numLatex(Math.abs(C))} = 0`;

      // --- Build Plotly visualization ---
      // Ellipse parametric points: x = h + a cos t, y = k + b sin t
      const n = 360;
      const xe = new Array(n + 1);
      const ye = new Array(n + 1);
      for (let i = 0; i <= n; i++) {
        const t = (2 * Math.PI * i) / n;
        xe[i] = hNum + aNum * Math.cos(t);
        ye[i] = kNum + bNum * Math.sin(t);
      }

      // View bounds with padding
      const pad = Math.max(0.3 * Math.max(aNum, bNum), 1);
      let xMin = hNum - aNum - pad;
      let xMax = hNum + aNum + pad;
      let yMin = kNum - bNum - pad;
      let yMax = kNum + bNum + pad;

      // Tangent line from Ax + By + C = 0
      let xLine = [];
      let yLine = [];
      const EPS = 1e-12;
      if (Math.abs(B) > EPS) {
        xLine = [xMin, xMax];
        yLine = xLine.map((x) => (-A * x - C) / B);
      } else if (Math.abs(A) > EPS) {
        const xConst = -C / A;
        xLine = [xConst, xConst];
        yLine = [yMin, yMax];
        xMin = Math.min(xMin, xConst - pad * 0.4);
        xMax = Math.max(xMax, xConst + pad * 0.4);
      }

      // Traces
      const ellipseTrace = {
        x: xe,
        y: ye,
        name: "Ellipse",
        mode: "lines",
        type: "scatter",
        line: { color: "#6f42c1", width: 3 },
        hoverlabel: { bgcolor: "#f3e8ff", font: { color: "#5a32a8" } },
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
        data: [ellipseTrace, tangentTrace, pointTrace, centerTrace],
        layout: {
          title: {
            text: "Ellipse and Tangent",
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
            scaleanchor: "x", // ensure accurate aspect ratio for ellipse
            scaleratio: 1,
          },
          autosize: true,
          margin: { t: 60, l: 50, r: 30, b: 50 },
          paper_bgcolor: "#fbf7ff",
          plot_bgcolor: "#fffafe",
          font: { family: "inherit", size: 15 },
        },
        config: {
          responsive: true,
          displayModeBar: false,
          toImageButtonOptions: { format: "png", filename: "tangent-ellipse", scale: 2 },
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
    <main className="container py-5" style={{ maxWidth: 720 }}>
      <h2 className="fw-bold text-purple mb-4" tabIndex={0} style={{ color: "#6f42c1" }}>
        ⬭ Tangent to an Ellipse
      </h2>
      <form autoComplete="off" onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-6">
            <label htmlFor="ellipse-h" className="form-label fw-semibold">
              Center h
            </label>
            <input
              id="ellipse-h"
              className="form-control"
              type="text"
              value={h}
              onChange={(e) => setH(e.target.value)}
              placeholder="e.g. 0"
              style={{ borderRadius: 10, fontFamily: "Menlo, monospace" }}
              spellCheck={false}
              aria-label="Ellipse center h"
            />
          </div>
          <div className="col-6">
            <label htmlFor="ellipse-k" className="form-label fw-semibold">
              Center k
            </label>
            <input
              id="ellipse-k"
              className="form-control"
              type="text"
              value={k}
              onChange={(e) => setK(e.target.value)}
              placeholder="e.g. 0"
              style={{ borderRadius: 10, fontFamily: "Menlo, monospace" }}
              spellCheck={false}
              aria-label="Ellipse center k"
            />
          </div>
          <div className="col-6">
            <label htmlFor="ellipse-a" className="form-label fw-semibold">
              Semi-axis a
            </label>
            <input
              id="ellipse-a"
              className="form-control"
              type="text"
              value={a}
              onChange={(e) => setA(e.target.value)}
              placeholder="e.g. 3"
              style={{ borderRadius: 10, fontFamily: "Menlo, monospace" }}
              spellCheck={false}
              aria-label="Ellipse semi-axis a"
            />
          </div>
          <div className="col-6">
            <label htmlFor="ellipse-b" className="form-label fw-semibold">
              Semi-axis b
            </label>
            <input
              id="ellipse-b"
              className="form-control"
              type="text"
              value={b}
              onChange={(e) => setB(e.target.value)}
              placeholder="e.g. 2"
              style={{ borderRadius: 10, fontFamily: "Menlo, monospace" }}
              spellCheck={false}
              aria-label="Ellipse semi-axis b"
            />
          </div>
          <div className="col-6">
            <label htmlFor="ellipse-x1" className="form-label fw-semibold">
              Point x₁ <span className="text-muted small ms-1">(enter x₁ or y₁)</span>
            </label>
            <input
              id="ellipse-x1"
              className="form-control"
              type="text"
              value={x1}
              onChange={(e) => {
                setX1(e.target.value);
                setLastEdited("x");
                setAutoY(true);
              }}
              placeholder="e.g. 3"
              style={{ borderRadius: 10, fontFamily: "Menlo, monospace" }}
              spellCheck={false}
              aria-label="Point x1"
            />
          </div>
          <div className="col-6">
            <label htmlFor="ellipse-y1" className="form-label fw-semibold">
              Point y₁ <span className="text-muted small ms-1">(enter y₁ or x₁)</span>
            </label>
            <input
              id="ellipse-y1"
              className="form-control"
              type="text"
              value={y1}
              onChange={(e) => {
                setY1(e.target.value);
                setLastEdited("y");
                setAutoX(true);
                setAutoY(false);
              }}
              placeholder="e.g. 0"
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
              style={{ borderRadius: 12, background: "#fbf7ff" }}
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
                        <span className="badge" style={{ backgroundColor: "#6f42c1" }} aria-live="polite">
                          Using {autoInfo.using}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={handleSwapBranch}
                          aria-label="Swap to the other solution branch"
                          style={{
                            borderRadius: 10,
                            border: "1px solid #6f42c1",
                            color: "#6f42c1",
                            background: "transparent",
                          }}
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
          the other coordinate will be computed from ((x₁−h)²)/a² + ((y₁−k)²)/b² = 1.
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
            className="btn btn-purple"
            disabled={isSubmitting}
            style={{
              borderRadius: 10,
              fontWeight: 600,
              minWidth: 160,
              backgroundColor: "#6f42c1",
              color: "#fff",
            }}
            aria-label="Compute tangent to ellipse"
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
              style={{ borderRadius: 13, background: "#fbf7ff", border: "2px solid #eadbff" }}
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
                  <div className="mt-3" aria-label="Ellipse and tangent graph visualization">
                    <Plot
                      data={result.plotData.data}
                      layout={result.plotData.layout}
                      config={result.plotData.config}
                      style={{ width: "100%", height: "360px", minHeight: 260 }}
                      useResizeHandler={true}
                    />
                    <div className="mt-1 small text-muted" aria-live="polite">
                      <span style={{ color: "#6f42c1", fontWeight: 600 }}>Purple</span>: ellipse 
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

TangentToEllipsePanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default TangentToEllipsePanel;
