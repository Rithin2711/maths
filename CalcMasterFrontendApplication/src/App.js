import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import MathInputPanel from "./components/MathInputPanel";
import OperationSelector from "./components/OperationSelector";
import ValidationFeedback from "./components/ValidationFeedback";
import ResultsPanel from "./components/ResultsPanel";
import { calculateMathExpression, validateMathExpression } from "./math/mathEngine";

// PUBLIC_INTERFACE
/**
 * Root application component for CalcMaster.
 * Provides theme toggle, layout, accessibility, and feature plumbing for math operations.
 */
function App() {
  const [theme, setTheme] = useState("light");
  const [mathExpr, setMathExpr] = useState("");
  const [operation, setOperation] = useState("limit");
  const [validation, setValidation] = useState({ valid: true, message: "" });
  const [result, setResult] = useState({ formatted: "", error: "", raw: "" });

  // PUBLIC_INTERFACE
  /** Toggles the theme between light and dark. */
  const toggleTheme = () => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
    document.documentElement.setAttribute("data-theme", theme === "light" ? "dark" : "light");
  };

  // Handle input changes, validate in real time
  const handleInputChange = (expr) => {
    setMathExpr(expr);
    const res = validateMathExpression(expr, operation);
    setValidation(res);
    if (res.valid) {
      setResult({ formatted: "", error: "", raw: "" });
    }
  };

  // Handle operation selector changes
  const handleOperationChange = (op) => {
    setOperation(op);
    const res = validateMathExpression(mathExpr, op);
    setValidation(res);
    setResult({ formatted: "", error: "", raw: "" });
  };

  // PUBLIC_INTERFACE
  /** Submits the calculation on user action */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validation.valid) return;
    try {
      const output = await calculateMathExpression(mathExpr, operation);
      setResult({ formatted: output.formatted, error: "", raw: output.raw });
    } catch (err) {
      setResult({
        formatted: "",
        error:
          typeof err === "string"
            ? err
            : err?.message || "An unknown error occurred. Please check your expression.",
        raw: "",
      });
    }
  };

  // Accessibility: App title & heading for screen readers
  return (
    <div className={`App bg-${theme}`}>
      <header className="container py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="mb-0 visually-hidden">CalcMaster: Advanced Math Web Calculator</h1>
          <button
            className="btn btn-outline-secondary theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
        <section aria-label="Math Input Panel" className="mb-4">
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="row g-2 align-items-end">
              <div className="col-12 col-md-6">
                <MathInputPanel
                  value={mathExpr}
                  onChange={handleInputChange}
                  disabled={false}
                  ariaLabel="Enter mathematical expression"
                />
              </div>
              <div className="col-12 col-md-3">
                <OperationSelector value={operation} onChange={handleOperationChange} />
              </div>
              <div className="col-12 col-md-3">
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={!validation.valid || !mathExpr.trim()}
                  aria-disabled={!validation.valid}
                  aria-label="Compute solution"
                  tabIndex={0}
                >
                  Compute
                </button>
              </div>
            </div>
          </form>
        </section>
        <section aria-live="polite" aria-atomic="true">
          <ValidationFeedback valid={validation.valid} message={validation.message} />
        </section>
        <section className="mt-4" aria-label="Results panel">
          <ResultsPanel
            isValid={validation.valid}
            error={result.error}
            resultLatex={result.formatted}
            raw={result.raw}
            inputExpr={mathExpr}
            operation={operation}
          />
        </section>
      </header>
      <footer className="text-center small text-secondary py-3 bg-light" role="contentinfo">
        <span>
          CalcMaster © {new Date().getFullYear()} - Powered by React, KaTeX, and Bootstrap |{" "}
          <a
            href="https://github.com/kavia-ai"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Kavia AI GitHub"
          >
            GitHub
          </a>
        </span>
      </footer>
    </div>
  );
}

export default App;
