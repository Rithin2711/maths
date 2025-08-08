import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import MathInputPanel from "./components/MathInputPanel";
import OperationSelector from "./components/OperationSelector";
import ValidationFeedback from "./components/ValidationFeedback";
import ResultsPanel from "./components/ResultsPanel";
import { calculateMathExpression, validateMathExpression } from "./math/mathEngine";

// Friendly icons for operation hints
const OP_ICONS = {
  limit: "🍀",
  integral: "∫",
  trigonometric: "𝚃𝚛𝚒𝚐",
};
const OP_DESCS = {
  limit: "Calculate the value a function approaches.",
  integral: "Find the integral or area under a curve.",
  trigonometric: "Evaluate sine, cosine, tangent, etc.",
};

// PUBLIC_INTERFACE
/**
 * Root application component, overhauled for user friendliness, onboarding, and accessibility.
 * Major user guidance banners, inline tooltips, operation icons, lively transitions.
 */
function App() {
  const [theme, setTheme] = useState("light");
  const [mathExpr, setMathExpr] = useState("");
  const [operation, setOperation] = useState("limit");
  const [validation, setValidation] = useState({ valid: true, message: "" });
  const [result, setResult] = useState({ formatted: "", error: "", raw: "" });
  const [showExample, setShowExample] = useState(false);

  // PUBLIC_INTERFACE
  /** Toggles the theme between light and dark. */
  const toggleTheme = () => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
    document.documentElement.setAttribute(
      "data-theme",
      theme === "light" ? "dark" : "light"
    );
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
    setShowExample(false);
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
            : err?.message ||
              "Oops! Something went wrong. Please double-check your input and try again.",
        raw: "",
      });
    }
  };

  // Focus help for accessibility
  const focusHelp = () => {
    const el = document.getElementById("onboard-help");
    if (el) el.focus();
  };

  // Preload nice examples per operation
  const examples = {
    limit: "lim_{x\\to0} sin(x)/x",
    integral: "\\int x^2 dx",
    trigonometric: "cos(3.14159)",
  };

  // Accessible keyboard shortcut hint for showing help/examples
  React.useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === "h") {
        e.preventDefault();
        setShowExample((v) => !v);
        focusHelp();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Accessibility: App title & heading for screen readers
  return (
    <div className={`App bg-${theme}`} data-testid="main-app-container">
      <header className="container py-3 position-relative">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="mb-0 visually-hidden">
            CalcMaster: Advanced Math Web Calculator
          </h1>
          <button
            className="btn btn-outline-secondary theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
          </button>
        </div>
        {/* Friendly onboarding banner with keyboard nav hint */}
        <div
          className="alert alert-primary d-flex align-items-center gap-3 fade show animate__animated animate__fadeInDown"
          role="status"
          tabIndex={0}
          aria-live="polite"
          id="onboard-help"
          style={{
            boxShadow: "0 4px 24px rgba(52,104,212,0.08)",
            borderRadius: 14,
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 32 }} aria-hidden>
            🤗
          </span>
          <div className="text-start" style={{ flex: 1 }}>
            <strong>Welcome to CalcMaster!</strong>
            <div>
              Enter a math expression below, select an operation, and click
              <span className="mx-1 badge bg-success text-light" aria-hidden>
                Compute
              </span>
              .
            </div>
            <div className="small text-muted">
              <strong>Tip:</strong> Try {" "}
              <button
                type="button"
                className="btn btn-link btn-sm p-0 align-baseline"
                style={{ textDecoration: "underline dotted", color: "#E87A41" }}
                tabIndex={0}
                onClick={() => {
                  setMathExpr(examples[operation]);
                  setShowExample(true);
                }}
                aria-label={`Insert sample for "${operation}" operation`}
              >
                example
              </button>{" "}
              &nbsp;or press{" "}
              <kbd style={{ background: "#faf3e6", border: "1px solid #cfcfcf", borderRadius: 2, fontSize: 12 }}>
                Ctrl
              </kbd>
              +
              <kbd style={{ background: "#faf3e6", border: "1px solid #cfcfcf", borderRadius: 2, fontSize: 12 }}>
                H
              </kbd>
              {" "}for help!
            </div>
          </div>
          <span
            role="tooltip"
            aria-label="Instructions: Enter math, pick an operation, and press Compute"
            style={{ cursor: "help" }}
            tabIndex={0}
          >
            ℹ️
          </span>
        </div>

        <section aria-label="Math Input Panel" className="mb-4 animate__animated animate__fadeInUp">
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="row g-3 justify-content-center align-items-end">
              <div className="col-12 col-lg-6 mb-2 mb-lg-0">
                <MathInputPanel
                  value={mathExpr}
                  onChange={handleInputChange}
                  disabled={false}
                  ariaLabel="Enter mathematical expression"
                />
              </div>
              <div className="col-12 col-md-4 col-lg-3 mb-2 mb-lg-0">
                <OperationSelector
                  value={operation}
                  onChange={handleOperationChange}
                  withIcons={true}
                  OP_ICONS={OP_ICONS}
                  OP_DESCS={OP_DESCS}
                />
                <div className="text-muted small mt-1" aria-live="polite">
                  <span style={{ fontFamily: "monospace" }}>
                    {OP_ICONS[operation]}{" "}
                  </span>
                  {OP_DESCS[operation]}
                </div>
              </div>
              <div className="col-12 col-md-4 col-lg-3">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 animate__animated animate__pulse"
                  disabled={!validation.valid || !mathExpr.trim()}
                  aria-disabled={!validation.valid}
                  aria-label="Compute solution"
                  tabIndex={0}
                  style={{
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    borderRadius: 10,
                  }}
                >
                  <span className="me-2" aria-hidden>
                    ➡️
                  </span>
                  Compute
                </button>
              </div>
            </div>
            {/* Example/suggestion bar */}
            {showExample && (
              <div
                className="alert alert-info mt-3 border-0 animate__animated animate__fadeIn"
                role="note"
                aria-live="polite"
                tabIndex={0}
              >
                Example for <span className="fw-bold text-primary">{operation}</span>:{" "}
                <span className="bg-light px-2 py-1 rounded small shadow-sm" style={{ fontFamily: "monospace" }}>
                  {examples[operation]}
                </span>
              </div>
            )}
          </form>
        </section>
        <section aria-live="polite" aria-atomic="true">
          <ValidationFeedback valid={validation.valid} message={validation.message} />
        </section>
        <section className="mt-4 animate__animated animate__fadeIn" aria-label="Results panel">
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
      <footer
        className="text-center small text-secondary py-3 bg-light"
        role="contentinfo"
        style={{ marginTop: 24, letterSpacing: 0.2 }}
      >
        <span>
          CalcMaster © {new Date().getFullYear()} — Friendly Math for Everyone!
          {" | "}
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
      {/* Minimal animated feedback for new result */}
      <style>
        {`
        .animate__animated { animation-duration: 0.7s; animation-fill-mode: both; }
        .animate__fadeIn { animation-name: fadeIn; }
        .animate__fadeInUp { animation-name: fadeInUp; }
        .animate__fadeInDown { animation-name: fadeInDown; }
        .animate__pulse { animation-name: pulse; animation-iteration-count: 1; }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:none;} }
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-16px);} to { opacity:1; transform:none;} }
        @keyframes pulse { 0% { transform: scale(1);} 50%{transform: scale(1.03);} 100%{transform:scale(1);} }
        `}
      </style>
    </div>
  );
}

export default App;
