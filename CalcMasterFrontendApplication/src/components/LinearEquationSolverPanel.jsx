import React, { useState } from "react";
import PropTypes from "prop-types";

// PUBLIC_INTERFACE
/**
 * LinearEquationSolverPanel
 * Minimal placeholder UI for solving linear systems with 2-6 variables.
 * Allows user to pick number of variables and enter coefficients for Ax=b.
 * Currently performs a basic feasibility check and displays placeholder output.
 */
function LinearEquationSolverPanel({ onBack }) {
  const [n, setN] = useState(3); // number of variables
  const [A, setA] = useState(Array.from({ length: 3 }, () => Array(3).fill("")));
  const [b, setB] = useState(Array(3).fill(""));

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
  };

  const updateA = (i, j, val) => {
    setA((prev) => {
      const next = prev.map((row) => row.slice());
      next[i][j] = val;
      return next;
    });
  };
  const updateB = (i, val) => {
    setB((prev) => {
      const next = prev.slice();
      next[i] = val;
      return next;
    });
  };

  const handleSolve = (e) => {
    e.preventDefault();
    // Placeholder: validate numeric inputs and show a stub result.
    const allNums = A.flat().every((x) => x === "" || !isNaN(Number(x))) && b.every((x) => x === "" || !isNaN(Number(x)));
    if (!allNums) {
      alert("Please enter numeric coefficients only.");
      return;
    }
    // Stub: in future, use math.js to solve. For now, present structure.
    alert(`Solving a ${n}x${n} system Ax=b (placeholder).`);
  };

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
        <button type="submit" className="btn btn-primary">Solve (placeholder)</button>
      </form>
      <div className="alert alert-warning mt-3" role="note">
        This is a placeholder. Exact solving and formatted outputs will be added in a subsequent update.
      </div>
    </div>
  );
}

LinearEquationSolverPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default LinearEquationSolverPanel;
