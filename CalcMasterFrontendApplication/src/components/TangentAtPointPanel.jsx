import React, { useState, useRef } from "react";
import nerdamer from "nerdamer";
import PropTypes from "prop-types";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import Plot from "react-plotly.js";

/**
 * PUBLIC_INTERFACE
 * Panel for calculating and displaying the tangent line to a curve y = f(x) at x = x0.
 * - Users input the curve (in terms of x) and the x-coordinate.
 * - Computes the derivative, evaluates the slope at x0, constructs tangent line's equation, and visualizes both curve and tangent with the tangent point highlighted.
 * - Accessible, visually clear, with focus on color/labels for users with disabilities.
 *
 * @param {function} onBack - Callback function to return to previous options page.
 */
function TangentAtPointPanel({ onBack }) {
  // Input state
  const [curveExpr, setCurveExpr] = useState("");
  const [x0, setX0] = useState("");
  const [result, setResult] = useState({ latex: "", error: "", show: false, equationLatex: "", tangentData: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef();

  // Handles form submission and tangent calculation/visualization
  const handleSubmit = (e) => {
    // Dynamically import nerdamer plugins
    require("nerdamer/Calculus");
    require("nerdamer/Algebra");
    require("nerdamer/Solve");
    require("nerdamer/Extra");
    e.preventDefault();
    setIsSubmitting(true);
    setResult({ latex: "", error: "", show: false, equationLatex: "", tangentData: null });

    // Input validation
    if (!curveExpr.trim() || !x0.trim()) {
      setResult({
        latex: "",
        error: "Please enter both the curve equation (in x) and the value of x₀.",
        show: true,
        equationLatex: "",
        tangentData: null,
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
        tangentData: null,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Compute derivative string (symbolic)
      const derNerd = nerdamer(`diff(${curveExpr},x)`).toString();
      // 2. Compute y₀ = f(x₀)
      const y0Nerd = nerdamer(curveExpr, { x: xNum }).evaluate().text();
      const y0Num = Number(y0Nerd);
      // 3. Slope at x₀: m = f'(x₀)
      const mNerd = nerdamer(derNerd, { x: xNum }).evaluate().text();
      const mNum = Number(mNerd);
      if (!Number.isFinite(mNum) || !Number.isFinite(y0Num))
        throw new Error();
      // 4. Equation: y = m(x-x₀) + y₀ = m x + b, b = y₀ - m x₀
      const bNum = y0Num - mNum * xNum;
      const x0Latex = nerdamer(`latex(${xNum})`).toString();
      const y0Latex = nerdamer(`latex(${y0Num})`).toString();
      const mLatex = nerdamer(`latex(${mNum})`).toString();
      const bLatex = nerdamer(`latex(${bNum})`).toString();

      const lineLatex = `y = ${mLatex} x + ${bLatex}`;
      const detailsLatex =
        `\\text{Curve:}\\; y = ${nerdamer(
          `latex(${curveExpr})`
        ).toString()}\\\\` +
        `\\text{At } x_0 = ${x0Latex},~ y_0 = ${y0Latex}\\\\` +
        `\\text{Slope:}\\; m = ${mLatex}\\\\` +
        `\\text{Tangent line:}\\; \\boxed{ ${lineLatex} }`;

      // --- Visualization (Plotly) ---
      // Make evaluator for f(x)
      function curveEval(x) {
        try {
          return Number(nerdamer(curveExpr, { x }).evaluate().text());
        } catch {
          return NaN;
        }
      }
      // For tangent: y = mNum * x + bNum
      function tangentEval(x) {
        return mNum * x + bNum;
      }
      // Compute x range for plot (expand ~25% left/right from x₀, or around 0)
      let xMin = xNum - 4, xMax = xNum + 4;
      try {
        // Try to auto-size range: sample 9 points left/right in [x₀-2, x₀+2]
        const points = [];
        for (let dx = -2; dx <= 2.1; dx += 1) {
          points.push(xNum + dx);
        }
        // Try larger range if possible; avoid including wild NaNs
        const vals = points.map(curveEval).filter(v => Number.isFinite(v));
        if (vals.length >= 2) {
          xMin = Math.min(...points);
          xMax = Math.max(...points);
          // widen a bit for view, but cap
          const widen = 0.5 * Math.abs(xMax - xMin) + 1;
          xMin = Math.min(xMin, xNum - widen);
          xMax = Math.max(xMax, xNum + widen);
        }
      } catch { /* fallback leaves as default */ }
      // Final range
      const range = Math.abs(xMax - xMin);
      if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin === xMax) {
        xMin = xNum - 4; xMax = xNum + 4;
      }
      // Build sample points
      const nPts = 300;
      const xArr = [];
      for (let i = 0; i < nPts; ++i)
        xArr.push(xMin + (xMax - xMin) * i / (nPts - 1));
      // Compute y=f(x), y=tangent(x)
      const yCurve = xArr.map(curveEval);
      const yTangent = xArr.map(tangentEval);
      // Bounding for y-axis
      let yMin = Math.min(...yCurve.filter(Number.isFinite));
      let yMax = Math.max(...yCurve.filter(Number.isFinite));
      // If y-range degenerate, use x₀ ± 2 as fallback
      if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
        yMin = y0Num - 3; yMax = y0Num + 3;
      } else {
        const yPad = Math.max(0.25 * Math.abs(yMax - yMin), 1.7);
        yMin -= yPad; yMax += yPad;
      }

      // Traces for Plotly
      const curveTrace = {
        x: xArr,
        y: yCurve,
        name: "Curve: y = f(x)",
        mode: "lines",
        type: "scatter",
        line: { color: "#3587fb", width: 3 },
        hoverlabel: { bgcolor: "#e6f7ff", font: { color: "#17489b" } },
        marker: { color: "#3587fb" },
        showlegend: true
      };
      const tangentTrace = {
        x: xArr,
        y: yTangent,
        name: "Tangent Line at x₀",
        mode: "lines",
        type: "scatter",
        line: { color: "#e87a41", width: 3, dash: "dashdot" },
        hoverlabel: { bgcolor: "#ffedcc", font: { color: "#a54a06" } },
        marker: { color: "#e87a41" },
        showlegend: true
      };
      const pointTrace = {
        x: [xNum],
        y: [y0Num],
        name: "Tangent Point (x₀, f(x₀))",
        mode: "markers+text",
        type: "scatter",
        marker: {
          color: "#31d07e",
          size: 13,
          line: { width: 2, color: "#367445" },
          symbol: "circle"
        },
        text: ["(x₀, f(x₀))"],
        textposition: "top center",
        textfont: { color: "#33804c", size: 15, family: "inherit" },
        hovertemplate: `x₀ = ${xNum}<br>y₀ = ${y0Num}<extra>Tangent Point</extra>`,
        showlegend: true
      };

      const plotData = {
        data: [curveTrace, tangentTrace, pointTrace],
        layout: {
          title: {
            text: "Curve and Tangent at Selected Point",
            font: { size: 20, family: "inherit" },
            xref: "paper",
            x: 0.5,
          },
          legend: { x: 1, y: 1, bgcolor: "#fff", bordercolor: "#e3e7ee" },
          xaxis: { title: "x", range: [xMin, xMax], showgrid: true, zeroline: true, zerolinewidth: 2 },
          yaxis: { title: "y", range: [yMin, yMax], showgrid: true, zeroline: true, zerolinewidth: 2 },
          autosize: true,
          margin: { t: 68, l: 50, r: 30, b: 50 },
          paper_bgcolor: "#f9fbfd",
          plot_bgcolor: "#fafeff",
          font: { family: "inherit", size: 15 }
        },
        config: {
          responsive: true,
          displayModeBar: false,
          toImageButtonOptions: { format: "png", filename: "tangent-plot", scale: 2 }
        }
      };

      setResult({
        latex: detailsLatex,
        error: "",
        show: true,
        equationLatex: lineLatex,
        tangentData: plotData,
      });
    } catch (err) {
      setResult({
        latex: "",
        error:
          "Could not compute tangent. Please check your curve equation is valid and in terms of x, e.g. x^2 + 2.",
        show: true,
        equationLatex: "",
        tangentData: null,
      });
    }
    setIsSubmitting(false);
  };

  // Render result card and visualization
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
          maxWidth: 560,
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
          {/* Plot: curve, tangent, point */}
          {result.tangentData && (
            <div className="mb-1 mt-2" aria-label="Curve and tangent graph visualization">
              <Plot
                data={result.tangentData.data}
                layout={result.tangentData.layout}
                config={result.tangentData.config}
                style={{ width: "100%", height: "360px", minHeight: 250 }}
                useResizeHandler={true}
              />
              <div className="mt-1 small text-muted" aria-live="polite">
                <span style={{ color: "#3587fb", fontWeight: 600 }}>Blue</span>: curve 
                <span style={{ color: "#e87a41", fontWeight: 600 }}>Orange dashed</span>: tangent 
                <span style={{ color: "#31d07e" }}>Green dot</span>: tangent point
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="container py-5" style={{ maxWidth: 650 }}>
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
