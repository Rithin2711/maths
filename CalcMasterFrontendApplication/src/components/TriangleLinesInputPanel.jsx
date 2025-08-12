import React, { useState } from "react";
import PropTypes from "prop-types";
import nerdamer from "nerdamer";
import "nerdamer/Algebra";
import "nerdamer/Calculus";
import "nerdamer/Solve";
import "nerdamer/Extra";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

/**
 * PUBLIC_INTERFACE
 * TriangleLinesInputPanel
 * UI component for entering three line equations in x and y (e.g., "y = 2x + 3", "x + y = 5", "2x - y - 1 = 0").
 * Validates that each input defines a valid line (linear in x and y) and that the three lines form a triangle
 * (i.e., all pairs intersect, they are not pairwise parallel and not concurrent).
 * Prepares normalized data for subsequent processing: line coefficients Ax + By + C = 0,
 * slopes/intercepts, and intersection points and triangle area.
 *
 * Props:
 *  - onBack: function to go back to previous screen
 *
 * Output (rendered to the screen, and kept in component state):
 *  {
 *    lines: [
 *      { input, A, B, C, slope, yIntercept, asLatex },
 *      ...
 *    ],
 *    intersections: {
 *      L12: { x, y }, L23: { x, y }, L31: { x, y }
 *    },
 *    triangle: { vertices: [{x,y},{x,y},{x,y}], area },
 *    validTriangle: boolean,
 *    issues: string[]
 *  }
 */
// PUBLIC_INTERFACE
function TriangleLinesInputPanel({ onBack }) {
  // Inputs
  const [l1, setL1] = useState("");
  const [l2, setL2] = useState("");
  const [l3, setL3] = useState("");

  // Result/prepared data
  const [prepared, setPrepared] = useState(null);
  const [error, setError] = useState("");

  const EPS = 1e-9;

  // Normalize input like "y = 2x + 3" or "x + y - 1 = 0" into "expr = 0" form:
  // return expression string that should evaluate to zero on the line.
  function normalizeToZero(expr) {
    const s = (expr || "").trim();
    if (!s) return "";
    if (s.includes("=")) {
      const parts = s.split("=");
      const left = parts[0];
      const right = parts.slice(1).join("="); // keep extra '=' cases safe
      return `(${left})-(${right})`;
    }
    // If no equality sign, assume it's already equal to zero: F(x,y)=0
    return s;
  }

  // Evaluate an expression string at (x,y) -> number
  function evalAt(exprZero, x, y) {
    try {
      const valStr = nerdamer(exprZero, { x, y }).evaluate().text();
      const n = Number(valStr);
      return Number.isFinite(n) ? n : NaN;
    } catch {
      return NaN;
    }
  }

  // Parse line into Ax + By + C = 0 by sampling values assuming linearity:
  // f(0,0)=C, A = f(1,0)-C, B = f(0,1)-C; validate linear with f(1,1) ~= A+B+C
  function parseLineToABC(input) {
    const eq0 = normalizeToZero(input);
    if (!eq0) {
      throw new Error("Empty input.");
    }
    const c = evalAt(eq0, 0, 0);
    const a = evalAt(eq0, 1, 0) - c;
    const b = evalAt(eq0, 0, 1) - c;

    if (![a, b, c].every(Number.isFinite)) {
      throw new Error("Could not evaluate expression. Ensure it is in x and y and valid.");
    }

    // Linear consistency check
    const test = evalAt(eq0, 1, 1);
    const should = a + b + c;
    if (!Number.isFinite(test) || Math.abs(test - should) > 1e-6) {
      throw new Error("The expression is not linear in x and y.");
    }

    // Ensure not degenerate (A and B cannot both be ~0)
    if (Math.abs(a) < EPS && Math.abs(b) < EPS) {
      throw new Error("Not a valid line. Coefficients A and B are both near zero.");
    }

    // Normalize (optional): scale so that sqrt(A^2+B^2)=1 or fix sign for uniqueness.
    // We'll only normalize sign so that (A>0) or if A==0 then (B>0).
    let A = a, B = b, C = c;
    if (A < -EPS || (Math.abs(A) <= EPS && B < -EPS)) {
      A = -A; B = -B; C = -C;
    }

    // Slope-intercept if possible
    let slope = null;
    let yIntercept = null;
    if (Math.abs(B) > EPS) {
      slope = -A / B;
      yIntercept = -C / B;
    }

    // Prepare LaTeX for Ax + By + C = 0
    const latexTerm = (coef, sym) => {
      if (Math.abs(coef) < EPS) return "";
      const sign = coef >= 0 ? "+" : "-";
      const absVal = Math.abs(coef);
      const num = absVal === 1 && sym ? "" : formatNumber(absVal);
      return ` ${sign} ${num}${sym ? sym : ""}`;
    };
    const asLatex = `\\boxed{${formatSigned(A)}x${latexTerm(B, "y")}${latexTerm(C, "")} = 0}`;

    return { input, A, B, C, slope, yIntercept, asLatex };
  }

  // Format helpers
  function formatNumber(n) {
    if (!Number.isFinite(n)) return "NaN";
    const abs = Math.abs(n);
    if (abs === 0) return "0";
    if (abs >= 1e6 || abs < 1e-6) return n.toExponential(6);
    // strip trailing zeros
    return Number(n.toPrecision(8)).toString();
  }

  function formatSigned(n) {
    // return number with sign unless it's the first term later handled by latexTerm
    if (!Number.isFinite(n)) return "NaN";
    return Number(n.toPrecision(8)).toString();
  }

  // Intersection of two lines: A1 x + B1 y + C1 = 0 and A2 x + B2 y + C2 = 0
  function intersect(L1, L2) {
    const { A: A1, B: B1, C: C1 } = L1;
    const { A: A2, B: B2, C: C2 } = L2;
    const D = A1 * B2 - A2 * B1;
    if (Math.abs(D) < EPS) return null; // Parallel or coincident
    const x = (B1 * C2 - B2 * C1) / D;
    const y = (C1 * A2 - C2 * A1) / D;
    if (![x, y].every(Number.isFinite)) return null;
    return { x, y };
  }

  function areaTriangle(p1, p2, p3) {
    const val =
      p1.x * (p2.y - p3.y) +
      p2.x * (p3.y - p1.y) +
      p3.x * (p1.y - p2.y);
    return Math.abs(val) / 2;
  }

  const handlePrepare = (e) => {
    e.preventDefault();
    setError("");
    setPrepared(null);

    try {
      // Basic presence check
      if (![l1, l2, l3].every((s) => (s || "").trim().length > 0)) {
        throw new Error("Please enter all three line equations.");
      }

      // Parse lines
      const L1 = parseLineToABC(l1);
      const L2 = parseLineToABC(l2);
      const L3 = parseLineToABC(l3);

      // Parallel checks via determinant
      const D12 = L1.A * L2.B - L2.A * L1.B;
      const D23 = L2.A * L3.B - L3.A * L2.B;
      const D31 = L3.A * L1.B - L1.A * L3.B;

      const issues = [];
      if (Math.abs(D12) < EPS) issues.push("Lines 1 and 2 are parallel or coincident.");
      if (Math.abs(D23) < EPS) issues.push("Lines 2 and 3 are parallel or coincident.");
      if (Math.abs(D31) < EPS) issues.push("Lines 3 and 1 are parallel or coincident.");

      if (issues.length > 0) {
        setPrepared({
          lines: [L1, L2, L3],
          intersections: null,
          triangle: null,
          validTriangle: false,
          issues,
        });
        return;
      }

      // Intersections
      const P12 = intersect(L1, L2);
      const P23 = intersect(L2, L3);
      const P31 = intersect(L3, L1);
      if (!P12 || !P23 || !P31) {
        issues.push("Could not compute all pairwise intersections.");
        setPrepared({
          lines: [L1, L2, L3],
          intersections: { L12: P12, L23: P23, L31: P31 },
          triangle: null,
          validTriangle: false,
          issues,
        });
        return;
      }

      // Concurrency check: ensure not all points the same (or nearly)
      const d12_23 =
        Math.hypot(P12.x - P23.x, P12.y - P23.y);
      const d23_31 =
        Math.hypot(P23.x - P31.x, P23.y - P31.y);
      const d31_12 =
        Math.hypot(P31.x - P12.x, P31.y - P12.y);

      // Compute area to detect degeneracy (concurrent or near-collinear)
      const area = areaTriangle(P12, P23, P31);
      const validTriangle = area > 1e-10;

      if (!validTriangle) {
        issues.push("The three lines are concurrent or nearly concurrent; no triangle is formed.");
      }

      setPrepared({
        lines: [L1, L2, L3],
        intersections: { L12: P12, L23: P23, L31: P31 },
        triangle: { vertices: [P12, P23, P31], area },
        validTriangle,
        issues,
      });
    } catch (err) {
      setError(
        typeof err === "string" ? err : err?.message || "Validation failed. Please check your inputs."
      );
    }
  };

  const renderPrepared = () => {
    if (!prepared && !error) return null;

    if (error) {
      return (
        <div
          className="alert alert-danger mt-3"
          role="alert"
          tabIndex={0}
          style={{ borderRadius: 10, fontSize: "1.03rem" }}
        >
          <span style={{ fontSize: 20, marginRight: 6 }}>❌</span>
          {error}
        </div>
      );
    }

    if (!prepared) return null;

    const { lines, intersections, triangle, validTriangle, issues } = prepared;
    return (
      <div
        className="card shadow-sm my-4 animate__animated animate__fadeInUp"
        style={{ borderRadius: 13, maxWidth: 720, margin: "0 auto", background: "#fcfdff" }}
        tabIndex={0}
        aria-live="polite"
      >
        <div className="card-body">
          <h3 className="card-title fs-6 fw-bold mb-3">
            Prepared Line Data {validTriangle ? "(Triangle formed ✅)" : "(Not a triangle ⚠️)"}
          </h3>

          {/* Show issues if any */}
          {issues && issues.length > 0 && (
            <div className="alert alert-warning" style={{ borderRadius: 10 }}>
              <ul className="mb-0">
                {issues.map((it, idx) => (
                  <li key={idx}>{it}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Lines summary */}
          <div className="mb-3">
            <div className="fw-semibold mb-2">Normalized line equations (Ax + By + C = 0):</div>
            {lines?.map((L, i) => (
              <div key={i} className="mb-2">
                <div className="small text-muted mb-1">Input L{i + 1}: <code>{L.input}</code></div>
                <BlockMath>{L.asLatex}</BlockMath>
                <div className="small text-muted">
                  {Math.abs(L.B) > EPS ? (
                    <>
                      Slope m = <code>{formatNumber(L.slope)}</code>, y-intercept b ={" "}
                      <code>{formatNumber(L.yIntercept)}</code>
                    </>
                  ) : (
                    <>Vertical line (B ≈ 0)</>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Intersections */}
          {intersections && intersections.L12 && intersections.L23 && intersections.L31 && (
            <div className="mb-3">
              <div className="fw-semibold mb-2">Intersections (vertices):</div>
              <ul className="small">
                <li>
                  P12 (L1 ∩ L2) = (
                  <code>{formatNumber(intersections.L12.x)}</code>,{" "}
                  <code>{formatNumber(intersections.L12.y)}</code>)
                </li>
                <li>
                  P23 (L2 ∩ L3) = (
                  <code>{formatNumber(intersections.L23.x)}</code>,{" "}
                  <code>{formatNumber(intersections.L23.y)}</code>)
                </li>
                <li>
                  P31 (L3 ∩ L1) = (
                  <code>{formatNumber(intersections.L31.x)}</code>,{" "}
                  <code>{formatNumber(intersections.L31.y)}</code>)
                </li>
              </ul>
            </div>
          )}

          {/* Triangle summary */}
          {triangle && (
            <div className="mb-1">
              <div className="fw-semibold">Triangle summary:</div>
              <div className="small text-muted">
                Area = <code>{formatNumber(triangle.area)}</code>
              </div>
            </div>
          )}

          <div className="small text-muted mt-2">
            This prepared data can be used to compute the incircle and circumcircle and plot the figure.
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="container py-5" style={{ maxWidth: 780 }}>
      <h2 className="fw-bold text-dark mb-3" tabIndex={0}>
        🔺 Triangle from Three Lines
      </h2>
      <p className="text-muted" style={{ maxWidth: 760 }}>
        Enter three line equations in x and y. Examples:{" "}
        <code>y = 2*x + 3</code>, <code>x + y = 5</code>, <code>2*x - y - 1 = 0</code>.
        You can use expressions like <code>pi</code>, <code>e</code>, <code>sqrt(2)</code>.
      </p>
      <form autoComplete="off" onSubmit={handlePrepare}>
        <div className="mb-3">
          <label htmlFor="line-1" className="form-label fw-semibold">
            Line 1
          </label>
          <input
            id="line-1"
            className="form-control"
            type="text"
            value={l1}
            onChange={(e) => setL1(e.target.value)}
            placeholder='e.g. y = 2*x + 1  or  x + y = 5  or  2*x - y - 1 = 0'
            inputMode="text"
            style={{ borderRadius: 10, fontFamily: "Menlo, monospace", fontSize: "1.06rem" }}
            autoComplete="off"
            required
            aria-label="First line equation"
            spellCheck={false}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="line-2" className="form-label fw-semibold">
            Line 2
          </label>
          <input
            id="line-2"
            className="form-control"
            type="text"
            value={l2}
            onChange={(e) => setL2(e.target.value)}
            placeholder='e.g. y = -x + 4  or  x - y = 2  or  x + 2*y - 6 = 0'
            inputMode="text"
            style={{ borderRadius: 10, fontFamily: "Menlo, monospace", fontSize: "1.06rem" }}
            autoComplete="off"
            required
            aria-label="Second line equation"
            spellCheck={false}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="line-3" className="form-label fw-semibold">
            Line 3
          </label>
          <input
            id="line-3"
            className="form-control"
            type="text"
            value={l3}
            onChange={(e) => setL3(e.target.value)}
            placeholder='e.g. y = 0.5*x  or  3*x + y = 1  or  x - 3*y + 2 = 0'
            inputMode="text"
            style={{ borderRadius: 10, fontFamily: "Menlo, monospace", fontSize: "1.06rem" }}
            autoComplete="off"
            required
            aria-label="Third line equation"
            spellCheck={false}
          />
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
            className="btn btn-dark"
            style={{ borderRadius: 10, fontWeight: 600, minWidth: 160 }}
            aria-label="Validate and Prepare"
            disabled={!l1.trim() || !l2.trim() || !l3.trim()}
          >
            Validate & Prepare
          </button>
        </div>
      </form>
      {renderPrepared()}
    </main>
  );
}

TriangleLinesInputPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default TriangleLinesInputPanel;
