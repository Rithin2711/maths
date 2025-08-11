import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import nerdamer from "nerdamer";
import "nerdamer/Calculus";
import "nerdamer/Algebra";
import "nerdamer/Solve";
import "nerdamer/Extra";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

// PUBLIC_INTERFACE
/**
 * Panel for solving first-order ODEs (ordinary differential equations) symbolically.
 * Lets user input e.g. dy/dx = f(x,y), attempts symbolic solution, and displays in formatted notation.
 * Tries to display general and particular solutions (if numeric initial condition provided).
 * Accessible and styled for CalcMaster frontend.
 * @param {function} onBack - callback to go back to previous page
 */
function DifferentialEquationSolverPanel({ onBack }) {
  const [equation, setEquation] = useState("");
  const [initialCondition, setInitialCondition] = useState(""); // e.g. y(1)=2
  const [result, setResult] = useState({ status: "idle", latex: "", detail: "", error: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef();

  // Guidance and example
  const exampleEqn = "dy/dx = x*y + 1";
  const exampleIC = "y(0)=2";

  // --- Main submit handler ---
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult({ status: "working", latex: "", detail: "", error: "" });

    // Parse ODE input (expect dy/dx = f(x,y))
    let left, right;
    let eqn = equation.replace(/\s+/g, "");
    let eqParts = eqn.split("=");
    if (eqParts.length !== 2) {
      setResult({
        status: "error",
        latex: "",
        detail: "",
        error: "Please enter a first-order ODE in the format 'dy/dx = ...'.",
      });
      setIsSubmitting(false);
      return;
    }
    left = eqParts[0];
    right = eqParts[1];

    // Only handle dy/dx or y' or derivatives of simple form
    let odeForm = "";
    if (/dydx|y'|d\/dxy|y_1/.test(left.toLowerCase().replace(/[^a-z0-9]/gi, ""))) {
      // Acceptable
      odeForm = "dy/dx";
    } else {
      setResult({
        status: "error",
        latex: "",
        detail: "",
        error: "The left side should be 'dy/dx', 'y'' or similar.",
      });
      setIsSubmitting(false);
      return;
    }

    // Compose for nerdamer: nerdamer('ode(expr, x, y)')
    try {
      // Try to solve ODE symbolically
      // Syntax: nerdamer('ode(rhs, x, y)')
      // General solution
      let solution = null;
      let latexSol = "";
      let particularSol = null;
      let latexParticular = "";
      let detail = "";

      solution = nerdamer(`ode(${right}, x, y)`).toString();

      // Try to convert to LaTeX and show solution as y = ...
      try {
        const latexGen = nerdamer(`latex(${solution})`).toString();
        // Format: solution may come as a set, prefer y=...
        latexSol = latexGen.includes("y=") ? latexGen : `y = ${latexGen}`;
        detail = "General solution";
      } catch {
        latexSol = solution;
        detail = "General solution";
      }

      // If initial condition provided, attempt particular solution
      if (initialCondition.trim()) {
        // Extract x0, y0 from something like y(1)=2
        let ic = initialCondition.replace(/\s+/g, "");
        let icMatch = ic.match(/^y\(([^)]+)\)\=([^\s]+)$/i);
        if (icMatch) {
          let x0 = icMatch[1];
          let y0 = icMatch[2];
          // Find constant in general solution (assume 'C')
          // Replace y by y0, x by x0, solve for C
          try {
            // Use nerdamer.Solve
            // Substitute into general solution to solve for C
            let Csol = null;
            // The general solution might use 'C' or '_C'
            let Cvar = "C";
            let cTest = solution.includes("_C") ? "_C" : "C";
            // y = ... => left/right of '='
            let solParts = solution.split("=");
            if (solParts.length === 2) {
              let lhs = solParts[0].replace(/y/g, y0);
              let rhs = solParts[1]
                .replace(/x/g, `(${x0})`)
                .replace(/y/g, y0)
                .replace(new RegExp(cTest, "g"), cTest);
              // Build equation to solve for C
              let eqSolve = `${lhs} = ${rhs}`;
              let Croot = nerdamer.solveEquations([eqSolve], cTest);
              if (Croot && Croot.length && Croot[0][1]) {
                Csol = Croot[0][1];
                // Substitute C into general solution
                let particular = solution.replace(new RegExp(cTest, "g"), `(${Csol})`);
                let latexPart = nerdamer(`latex(${particular})`).toString();
                latexParticular = latexPart.includes("y=")
                  ? latexPart
                  : `y = ${latexPart}`;
                detail += " & Particular solution for y(" + x0 + ")=" + y0;
              }
            }
          } catch (err) {
            // If IC parse/replace fails, skip particular sol
          }
        }
      }

      setResult({
        status: "success",
        latex: latexSol,
        detail: detail,
        error: "",
        latexParticular,
      });
    } catch (err) {
      setResult({
        status: "error",
        latex: "",
        detail: "",
        error:
          "Could not solve ODE symbolically. " +
          (err?.message ||
            "Check your equation or consider a simpler differential equation."),
      });
    }
    setIsSubmitting(false);
  };

  // Render result card
  const renderResult = () => {
    if (result.status === "idle" || (result.status === "working" && !result.latex)) return null;
    if (result.status === "error")
      return (
        <div
          className="alert alert-danger mt-3"
          role="alert"
          tabIndex={0}
          style={{ borderRadius: 10, fontSize: "1.03rem" }}
        >
          ❌ {result.error}
        </div>
      );
    return (
      <div
        className="card shadow-sm my-4 animate__animated animate__fadeInUp"
        style={{
          borderRadius: 13,
          maxWidth: 520,
          margin: "0 auto",
          background: "#fffefd",
          border: "2px solid #e7e3ff55"
        }}
        tabIndex={0}
        aria-live="polite"
      >
        <div className="card-body">
          <h3 className="card-title fs-6 fw-bold mb-2">Differential Equation Solution</h3>
          <div style={{ fontSize: "1.12rem", marginBottom: 12 }}>
            <BlockMath>{result.latex}</BlockMath>
          </div>
          {result.latexParticular && (
            <div className="mt-2 pt-2 border-top" style={{ fontSize: "1.10rem" }}>
              <span className="text-primary fw-bold">Particular:</span>
              <BlockMath>{result.latexParticular}</BlockMath>
            </div>
          )}
          <div className="text-muted small mt-2">{result.detail}</div>
        </div>
      </div>
    );
  };

  return (
    <main className="container py-5" style={{ maxWidth: 600 }}>
      <h2 className="fw-bold text-warning mb-3" tabIndex={0}>
        🟨 Differential Equation Solver
      </h2>
      <form autoComplete="off" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="ode-eqn" className="form-label fw-semibold">
            First-order ODE (dy/dx = ... or y&apos; = ...)
          </label>
          <input
            ref={inputRef}
            id="ode-eqn"
            className="form-control"
            type="text"
            value={equation}
            onChange={(e) => {
              setEquation(e.target.value);
              setResult({ status: "idle", latex: "", detail: "", error: "" });
            }}
            placeholder={`e.g. ${exampleEqn}`}
            inputMode="text"
            style={{
              borderRadius: 10,
              fontFamily: "'JetBrains Mono', Menlo, monospace",
              fontSize: "1.08rem",
              background: "#fafbfc",
            }}
            autoComplete="off"
            required
            aria-label="First order ODE, e.g. dy/dx = x*y + 1"
            spellCheck={false}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="ode-ic" className="form-label fw-semibold">
            (Optional) Initial condition for particular solution
          </label>
          <input
            id="ode-ic"
            className="form-control"
            type="text"
            value={initialCondition}
            onChange={(e) => setInitialCondition(e.target.value)}
            placeholder={exampleIC}
            inputMode="text"
            style={{
              borderRadius: 10,
              fontFamily: "Menlo, monospace",
              fontSize: "1.06rem",
              background: "#f6faf8",
            }}
            autoComplete="off"
            aria-label="Initial condition for particular solution, e.g. y(0)=2"
            spellCheck={false}
          />
          <div className="form-text text-muted small mt-1" style={{ fontSize: 13 }}>
            Example: <code>y(0)=2</code> — will solve for the arbitrary constant C.
          </div>
        </div>
        <div className="d-flex gap-3 mt-4">
          <button
            type="button"
            className="btn btn-outline-secondary"
            style={{ borderRadius: 10, fontWeight: 500 }}
            onClick={onBack}
            aria-label="Go Back"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="btn btn-warning"
            style={{ borderRadius: 10, fontWeight: 600, minWidth: 180 }}
            disabled={isSubmitting || !equation.trim()}
            aria-label="Solve Differential Equation"
          >
            {isSubmitting ? "Solving..." : "Solve Equation"}
          </button>
        </div>
      </form>
      <div className="mt-3 small text-muted" style={{ fontSize: 14 }}>
        Enter a first-order ordinary differential equation in terms of x, y. E.g.&nbsp;
        <code>{exampleEqn}</code>. Use <b>dy/dx</b> or <b>y'</b>.<br />
        Optionally provide an initial condition like <code>y(0)=2</code>.
      </div>
      {renderResult()}
    </main>
  );
}

DifferentialEquationSolverPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default DifferentialEquationSolverPanel;
