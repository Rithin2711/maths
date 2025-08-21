import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import PlotlyLite from "./PlotlyLite";
import nerdamer from "nerdamer";
import "nerdamer/Algebra";
import "nerdamer/Solve";

/**
 * Utility: Try to parse a polynomial in x to an array of coefficients (highest...lowest).
 * Accepts inputs like:
 *   "x^3 - 6x^2 + 11x - 6"
 *   "3x^4 + 2x - 7"
 *   "x^2 + 1"
 * Fallback: if parsing fails, returns null.
 */
function parsePolynomialToCoeffs(exprRaw) {
  if (!exprRaw || !exprRaw.trim()) return null;
  // Normalize input spacing and signs
  const expr = exprRaw
    .replace(/\s+/g, "")
    .replace(/−/g, "-") // minus sign
    .replace(/−/g, "-");

  // If user provides comma-separated coefficients in descending order, support it:
  // e.g. "1,-6,11,-6" => x^3 - 6x^2 + 11x - 6
  if (/^[+\-]?\d+(\.\d+)?(,[+\-]?\d+(\.\d+)?)+$/.test(expr)) {
    const coeffs = expr.split(",").map((c) => Number(c));
    if (coeffs.every((n) => Number.isFinite(n))) return coeffs;
  }

  // Use a simple tokenizer for terms of the form ax^n, ax, a
  // Split into terms by sign, but keep the sign with the term
  const terms = expr
    .replace(/^\+/, "")
    .replace(/-/g, "±")
    .split("±")
    .filter((t) => t.length > 0)
    .map((t, idx) => (expr.startsWith("-") && idx === 0 ? "-" + t : t.startsWith("+") ? t.slice(1) : t));

  // Detect highest power
  let maxPow = 0;
  const parsedTerms = [];
  for (const term of terms) {
    // Match: [sign][coeff?]x^[pow]? | [sign][coeff?]x | [sign][const]
    // Examples: -3x^2, x^3, 2x, -x, +7
    const mPow = term.match(/^([+\-]?\d*\.?\d*)x\^([+\-]?\d+)$/i);
    const mLin = term.match(/^([+\-]?\d*\.?\d*)x$/i);
    const mConst = term.match(/^([+\-]?\d*\.?\d*)$/i);

    if (mPow) {
      let c = mPow[1];
      const p = parseInt(mPow[2], 10);
      if (!Number.isFinite(p)) return null;
      if (c === "" || c === "+" || c === undefined) c = "1";
      if (c === "-") c = "-1";
      const coeff = Number(c);
      if (!Number.isFinite(coeff)) return null;
      parsedTerms.push({ pow: p, coeff });
      if (p > maxPow) maxPow = p;
      continue;
    }
    if (mLin) {
      let c = mLin[1];
      if (c === "" || c === "+" || c === undefined) c = "1";
      if (c === "-") c = "-1";
      const coeff = Number(c);
      if (!Number.isFinite(coeff)) return null;
      parsedTerms.push({ pow: 1, coeff });
      if (1 > maxPow) maxPow = 1;
      continue;
    }
    if (mConst) {
      const c = mConst[1] === "" || mConst[1] === undefined ? "0" : mConst[1];
      const coeff = Number(c);
      if (!Number.isFinite(coeff)) return null;
      parsedTerms.push({ pow: 0, coeff });
      if (0 > maxPow) maxPow = 0;
      continue;
    }
    // Unrecognized term format
    return null;
  }

  // Build coefficient array from highest to lowest power
  const coeffs = Array.from({ length: maxPow + 1 }, () => 0);
  for (const { pow, coeff } of parsedTerms) {
    coeffs[maxPow - pow] += coeff;
  }
  // Drop leading zeros if any (but keep at least constant)
  while (coeffs.length > 1 && Math.abs(coeffs[0]) < 1e-14) coeffs.shift();
  return coeffs;
}

function evalPolynomialAt(coeffsDesc, x) {
  // coeffsDesc is [a_n, a_{n-1}, ..., a_0]; Horner's method
  let y = 0;
  for (const c of coeffsDesc) y = y * x + c;
  return y;
}

function formatComplex({ re, im }, precision = 10) {
  const r = Number.isFinite(re) ? Number(re.toFixed(precision)).toString() : "NaN";
  const i = Number.isFinite(im) ? Number(Math.abs(im).toFixed(precision)).toString() : "NaN";
  if (!Number.isFinite(im) || Math.abs(im) < 1e-12) return r;
  const sign = im >= 0 ? "+" : "−";
  return `${r} ${sign} ${i}i`;
}

function rootsSymbolicLatex(expr) {
  try {
    const r = nerdamer(`roots(${expr})`).evaluate(); // returns list-like
    const latex = nerdamer(`latex(${r.toString()})`).toString();
    return { ok: true, latex, rootsRaw: r };
  } catch (e) {
    return { ok: false, latex: "", rootsRaw: null };
  }
}

// PUBLIC_INTERFACE
/**
 * PolynomialRootsPanel
 * UI to enter a polynomial in x, compute its roots (numeric and/or symbolic), and plot the curve with real roots on x-axis.
 */
function PolynomialRootsPanel({ onBack }) {
  const [poly, setPoly] = useState("");
  const [error, setError] = useState("");
  const [numericRoots, setNumericRoots] = useState([]); // array of {re, im}
  const [latexRoots, setLatexRoots] = useState("");
  const [coeffs, setCoeffs] = useState(null); // descending coefficients

  const handleCompute = (e) => {
    e.preventDefault();
    setError("");
    setNumericRoots([]);
    setLatexRoots("");
    setCoeffs(null);

    if (!poly.trim()) {
      setError("Enter a polynomial, e.g., x^3 - 6x^2 + 11x - 6, or comma-separated coefficients like 1,-6,11,-6.");
      return;
    }

    // Try to get symbolic roots via nerdamer
    const sym = rootsSymbolicLatex(poly);
    if (sym.ok) setLatexRoots(sym.latex);

    // Try to parse polynomial to get numeric roots and plotting
    const parsed = parsePolynomialToCoeffs(poly);
    if (!parsed) {
      // If parsing failed, try to ask nerdamer for numeric approximations
      try {
        const r = nerdamer(`roots(${poly})`).evaluate();
        // r might be like [1,2,3] or [1+i, 1-i]
        const asString = r.toString().replace(/^\[|\]$/g, "");
        const parts = asString.length ? asString.split(",") : [];
        const numeric = parts
          .map((s) => s.trim())
          .filter((s) => s.length)
          .map((s) => {
            // crude parse: if contains 'i', interpret simple a+bi
            if (/i/.test(s)) {
              // Replace unary + for safety
              let m = s.match(/^([+\-]?\d*\.?\d*)([+\-]\d*\.?\d*)i$/);
              if (m) {
                const re = Number(m[1] || "0");
                const im = Number(m[2] || "0");
                return { re, im };
              }
              // fallback approximate: let nerdamer give numeric real/imag
              const re = Number(nerdamer(`realpart(${s})`).evaluate().text());
              const im = Number(nerdamer(`imagpart(${s})`).evaluate().text());
              return { re, im };
            } else {
              const re = Number(nerdamer(s).evaluate().text());
              return { re, im: 0 };
            }
          });
        setNumericRoots(numeric);
      } catch (err) {
        setError(
          "Could not parse the polynomial. Please ensure it is in x (e.g., x^3 - 6x^2 + 11x - 6) or as comma-separated coefficients."
        );
      }
      return;
    }

    setCoeffs(parsed);

    // Compute numeric roots using nerdamer's numeric form for robustness
    try {
      const r = nerdamer(`roots(${poly})`).evaluate();
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
      setNumericRoots(numeric);
    } catch (err) {
      // As a fallback, try simple numeric scanning for real roots (bisection on rough grid)
      const realRoots = [];
      const degree = parsed.length - 1;
      const guessRange = 5 + 5 * degree;
      const samples = 400;
      let prevX = -guessRange;
      let prevY = evalPolynomialAt(parsed, prevX);
      for (let i = 1; i <= samples; i++) {
        const x = -guessRange + (2 * guessRange * i) / samples;
        const y = evalPolynomialAt(parsed, x);
        if (prevY === 0) realRoots.push(prevX);
        if (y === 0) realRoots.push(x);
        if (prevY * y < 0) {
          // bisection refine
          let a = prevX;
          let b = x;
          let ya = prevY;
          for (let it = 0; it < 50; it++) {
            const m = 0.5 * (a + b);
            const ym = evalPolynomialAt(parsed, m);
            if (Math.abs(ym) < 1e-10) {
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
      setNumericRoots(uniq.map((re) => ({ re, im: 0 })));
    }
  };

  // Build plot spec for real-valued domain
  const plotSpec = useMemo(() => {
    if (!coeffs || !Array.isArray(coeffs) || coeffs.length === 0) return null;

    // Determine x-range using numeric roots if any, else default based on degree
    const realRoots = numericRoots.filter((r) => Math.abs(r.im) < 1e-12).map((r) => r.re);
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;

    if (realRoots.length > 0) {
      minX = Math.min(...realRoots);
      maxX = Math.max(...realRoots);
    }
    const deg = coeffs.length - 1;

    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || minX === maxX) {
      // default
      minX = -5 - deg;
      maxX = 5 + deg;
    } else {
      const pad = Math.max(1, 0.25 * Math.max(1, Math.abs(maxX - minX)));
      minX -= pad;
      maxX += pad;
    }

    // Sample polynomial
    const N = 400;
    const xs = [];
    const ys = [];
    for (let i = 0; i <= N; i++) {
      const x = minX + ((maxX - minX) * i) / N;
      xs.push(x);
      ys.push(evalPolynomialAt(coeffs, x));
    }

    // Traces: curve and real roots as markers
    const curveTrace = {
      x: xs,
      y: ys,
      type: "scatter",
      mode: "lines",
      name: "p(x)",
      line: { color: "#1f77b4", width: 2 },
      hovertemplate: "x=%{x:.4g}<br>y=%{y:.4g}<extra></extra>",
    };

    const realRootPts = realRoots.map((x) => ({ x, y: 0 }));
    const rootsTrace =
      realRootPts.length > 0
        ? {
            x: realRootPts.map((p) => p.x),
            y: realRootPts.map((p) => p.y),
            type: "scatter",
            mode: "markers+text",
            name: "Real Roots",
            marker: { color: "#d62728", size: 10, symbol: "x" },
            text: realRootPts.map((p, idx) => `r${idx + 1}=${p.x.toFixed(4)}`),
            textposition: "top center",
            hovertemplate: "root x=%{x:.6g}<extra></extra>",
          }
        : null;

    const layout = {
      title: { text: "Polynomial and Real Roots", font: { size: 16 } },
      margin: { l: 50, r: 10, t: 50, b: 40 },
      xaxis: {
        title: { text: "x" },
        zeroline: true,
        zerolinecolor: "#cccccc",
        showgrid: true,
        gridcolor: "#f5f5f5",
        range: [minX, maxX],
      },
      yaxis: {
        title: { text: "y = p(x)" },
        zeroline: true,
        zerolinecolor: "#cccccc",
        showgrid: true,
        gridcolor: "#f5f5f5",
      },
      paper_bgcolor: "white",
      plot_bgcolor: "white",
      hovermode: "closest",
      legend: { orientation: "h", y: -0.2 },
    };

    const data = rootsTrace ? [curveTrace, rootsTrace] : [curveTrace];
    const config = { responsive: true, displaylogo: false };
    return { data, layout, config };
  }, [coeffs, numericRoots]);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Find Polynomial Roots</h2>
        <button className="btn btn-outline-secondary" onClick={onBack} aria-label="Back to Home">
          ← Back
        </button>
      </div>

      <form onSubmit={handleCompute}>
        <div className="mb-3">
          <label htmlFor="polyExpr" className="form-label fw-bold">Polynomial</label>
          <input
            id="polyExpr"
            type="text"
            className="form-control"
            placeholder='e.g., x^3 - 6x^2 + 11x - 6  or coefficients: 1,-6,11,-6'
            value={poly}
            onChange={(e) => setPoly(e.target.value)}
            aria-label="Polynomial expression"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="form-text">
            Use x as the variable. Coefficients can be integers or decimals. You can also enter comma-separated coefficients in descending order.
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Compute Roots</button>
      </form>

      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

      {/* Results section */}
      {(!error && (numericRoots.length > 0 || latexRoots)) && (
        <div className="mt-4">
          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm" style={{ borderRadius: 12 }}>
                <div className="card-body">
                  <h3 className="h6 fw-bold mb-3">Roots</h3>
                  {latexRoots ? (
                    <div className="mb-2">
                      <div className="text-muted small">Symbolic (KaTeX not required here; using LaTeX string):</div>
                      <code className="d-block bg-light p-2 rounded" style={{ whiteSpace: "pre-wrap" }}>
                        {latexRoots}
                      </code>
                    </div>
                  ) : (
                    <div className="text-muted small">Symbolic form not available.</div>
                  )}
                  <div className="mt-2">
                    <div className="text-muted small">Numeric:</div>
                    <ul className="mb-0">
                      {numericRoots.length > 0 ? (
                        numericRoots.map((z, idx) => (
                          <li key={idx}>
                            r{idx + 1} = <code>{formatComplex(z)}</code>
                          </li>
                        ))
                      ) : (
                        <li>No numeric roots extracted.</li>
                      )}
                    </ul>
                  </div>
                  <div className="form-text mt-2">
                    Real roots are also marked on the plot along the x-axis.
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
                    <div className="text-muted small">Enter a valid polynomial to see the plot.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!error && numericRoots.length === 0 && !latexRoots && (
        <div className="alert alert-info mt-3" role="note">
          Enter a polynomial and click Compute Roots to view results and the graph.
        </div>
      )}
    </div>
  );
}

PolynomialRootsPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default PolynomialRootsPanel;
