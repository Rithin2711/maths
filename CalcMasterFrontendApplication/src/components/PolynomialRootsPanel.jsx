import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import PlotlyLite from "./PlotlyLite";
import nerdamer from "nerdamer";
import "nerdamer/Algebra";
import "nerdamer/Solve";

/**
 * Horner evaluation for coefficients in descending order [a_n, ..., a_0]
 */
function evalPolynomialAt(coeffsDesc, x) {
  let y = 0;
  for (const c of coeffsDesc) y = y * x + c;
  return y;
}

/**
 * Format complex number for display
 */
function formatComplex({ re, im }, precision = 10) {
  const r = Number.isFinite(re) ? Number(re.toFixed(precision)).toString() : "NaN";
  const iAbs = Number.isFinite(im) ? Number(Math.abs(im).toFixed(precision)).toString() : "NaN";
  if (!Number.isFinite(im) || Math.abs(im) < 1e-12) return r;
  const sign = im >= 0 ? "+" : "−";
  return `${r} ${sign} ${iAbs}i`;
}

/**
 * Compute roots using nerdamer when possible; fallback to crude real root finder for real roots
 */
function computeRootsFromCoeffs(coeffsDesc) {
  // Build polynomial expression string, e.g., "1*x^3 + -6*x^2 + 11*x + -6"
  const n = coeffsDesc.length - 1;
  const terms = coeffsDesc.map((c, i) => {
    const pow = n - i;
    if (Math.abs(c) < 1e-14) return null;
    if (pow === 0) return `${c}`;
    if (pow === 1) return `${c}*x`;
    return `${c}*x^${pow}`;
  }).filter(Boolean);
  const expr = terms.length ? terms.join(" + ") : "0";

  // Try nerdamer roots
  try {
    const r = nerdamer(`roots(${expr})`).evaluate(); // list
    const asString = r.toString().replace(/^\[|\]$/g, "");
    const parts = asString.length ? asString.split(",") : [];
    const numeric = parts
      .map((s) => s.trim())
      .filter((s) => s.length)
      .map((s) => {
        if (/i/.test(s)) {
          const re = Number(nerdamer(`realpart(${s})`).evaluate().text());
          const im = Number(nerdamer(`imagpart(${s})`).evaluate().text());
          return { re, im };
        } else {
          const re = Number(nerdamer(s).evaluate().text());
          return { re, im: 0 };
        }
      });
    return { numeric, expr, latex: nerdamer(`latex(${r.toString()})`).toString() };
  } catch (_e) {
    // Fallback: rough scan for real roots with bisection
    const degree = n;
    const realRoots = [];
    const guessRange = 5 + 5 * degree;
    const samples = 600;
    let prevX = -guessRange;
    let prevY = evalPolynomialAt(coeffsDesc, prevX);
    for (let i = 1; i <= samples; i++) {
      const x = -guessRange + (2 * guessRange * i) / samples;
      const y = evalPolynomialAt(coeffsDesc, x);
      if (prevY === 0) realRoots.push(prevX);
      if (y === 0) realRoots.push(x);
      if (prevY * y < 0) {
        let a = prevX;
        let b = x;
        let ya = prevY;
        for (let it = 0; it < 60; it++) {
          const m = 0.5 * (a + b);
          const ym = evalPolynomialAt(coeffsDesc, m);
          if (Math.abs(ym) < 1e-12) {
            a = b = m;
            break;
          }
          if (ya * ym <= 0) {
            b = m;
          } else {
            a = m;
            ya = ym;
          }
        }
        realRoots.push(0.5 * (a + b));
      }
      prevX = x;
      prevY = y;
    }
    const uniq = [];
    realRoots.sort((a, b) => a - b).forEach((r) => {
      if (uniq.length === 0 || Math.abs(r - uniq[uniq.length - 1]) > 1e-6) uniq.push(r);
    });
    return { numeric: uniq.map((re) => ({ re, im: 0 })), expr, latex: "" };
  }
}

// PUBLIC_INTERFACE
/**
 * PolynomialRootsPanel
 * Step-by-step UI:
 *  - Step 1: ask for degree n
 *  - Step 2: show n+1 coefficient inputs (descending order)
 *  - Compute roots and plot polynomial
 */
function PolynomialRootsPanel({ onBack }) {
  const [step, setStep] = useState(1);
  const [degree, setDegree] = useState(2);
  const [coeffs, setCoeffs] = useState([1, 0, 0]); // default for degree 2: ax^2 + bx + c
  const [error, setError] = useState("");
  const [numericRoots, setNumericRoots] = useState([]); // array of {re, im}
  const [latexRoots, setLatexRoots] = useState(""); // LaTeX list if available

  const handleDegreeSubmit = (e) => {
    e.preventDefault();
    setError("");
    const n = Number(degree);
    if (!Number.isInteger(n) || n < 1 || n > 12) {
      setError("Please enter an integer degree between 1 and 12.");
      return;
    }
    // Initialize n+1 coefficient inputs
    const initial = Array.from({ length: n + 1 }, (_, i) => (i === 0 ? 1 : 0));
    setCoeffs(initial);
    setNumericRoots([]);
    setLatexRoots("");
    setStep(2);
  };

  const handleCoeffChange = (idx, val) => {
    const next = coeffs.slice();
    const v = val.trim();
    next[idx] = v === "" || v === "-" || v === "+" ? v : Number(v);
    setCoeffs(next);
  };

  const normalizeCoeffs = () => {
    // Convert to numbers, treat empty/"-" as 0
    const arr = coeffs.map((c) => (typeof c === "number" && Number.isFinite(c) ? c : Number(c) || 0));
    // Remove leading zeros but keep at least one term
    let k = 0;
    while (arr.length - k > 1 && Math.abs(arr[k]) < 1e-14) k++;
    return arr.slice(k);
  };

  const handleSolve = (e) => {
    e.preventDefault();
    setError("");
    setNumericRoots([]);
    setLatexRoots("");
    const cleanCoeffs = normalizeCoeffs();
    if (cleanCoeffs.length < 2) {
      setError("Please provide a valid set of coefficients (leading coefficient cannot be 0).");
      return;
    }
    const { numeric, latex } = computeRootsFromCoeffs(cleanCoeffs);
    setNumericRoots(numeric);
    setLatexRoots(latex || "");
  };

  const plotSpec = useMemo(() => {
    const cleanCoeffs = normalizeCoeffs();
    if (cleanCoeffs.length === 0) return null;
    // Range from roots if any real, else default
    const realRoots = numericRoots.filter((z) => Math.abs(z.im) < 1e-12).map((z) => z.re);
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    if (realRoots.length > 0) {
      minX = Math.min(...realRoots);
      maxX = Math.max(...realRoots);
    }
    const deg = cleanCoeffs.length - 1;
    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || minX === maxX) {
      minX = -5 - deg;
      maxX = 5 + deg;
    } else {
      const pad = Math.max(1, 0.25 * Math.max(1, Math.abs(maxX - minX)));
      minX -= pad;
      maxX += pad;
    }

    const N = 500;
    const xs = [];
    const ys = [];
    for (let i = 0; i <= N; i++) {
      const x = minX + ((maxX - minX) * i) / N;
      xs.push(x);
      ys.push(evalPolynomialAt(cleanCoeffs, x));
    }

    const curveTrace = {
      x: xs,
      y: ys,
      type: "scatter",
      mode: "lines",
      name: "p(x)",
      line: { color: "#2563eb", width: 2 },
      hovertemplate: "x=%{x:.4g}<br>y=%{y:.4g}<extra></extra>",
    };

    const rootsPts = realRoots.map((x) => ({ x, y: 0 }));
    const rootsTrace = rootsPts.length
      ? {
          x: rootsPts.map((p) => p.x),
          y: rootsPts.map((p) => p.y),
          type: "scatter",
          mode: "markers+text",
          name: "Real Roots",
          marker: { color: "#d97706", size: 10, symbol: "x" },
          text: rootsPts.map((p, i) => `r${i + 1}=${p.x.toFixed(4)}`),
          textposition: "top center",
          hovertemplate: "root x=%{x:.6g}<extra></extra>",
        }
      : null;

    const layout = {
      title: { text: "Polynomial p(x) and Real Roots", font: { size: 16 } },
      margin: { l: 50, r: 10, t: 50, b: 40 },
      xaxis: { title: { text: "x" }, zeroline: true, zerolinecolor: "#bbb", showgrid: true, gridcolor: "#f3f4f6", range: [minX, maxX] },
      yaxis: { title: { text: "y = p(x)" }, zeroline: true, zerolinecolor: "#bbb", showgrid: true, gridcolor: "#f3f4f6" },
      paper_bgcolor: "white",
      plot_bgcolor: "white",
      hovermode: "closest",
      legend: { orientation: "h", y: -0.2 },
    };
    const data = rootsTrace ? [curveTrace, rootsTrace] : [curveTrace];
    const config = { responsive: true, displaylogo: false };
    return { data, layout, config };
  }, [coeffs, numericRoots]);

  const cleanCoeffs = normalizeCoeffs();
  const polySummary = (() => {
    const n = cleanCoeffs.length - 1;
    const terms = cleanCoeffs.map((c, i) => {
      const pow = n - i;
      if (Math.abs(c) < 1e-14) return null;
      if (pow === 0) return `${c}`;
      if (pow === 1) return `${c}x`;
      return `${c}x^${pow}`;
    }).filter(Boolean);
    return terms.length ? terms.join(" + ") : "0";
  })();

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Find Polynomial Roots</h2>
        <button className="btn btn-outline-secondary" onClick={onBack} aria-label="Back to Home">
          ← Back
        </button>
      </div>

      {step === 1 && (
        <form onSubmit={handleDegreeSubmit} className="card shadow-sm border-0 mb-3" style={{ borderRadius: 12 }}>
          <div className="card-body">
            <h3 className="h6 fw-bold mb-3">Step 1: Enter Degree (n)</h3>
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-6">
                <label htmlFor="polyDegree" className="form-label">Degree n (1 - 12)</label>
                <input
                  id="polyDegree"
                  type="number"
                  className="form-control"
                  min={1}
                  max={12}
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  aria-label="Polynomial degree"
                />
                <div className="form-text">A polynomial of degree n has n+1 coefficients.</div>
              </div>
              <div className="col-12 col-md-6 d-flex gap-2">
                <button type="submit" className="btn btn-primary">Next</button>
                <button type="button" className="btn btn-outline-secondary" onClick={onBack}>Cancel</button>
              </div>
            </div>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSolve} className="card shadow-sm border-0 mb-3" style={{ borderRadius: 12 }}>
          <div className="card-body">
            <h3 className="h6 fw-bold mb-3">Step 2: Enter Coefficients (Descending Order)</h3>
            <p className="text-muted small mb-2">
              Enter coefficients a<sub>n</sub>, a<sub>n-1</sub>, ..., a<sub>0</sub> for p(x) = a<sub>n</sub>x<sup>n</sup> + ... + a<sub>0</sub>.
            </p>
            <div className="row g-2">
              {coeffs.map((c, idx) => {
                const n = coeffs.length - 1;
                const pow = n - idx;
                return (
                  <div className="col-6 col-md-3 col-lg-2" key={idx}>
                    <label className="form-label small" htmlFor={`coeff-${idx}`}>
                      a<sub>{pow}</sub>
                    </label>
                    <input
                      id={`coeff-${idx}`}
                      type="text"
                      inputMode="decimal"
                      className="form-control"
                      value={typeof c === "number" ? String(c) : c}
                      onChange={(e) => handleCoeffChange(idx, e.target.value)}
                      aria-label={`Coefficient a_${pow}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="submit" className="btn btn-success">Solve and Plot</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setStep(1)}>Back</button>
            </div>
          </div>
        </form>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Results */}
      {numericRoots.length > 0 || latexRoots ? (
        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body">
                <h3 className="h6 fw-bold mb-3">Results</h3>
                <div className="mb-2">
                  <div className="text-muted small">Polynomial:</div>
                  <code className="d-block bg-light p-2 rounded" style={{ whiteSpace: "pre-wrap" }}>
                    p(x) = {polySummary}
                  </code>
                </div>
                {latexRoots ? (
                  <div className="mb-2">
                    <div className="text-muted small">Symbolic Roots (LaTeX):</div>
                    <code className="d-block bg-light p-2 rounded" style={{ whiteSpace: "pre-wrap" }}>
                      {latexRoots}
                    </code>
                  </div>
                ) : (
                  <div className="text-muted small">Symbolic roots unavailable for this polynomial.</div>
                )}
                <div className="mt-2">
                  <div className="text-muted small">Numeric Roots:</div>
                  <ul className="mb-0">
                    {numericRoots.length > 0 ? (
                      numericRoots.map((z, i) => (
                        <li key={i}>
                          r{i + 1} = <code>{formatComplex(z)}</code>
                        </li>
                      ))
                    ) : (
                      <li>No numeric roots found.</li>
                    )}
                  </ul>
                </div>
                <div className="form-text mt-2">
                  Real roots are shown on the plot at y = 0.
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm" style={{ borderRadius: 12, minHeight: 420 }}>
              <div className="card-body">
                <h3 className="h6 fw-bold mb-3">Graph of p(x)</h3>
                {plotSpec ? (
                  <PlotlyLite
                    data={plotSpec.data}
                    layout={plotSpec.layout}
                    config={plotSpec.config}
                    style={{ width: "100%", height: 360 }}
                    useResizeHandler={true}
                  />
                ) : (
                  <div className="text-muted small">Provide valid coefficients to see the plot.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        !error && step === 2 && (
          <div className="alert alert-info" role="note">
            Enter coefficients and click "Solve and Plot" to compute the roots and draw the graph.
          </div>
        )
      )}
    </div>
  );
}

PolynomialRootsPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default PolynomialRootsPanel;
