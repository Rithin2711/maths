import React, { useState } from "react";
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

  function numLatex(val) {
    if (!Number.isFinite(val)) return "NaN";
    if (Math.abs(val - Math.round(val)) < 1e-10) return String(Math.round(val));
    return Number(val).toPrecision(8).replace(/\.?0+$/, "");
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
      plotData: null,
    });

    try {
      // Parse/validate
      const hNum = evalNum(h);
      const kNum = evalNum(k);
      const aNum = evalNum(a);
      const bNum = evalNum(b);
      const xNum = evalNum(x1);
      const yNum = evalNum(y1);

      if (!(aNum > 0) || !(bNum > 0)) {
        throw new Error("Semi-axes a and b must be positive numbers.");
      }

      // Check that point lies on ellipse
      const lhs =
        ((xNum - hNum) ** 2) / (aNum * aNum) + ((yNum - kNum) ** 2) / (bNum * bNum);
      if (Math.abs(lhs - 1) > 1e-4) {
        throw new Error(
          "The specified point is not on the ellipse (within tolerance). Ensure ((x1−h)^2)/a^2 + ((y1−k)^2)/b^2 = 1."
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
        `\\textbf{Ellipse: }\\; \\frac{(x-${numLatex(hNum)})^{2}}{${numLatex(aNum)}^{2}} + \\frac{(y-${numLatex(
          kNum
        )})^{2}}{${numLatex(bNum)}^{2}} = 1,\\; \\text{point }(x_{1},y_{1})=(${numLatex(
          xNum
        )}, ${numLatex(yNum)})`;

      const latexPointForm =
        `\\frac{(x_{1}-h)(x-h)}{a^{2}} + \\frac{(y_{1}-k)(y-k)}{b^{2}} = 1 \\;\\Rightarrow\\; ` +
        `\\frac{(${numLatex(xNum - hNum)})(x-${numLatex(hNum)})}{${numLatex(aNum)}^{2}} + ` +
        `\\frac{(${numLatex(yNum - kNum)})(y-${numLatex(kNum)})}{${numLatex(bNum)}^{2}} = 1`;

      const latexLinearForm =
        `\\text{Expanded linear form: }\\; \\boxed{ ${numLatex(A)}\\,x + ${numLatex(B)}\\,y ${
          C >= 0 ? "+ " : "- "
        }${numLatex(Math.abs(C))} = 0 }`;

      const numericSummary =
        `A = ${numLatex(A)},\\; B = ${numLatex(B)},\\; C = ${numLatex(C)};\\; \\text{ i.e., } ${numLatex(
          A
        )}x + ${numLatex(B)}y ${C >= 0 ? "+ " : "- "}${numLatex(Math.abs(C))} = 0`;

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
    <main className="container py-5" style={{ maxWidth: 680 }}>
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
              Point x₁
            </label>
            <input
              id="ellipse-x1"
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
            <label htmlFor="ellipse-y1" className="form-label fw-semibold">
              Point y₁
            </label>
            <input
              id="ellipse-y1"
              className="form-control"
              type="text"
              value={y1}
              onChange={(e) => setY1(e.target.value)}
              placeholder="e.g. 0"
              style={{ borderRadius: 10, fontFamily: "Menlo, monospace" }}
              spellCheck={false}
              aria-label="Point y1"
            />
          </div>
        </div>
        <div className="small text-muted mt-2">
          Provide numeric values or expressions (e.g., pi/4, sqrt(2)). The point must lie on the ellipse:
          ((x₁−h)²)/a² + ((y₁−k)²)/b² = 1.
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
            style={{ borderRadius: 10, fontWeight: 600, minWidth: 160, backgroundColor: "#6f42c1", color: "#fff" }}
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
