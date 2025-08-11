import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import nerdamer from "nerdamer";
import "nerdamer/Calculus";
import "nerdamer/Algebra";
import "nerdamer/Solve";
import "nerdamer/Extra";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";
import Plot from "react-plotly.js";

// PUBLIC_INTERFACE
/**
 * Panel for Area Between Curves: Takes equations for top (f(x)), bottom (g(x)), x-lower, x-upper;
 * Calculates ∫[a,b] (f(x)-g(x)) dx, displays in LaTeX, and visualizes the curves + shaded area.
 * @param {function} onBack - Callback to return to previous options page.
 */
function AreaOfFigurePanel({ onBack }) {
  const [topExpr, setTopExpr] = useState("");
  const [botExpr, setBotExpr] = useState("");
  const [xl, setXl] = useState("");
  const [xu, setXu] = useState("");
  const [result, setResult] = useState({
    latex: "",
    numeric: "",
    error: "",
    latexIntegrand: "",
    formulaLatex: "",
    show: false,
  });
  const [plotData, setPlotData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const topInputRef = useRef();
  const botInputRef = useRef();

  // Evaluates a math expression string as a function of x using nerdamer
  function makeNerdamerEvalFunc(expr) {
    // Returns a function: x -> value
    try {
      return function(x) {
        try {
          const res = nerdamer(expr, { x }).evaluate();
          return Number(res.text());
        } catch {
          return NaN;
        }
      };
    } catch {
      return (_x) => NaN;
    }
  }

  // Handles form submission, area computation, and prepares plot data
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult({
      latex: "",
      numeric: "",
      error: "",
      latexIntegrand: "",
      formulaLatex: "",
      show: false,
    });
    setPlotData(null);
    // Validation
    if (!topExpr.trim() || !botExpr.trim() || !xl.trim() || !xu.trim()) {
      setResult((r) => ({
        ...r,
        error: "Please fill in all fields: both equations and both x-bounds.",
        show: true,
      }));
      setIsSubmitting(false);
      return;
    }
    let intVar = "x";
    try {
      // Prepare expressions and bounds
      const diff = `(${topExpr})-(${botExpr})`;
      let lowerVal = "", upperVal = "";
      try {
        lowerVal = nerdamer(xl).evaluate().text();
        upperVal = nerdamer(xu).evaluate().text();
      } catch {
        throw new Error("Invalid x-bound values. Use numbers or expressions involving pi/e.");
      }
      const a = Number(lowerVal), b = Number(upperVal);
      if (!isFinite(a) || !isFinite(b) || a === b) throw new Error("Bounds must be real and distinct.");

      // Symbolic integral, latex, etc.
      let symIntegral, latexIntegral, latexIntegrand;
      try {
        symIntegral = nerdamer(`integrate(${diff},${intVar})`).toString();
        latexIntegral = nerdamer(`latex(integrate(${diff},${intVar}))`).toString();
        latexIntegrand = nerdamer(`latex(${diff})`).toString();
      } catch (err) {
        throw new Error("Integration failed (check your equations). " + (err?.message || ""));
      }

      // Numeric evaluation at bounds
      function evalAt(edge, integral, variable) {
        try {
          return nerdamer(integral).substitute(variable, edge).evaluate().text();
        } catch {
          return "NaN";
        }
      }
      let valUpper = evalAt(upperVal, symIntegral, intVar);
      let valLower = evalAt(lowerVal, symIntegral, intVar);

      let areaValue;
      try {
        areaValue = nerdamer(`(${valUpper})-(${valLower})`).evaluate().text();
      } catch {
        areaValue = "NaN";
      }

      const areaFormulaLatex = `A = \\int_{${nerdamer(`latex(${xl})`)} }^{${nerdamer(`latex(${xu})`)} } \\Big( ${latexIntegrand} \\Big)\\,dx`;

      // --- Build Plot Data ---
      // Use n steps for a smooth curve/area
      const n = 400;
      const xMin = Math.min(a, b), xMax = Math.max(a, b);
      const step = (xMax - xMin) / (n - 1);
      const xArr = [];
      for (let i = 0; i < n; ++i) xArr.push(xMin + step * i);

      // Build y=f(x), y=g(x)
      const f = makeNerdamerEvalFunc(topExpr);
      const g = makeNerdamerEvalFunc(botExpr);
      const yTop = xArr.map(f);
      const yBot = xArr.map(g);

      // Area fill (between f(x) and g(x))
      const areaX = [...xArr, ...xArr.slice().reverse()];
      const areaY = [...yBot, ...yTop.slice().reverse()];

      // Error handling for too many NaNs
      let badF = yTop.filter(val => !isFinite(val)).length, badG = yBot.filter(val => !isFinite(val)).length;
      if (badF > n * 0.5 || badG > n * 0.5)
        throw new Error("Curves cannot be visualized for some x, check your function definitions or try a different interval.");

      // Plotly traces
      const plotSeries = [
        {
          x: xArr,
          y: yTop,
          type: "scatter",
          mode: "lines",
          name: "Top: f(x)",
          line: {color: "#4ab66d", width: 3},
        },
        {
          x: xArr,
          y: yBot,
          type: "scatter",
          mode: "lines",
          name: "Bottom: g(x)",
          line: {color: "#e69f4d", width: 3, dash: "dot"},
        },
        {
          x: areaX,
          y: areaY,
          fill: "toself",
          fillcolor: "rgba(72,175,239,0.20)",
          line: {color: "rgba(144,185,245,0.5)", width: 0.5},
          name: "Shaded Area",
          type: "scatter",
          mode: "lines",
          showlegend: true,
        },
      ];

      // Axes
      const minY = Math.min(...yTop, ...yBot), maxY = Math.max(...yTop, ...yBot);
      const margin = 0.12 * Math.abs(maxY - minY || 1);

      setResult({
        latex: `${areaFormulaLatex} = ${areaValue}`,
        numeric: areaValue,
        error: "",
        latexIntegrand: latexIntegrand,
        formulaLatex: areaFormulaLatex,
        show: true,
      });
      setPlotData({
        data: plotSeries,
        layout: {
          title: "Visualization of Area Between Curves",
          autosize: true,
          showlegend: true,
          legend: { x: 1, y: 1 },
          xaxis: { title: "x", range: [xMin, xMax], zeroline: true, zerolinewidth: 2 },
          yaxis: { title: "y", range: [minY - margin, maxY + margin], zeroline: true, zerolinewidth: 2 },
          margin: { t: 48, l: 56, r: 24, b: 56 },
          paper_bgcolor: "#f9fbfd",
          plot_bgcolor: "#fafeff",
          font: { family: "inherit", size: 15 }
        },
        config: { responsive: true, displayModeBar: true }
      });
    } catch (err) {
      setResult({
        ...result,
        error:
          typeof err === "string"
            ? err
            : err?.message ||
              "An error occurred. Please check your input equations and bounds.",
        show: true,
      });
      setPlotData(null);
    }
    setIsSubmitting(false);
  };

  // Helper LaTeX rendering for the integrand and summary
  const renderResult = () => {
    if (!result.show) return null;
    if (result.error) {
      return (
        <div
          className="alert alert-danger mt-3"
          role="alert"
          style={{ borderRadius: 10, fontSize: "1.03rem" }}
          tabIndex={0}
        >
          <span style={{ fontSize: 20, marginRight: 6 }}>❌</span>
          {result.error}
        </div>
      );
    }
    return (
      <div className="card shadow-sm my-4 animate__animated animate__fadeInUp" style={{ borderRadius: 13, maxWidth: 490, margin: "0 auto", background: "#fffefd" }} tabIndex={0} aria-live="polite">
        <div className="card-body">
          <h3 className="card-title fs-5 fw-bold mb-3">Area Calculation</h3>
          <div style={{ fontSize: "1.13rem", marginBottom: 16 }}>
            {/* Display the area formula as definite integral */}
            <BlockMath>{result.formulaLatex}</BlockMath>
            <span style={{ fontWeight: 600, fontSize: "1.16rem", color: "#32934a" }}>
              Final Area:{" "}
              <span style={{ fontWeight: "bold", color: "#17702b", background: "#f9fff5", borderRadius: 6, padding: "2px 10px" }}>
                {result.numeric}
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  // The Plotly figure
  const renderPlot = () => {
    if (plotData && result.show && !result.error) {
      return (
        <div className="card bg-white shadow-sm my-4 py-3 px-1 animate__animated animate__fadeInUp"
             style={{ borderRadius: 16, maxWidth: 650, margin: "0 auto" }}>
          <div className="card-body">
            <Plot
              data={plotData.data}
              layout={plotData.layout}
              config={plotData.config}
              style={{ width: "100%", height: "380px", minHeight: 300 }}
              useResizeHandler={true}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="container py-5" style={{ maxWidth: 630 }}>
      <h2 className="fw-bold text-success mb-4" tabIndex={0}>
        🟩 Area of a Figure (Between Curves)
      </h2>
      <form autoComplete="off" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="top-curve" className="form-label fw-semibold">
            Top Curve/Line <span className="text-secondary ms-1" style={{ fontWeight: 400, fontSize: 14 }}>(y = f(x))</span>
          </label>
          <input
            ref={topInputRef}
            id="top-curve"
            className="form-control"
            type="text"
            value={topExpr}
            onChange={e => setTopExpr(e.target.value)}
            placeholder="e.g. x^2 + 3"
            inputMode="text"
            style={{ borderRadius: 10, fontFamily: "Menlo, monospace", fontSize: "1.08rem" }}
            autoComplete="off"
            required
            aria-label="Equation for the top curve, y = f(x)"
            spellCheck={false}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="bottom-curve" className="form-label fw-semibold">
            Bottom Curve/Line <span className="text-secondary ms-1" style={{ fontWeight: 400, fontSize: 14 }}>(y = g(x))</span>
          </label>
          <input
            ref={botInputRef}
            id="bottom-curve"
            className="form-control"
            type="text"
            value={botExpr}
            onChange={e => setBotExpr(e.target.value)}
            placeholder="e.g. 2*x"
            inputMode="text"
            style={{ borderRadius: 10, fontFamily: "Menlo, monospace", fontSize: "1.08rem" }}
            autoComplete="off"
            required
            aria-label="Equation for the bottom curve, y = g(x)"
            spellCheck={false}
          />
        </div>
        <div className="mb-3 row">
          <div className="col">
            <label htmlFor="x-lower" className="form-label fw-semibold">
              Lower x-bound
            </label>
            <input
              id="x-lower"
              className="form-control"
              type="text"
              value={xl}
              onChange={e => setXl(e.target.value)}
              placeholder="e.g. 0"
              inputMode="decimal"
              style={{ borderRadius: 10 }}
              autoComplete="off"
              required
              aria-label="Lower x-bound"
              spellCheck={false}
            />
          </div>
          <div className="col">
            <label htmlFor="x-upper" className="form-label fw-semibold">
              Upper x-bound
            </label>
            <input
              id="x-upper"
              className="form-control"
              type="text"
              value={xu}
              onChange={e => setXu(e.target.value)}
              placeholder="e.g. 2"
              inputMode="decimal"
              style={{ borderRadius: 10 }}
              autoComplete="off"
              required
              aria-label="Upper x-bound"
              spellCheck={false}
            />
          </div>
        </div>
        <div className="mb-3 small text-muted">
          Enter expressions in terms of <strong>x</strong>. Bounds may use numbers or constants (e.g., π, e, sqrt(2)).<br />
          The result is the shaded area between y = <code>f(x)</code> (top) and y = <code>g(x)</code> (bottom).
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
            className="btn btn-success"
            disabled={isSubmitting}
            style={{ borderRadius: 10, fontWeight: 600, minWidth: 120 }}
            aria-label="Compute Area"
          >
            {isSubmitting ? "Calculating..." : "Calculate Area"}
          </button>
        </div>
      </form>
      {renderResult()}
      {renderPlot()}
    </main>
  );
}

AreaOfFigurePanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default AreaOfFigurePanel;
