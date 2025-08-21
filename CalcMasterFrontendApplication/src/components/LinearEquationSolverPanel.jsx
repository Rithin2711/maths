import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import PlotlyLite from "./PlotlyLite";

/**
 * PUBLIC_INTERFACE
 * LinearEquationSolverPanel
 * Solve linear systems Ax=b for n=2..6. For n=2, displays solution in normal form (x=..., y=...)
 * and a graph with both lines, labeled axes, and the intersection point.
 *
 * Notes:
 * - Uses a small Gaussian elimination for n up to 6.
 * - For n=2, builds two line equations from rows of A and b, plots them via PlotlyLite.
 */
function LinearEquationSolverPanel({ onBack }) {
  const [n, setN] = useState(2); // number of variables
  const [A, setA] = useState(Array.from({ length: 2 }, () => Array(2).fill("")));
  const [b, setB] = useState(Array(2).fill(""));
  const [solution, setSolution] = useState(null);
  const [error, setError] = useState("");

  const clampN = (val) => Math.max(2, Math.min(6, val));

  const resizeSystem = (newN) => {
    const N = clampN(newN);
    setN(N);
    setA((prev) => {
      const next = Array.from({ length: N }, (_, i) =>
        Array.from({ length: N }, (_, j) => (prev[i]?.[j] ?? ""))
      );
      return next;
    });
    setB((prev) => Array.from({ length: N }, (_, i) => prev[i] ?? ""));
    setSolution(null);
    setError("");
  };

  const updateA = (i, j, val) => {
    setA((prev) => {
      const next = prev.map((row) => row.slice());
      next[i][j] = val;
      return next;
    });
    setSolution(null);
    setError("");
  };
  const updateB = (i, val) => {
    setB((prev) => {
      const next = prev.slice();
      next[i] = val;
      return next;
    });
    setSolution(null);
    setError("");
  };

  // Solve Ax=b using Gaussian elimination with partial pivoting
  function solveLinearSystem(numVars, matA, vecB) {
    const n = numVars;
    const a = Array.from({ length: n }, (_, i) => Array.from({ length: n + 1 }, (__ , j) => {
      if (j < n) return Number(matA[i][j]);
      return Number(vecB[i]);
    }));
    // Validate numeric
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= n; j++) {
        if (!Number.isFinite(a[i][j])) {
          throw new Error("All coefficients and b entries must be numeric.");
        }
      }
    }
    // Forward elimination
    for (let col = 0; col < n; col++) {
      // Pivot
      let pivot = col;
      for (let i = col + 1; i < n; i++) {
        if (Math.abs(a[i][col]) > Math.abs(a[pivot][col])) pivot = i;
      }
      if (Math.abs(a[pivot][col]) < 1e-12) {
        throw new Error("Matrix is singular or nearly singular. No unique solution.");
      }
      // Swap
      if (pivot !== col) {
        const tmp = a[col]; a[col] = a[pivot]; a[pivot] = tmp;
      }
      // Normalize row
      const div = a[col][col];
      for (let j = col; j <= n; j++) a[col][j] /= div;
      // Eliminate below
      for (let i = col + 1; i < n; i++) {
        const f = a[i][col];
        if (Math.abs(f) > 1e-16) {
          for (let j = col; j <= n; j++) a[i][j] -= f * a[col][j];
        }
      }
    }
    // Back substitution
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = a[i][n];
      for (let j = i + 1; j < n; j++) sum -= a[i][j] * x[j];
      x[i] = sum; // since a[i][i] is 1 after normalization
      if (!Number.isFinite(x[i])) throw new Error("Failed to compute solution.");
    }
    return x;
  }

  function formatNumber(val) {
    if (!Number.isFinite(val)) return "NaN";
    const abs = Math.abs(val);
    if (abs === 0) return "0";
    if (abs >= 1e6 || abs < 1e-6) return val.toExponential(6);
    return Number(val.toPrecision(8)).toString();
  }

  const handleSolve = (e) => {
    e.preventDefault();
    setError("");
    setSolution(null);
    // Validate inputs
    const allNums =
      A.flat().every((x) => x !== "" && !isNaN(Number(x))) &&
      b.every((x) => x !== "" && !isNaN(Number(x)));
    if (!allNums) {
      setError("Please enter numeric coefficients for all fields.");
      return;
    }
    try {
      const sol = solveLinearSystem(n, A, b);
      setSolution(sol);
    } catch (err) {
      setError(typeof err === "string" ? err : err?.message || "Failed to solve the system.");
    }
  };

  // For n=2, build plot spec from two lines: a1 x + b1 y = c1, a2 x + b2 y = c2
  const plotSpec2 = useMemo(() => {
    if (n !== 2) return null;
    if (!solution || !solution.every(Number.isFinite)) return null;
    const a1 = Number(A[0][0]), b1 = Number(A[0][1]), c1 = Number(b[0]);
    const a2 = Number(A[1][0]), b2 = Number(A[1][1]), c2 = Number(b[1]);
    if (![a1,b1,c1,a2,b2,c2].every(Number.isFinite)) return null;

    const xSol = solution[0], ySol = solution[1];

    // Determine axes ranges based on solution and intercepts to make plot readable
    const pts = [{ x: xSol, y: ySol }];

    // Helper to compute two endpoints across x-range later
    const lineEndpointsForRange = (a, b, c, x1, x2) => {
      // a*x + b*y = c -> if b != 0: y = (c - a*x)/b, else vertical x = c/a
      if (Math.abs(b) < 1e-12) {
        const xv = c / a;
        return { x: [xv, xv], y: [x1, x2], vertical: true };
      } else {
        const y1 = (c - a * x1) / b;
        const y2 = (c - a * x2) / b;
        return { x: [x1, x2], y: [y1, y2], vertical: false };
      }
    };

    // Try to include intercepts to infer good ranges
    const candidateXs = [xSol];
    const candidateYs = [ySol];
    const pushIntercepts = (a, b, c) => {
      // x-intercept: if a != 0 then y=0 => a*x = c
      if (Math.abs(a) > 1e-12) candidateXs.push(c / a);
      // y-intercept: if b != 0 then x=0 => b*y = c
      if (Math.abs(b) > 1e-12) candidateYs.push(c / b);
    };
    pushIntercepts(a1, b1, c1);
    pushIntercepts(a2, b2, c2);

    let minX = Math.min(...candidateXs.filter(Number.isFinite));
    let maxX = Math.max(...candidateXs.filter(Number.isFinite));
    let minY = Math.min(...candidateYs.filter(Number.isFinite));
    let maxY = Math.max(...candidateYs.filter(Number.isFinite));

    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || minX === maxX) {
      minX = xSol - 5; maxX = xSol + 5;
    }
    if (!Number.isFinite(minY) || !Number.isFinite(maxY) || minY === maxY) {
      minY = ySol - 5; maxY = ySol + 5;
    }
    // pad
    const padX = 0.2 * (maxX - minX || 10);
    const padY = 0.2 * (maxY - minY || 10);
    minX -= padX; maxX += padX;
    minY -= padY; maxY += padY;

    const ep1 = lineEndpointsForRange(a1, b1, c1, minX, maxX);
    const ep2 = lineEndpointsForRange(a2, b2, c2, minX, maxX);

    const traces = [
      {
        x: ep1.x, y: ep1.y, mode: "lines", name: "Line 1",
        line: { color: "#1f77b4", width: 2 }, type: "scatter",
        hovertemplate: "Line 1<extra></extra>"
      },
      {
        x: ep2.x, y: ep2.y, mode: "lines", name: "Line 2",
        line: { color: "#ff7f0e", width: 2 }, type: "scatter",
        hovertemplate: "Line 2<extra></extra>"
      },
      {
        x: [xSol], y: [ySol], mode: "markers+text", name: "Intersection",
        marker: { color: "#d62728", size: 10 },
        text: ["Solution"], textposition: "top center",
        hovertemplate: "Solution (%{x:.4g}, %{y:.4g})<extra></extra>", type: "scatter"
      }
    ];

    const layout = {
      title: { text: "Graphical Method: Intersection of Two Lines", font: { size: 16 } },
      margin: { l: 50, r: 10, t: 50, b: 40 },
      xaxis: {
        title: { text: "x" },
        range: [minX, maxX],
        zeroline: true,
        zerolinecolor: "#dddddd",
        showgrid: true,
        gridcolor: "#f5f5f5",
      },
      yaxis: {
        title: { text: "y" },
        range: [minY, maxY],
        zeroline: true,
        zerolinecolor: "#dddddd",
        showgrid: true,
        gridcolor: "#f5f5f5",
        scaleanchor: "x",
        scaleratio: 1,
      },
      legend: { orientation: "h", y: -0.2 },
      hovermode: "closest",
      paper_bgcolor: "white",
      plot_bgcolor: "white",
    };

    const config = { responsive: true, displaylogo: false };

    return { data: traces, layout, config };
  }, [n, A, b, solution]);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Solve Linear Equation (2-6 variables)</h2>
        <button className="btn btn-outline-secondary" onClick={onBack} aria-label="Back to Home">
          ← Back
        </button>
      </div>
      <form onSubmit={handleSolve}>
        <div className="mb-3">
          <label htmlFor="numVars" className="form-label fw-bold">Number of variables</label>
          <input
            id="numVars"
            type="number"
            min={2}
            max={6}
            className="form-control"
            value={n}
            onChange={(e) => resizeSystem(parseInt(e.target.value || "2", 10))}
          />
          <div className="form-text">Enter between 2 and 6.</div>
        </div>
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                {Array.from({ length: n }).map((_, j) => (
                  <th key={`h-${j}`}>a{`[row][${j + 1}]`}</th>
                ))}
                <th>b</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: n }).map((_, i) => (
                <tr key={`r-${i}`}>
                  {Array.from({ length: n }).map((_, j) => (
                    <td key={`c-${i}-${j}`}>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        inputMode="decimal"
                        value={A[i][j]}
                        onChange={(e) => updateA(i, j, e.target.value)}
                        aria-label={`Coefficient a[${i + 1},${j + 1}]`}
                      />
                    </td>
                  ))}
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      inputMode="decimal"
                      value={b[i]}
                      onChange={(e) => updateB(i, e.target.value)}
                      aria-label={`b[${i + 1}]`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="submit" className="btn btn-primary">Solve</button>
      </form>

      {/* Error message */}
      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

      {/* Results for n=2: Normal form display x=..., y=... and plot */}
      {solution && n === 2 && (
        <div className="mt-4">
          <div className="card shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-body">
              <h3 className="h6 fw-bold mb-3">Solution (Normal Form)</h3>
              <div className="d-flex flex-wrap gap-3">
                <div className="badge bg-light text-dark border" style={{ fontSize: "1rem" }}>
                  x = <code className="ms-1">{formatNumber(solution[0])}</code>
                </div>
                <div className="badge bg-light text-dark border" style={{ fontSize: "1rem" }}>
                  y = <code className="ms-1">{formatNumber(solution[1])}</code>
                </div>
              </div>

              <div className="mt-4">
                <div className="fw-semibold mb-2">Graphical method:</div>
                {plotSpec2 ? (
                  <div style={{ width: "100%", minHeight: 420 }}>
                    <PlotlyLite
                      data={plotSpec2.data}
                      layout={plotSpec2.layout}
                      config={plotSpec2.config}
                      style={{ width: "100%", height: "100%" }}
                      useResizeHandler={true}
                    />
                  </div>
                ) : (
                  <div className="text-muted small">Plot not available. Ensure valid numeric inputs.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results for n>2: show vector if solved */}
      {solution && n !== 2 && (
        <div className="mt-4">
          <div className="card shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-body">
              <h3 className="h6 fw-bold mb-3">Solution Vector</h3>
              <ul className="mb-0">
                {solution.map((v, idx) => (
                  <li key={idx}>
                    x{idx + 1} = <code>{formatNumber(v)}</code>
                  </li>
                ))}
              </ul>
              <div className="form-text mt-2">Graphical display is available only for 2 variables.</div>
            </div>
          </div>
        </div>
      )}

      {!solution && !error && (
        <div className="alert alert-info mt-3" role="note">
          Enter coefficients for A and b, then click Solve.
        </div>
      )}
    </div>
  );
}

LinearEquationSolverPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default LinearEquationSolverPanel;
