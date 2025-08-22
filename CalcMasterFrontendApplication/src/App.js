import React, { useState, lazy, Suspense } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import MathInputPanel from "./components/MathInputPanel";
import OperationSelector from "./components/OperationSelector";
import ValidationFeedback from "./components/ValidationFeedback";
import ResultsPanel from "./components/ResultsPanel";
import "./components/ButtonStyles.css";
const HomePageLazy = lazy(() => import("./components/HomePage"));
const IntegralOptionsPageLazy = lazy(() => import("./components/IntegralOptionsPage"));
const DifferentialOptionsPageLazy = lazy(() => import("./components/DifferentialOptionsPage"));
const NormalIntegrationPanelLazy = lazy(() => import("./components/NormalIntegrationPanel"));
const AreaOfFigurePanelLazy = lazy(() => import("./components/AreaOfFigurePanel"));
const VolumeTripleIntegralPanelLazy = lazy(() => import("./components/VolumeTripleIntegralPanel"));
const NormalDifferentialPanelLazy = lazy(() => import("./components/NormalDifferentialPanel"));
const TangentAtPointPanelLazy = lazy(() => import("./components/TangentAtPointPanel"));
const TangentToCirclePanelLazy = lazy(() => import("./components/TangentToCirclePanel"));
const TangentToEllipsePanelLazy = lazy(() => import("./components/TangentToEllipsePanel"));
const TriangleLinesInputPanelLazy = lazy(() => import("./components/TriangleLinesInputPanel"));
const LimitPanelLazy = lazy(() => import("./components/LimitPanel"));
const LinearEquationSolverPanelLazy = lazy(() => import("./components/LinearEquationSolverPanel"));
const PolynomialRootsPanelLazy = lazy(() => import("./components/PolynomialRootsPanel"));
const DifferentialEquationSolverPanelLazy = lazy(() => import("./components/DifferentialEquationSolverPanel"));
const NormalCalculatorPanelLazy = lazy(() => import("../src/components/NormalCalculatorPanel"));
import { calculateMathExpression, validateMathExpression } from "./math/mathEngine";

// PUBLIC_INTERFACE
/**
 * Root application component, overhauled for user friendliness, onboarding, and accessibility.
 * Includes calculator, selector screens for Integral and Differential, as well as home and main computation.
 */
function App() {
  const [theme, setTheme] = useState("light");
  const [homeMode, setHomeMode] = useState(null); // "calculator", "integral", "differential", "limits", "linear-solver", "poly-roots"
  const [integralSubOption, setIntegralSubOption] = useState(null); // "normal", "area", "volume"
  const [differentialSubOption, setDifferentialSubOption] = useState(null); // "normal", "tangent"

  // States for main math panel after operation selected
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

  // -- Panel Navigation Logic --
  const handleHomeSelect = (mode) => {
    setHomeMode(mode);
    // For modes that tie to existing operation selector, map; otherwise keep current
    if (mode === "limits") {
      setOperation("limit");
    } else if (mode === "integral") {
      setOperation("integral");
    } else if (mode === "differential") {
      setOperation("differential");
    }
    setIntegralSubOption(null);
    setDifferentialSubOption(null);
  };
  const handleIntegralOption = (opt) => setIntegralSubOption(opt);
  const handleDifferentialOption = (opt) => setDifferentialSubOption(opt);
  const handleBackFromSubSelector = () => {
    setHomeMode(null);
    setIntegralSubOption(null);
    setDifferentialSubOption(null);
  };

  // Keyboard shortcut for toggle help/examples (call ONLY ONCE, top-level)
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
    // eslint-disable-next-line
  }, []);

  // --- NAVIGATION SCREENS ---
  if (!homeMode) {
    return (
      <div className={`App bg-${theme} app-root`}>
        <div className="content-surface">
          <button
            className="btn btn-outline-secondary theme-toggle"
            style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
          </button>
          <Suspense fallback={<div className="container p-4">Loading…</div>}>
            <HomePageLazy onSelectMode={handleHomeSelect} />
          </Suspense>
        </div>
      </div>
    );
  }

  // --- NORMAL CALCULATOR PANEL ---
  if (homeMode === "calculator") {
    return (
      <div className={`App bg-${theme} app-root`}>
        <div className="content-surface">
          <button
            className="btn btn-outline-secondary theme-toggle"
            style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
          </button>
          <Suspense fallback={<div className="container p-4">Loading…</div>}>
            <NormalCalculatorPanelLazy onBack={() => setHomeMode(null)} />
          </Suspense>
        </div>
      </div>
    );
  }

  if (homeMode === "integral" && !integralSubOption) {
    return (
      <div className={`App bg-${theme} app-root`}>
        <div className="content-surface">
          <button
            className="btn btn-outline-secondary theme-toggle"
            style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
          </button>
          <Suspense fallback={<div className="container p-4">Loading…</div>}>
            <IntegralOptionsPageLazy
              onSelectOption={handleIntegralOption}
              onBack={handleBackFromSubSelector}
            />
          </Suspense>
        </div>
      </div>
    );
  }
  // --- NEW: Show Normal Integration panel if selected ---
  if (homeMode === "integral" && integralSubOption === "normal") {
    return (
      <div className={`App bg-${theme} app-root`}>
        <div className="content-surface">
        <button
          className="btn btn-outline-secondary theme-toggle"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
        </button>
        <Suspense fallback={<div className="container p-4">Loading…</div>}>
          <NormalIntegrationPanelLazy
            onBack={() => {
              setIntegralSubOption(null);
            }}
          />
        </Suspense>
        </div>
      </div>
    );
  }
  // --- NEW: Area of Figure panel route ---
  if (homeMode === "integral" && integralSubOption === "area") {
    return (
      <div className={`App bg-${theme}`}>
        <button
          className="btn btn-outline-secondary theme-toggle"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
        </button>
        <Suspense fallback={<div className="container p-4">Loading…</div>}>
          <AreaOfFigurePanelLazy
            onBack={() => {
              setIntegralSubOption(null);
            }}
          />
        </Suspense>
      </div>
    );
  }
  // --- NEW: Volume (Triple Integral) panel route ---
  if (homeMode === "integral" && integralSubOption === "volume") {
    return (
      <div className={`App bg-${theme}`}>
        <button
          className="btn btn-outline-secondary theme-toggle"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
        </button>
        <Suspense fallback={<div className="container p-4">Loading…</div>}>
          <VolumeTripleIntegralPanelLazy
            onBack={() => {
              setIntegralSubOption(null);
            }}
          />
        </Suspense>
      </div>
    );
  }
  
  if (homeMode === "differential" && !differentialSubOption) {
    return (
      <div className={`App bg-${theme}`}>
        <button
          className="btn btn-outline-secondary theme-toggle"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
        </button>

        <Suspense fallback={<div className="container p-4">Loading…</div>}>
          <DifferentialOptionsPageLazy
            onSelectOption={handleDifferentialOption}
            onBack={handleBackFromSubSelector}
          />
        </Suspense>
      </div>
    );
  }

  // --- NEW: Normal Differential Panel ---
  if (homeMode === "differential" && differentialSubOption === "normal") {
    return (
      <div className={`App bg-${theme}`}>
        <button
          className="btn btn-outline-secondary theme-toggle"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
        </button>
        <Suspense fallback={<div className="container p-4">Loading…</div>}>
          <NormalDifferentialPanelLazy
            onBack={() => {
              setDifferentialSubOption(null);
            }}
          />
        </Suspense>
      </div>
    );
  }
  // --- NEW: Differential Equation Solver Panel ---
  if (homeMode === "differential" && differentialSubOption === "diffeq") {
    return (
      <div className={`App bg-${theme}`}>
        <button
          className="btn btn-outline-secondary theme-toggle"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
        </button>
        <Suspense fallback={<div className="container p-4">Loading…</div>}>
          <DifferentialEquationSolverPanelLazy
            onBack={() => {
              setDifferentialSubOption(null);
            }}
          />
        </Suspense>
      </div>
    );
  }
  // --- NEW: Tangent at a Point Panel ---
  if (homeMode === "differential" && differentialSubOption === "tangent") {
    return (
      <div className={`App bg-${theme}`}>
        <button
          className="btn btn-outline-secondary theme-toggle"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
        </button>
        <Suspense fallback={<div className="container p-4">Loading…</div>}>
          <TangentAtPointPanelLazy
            onBack={() => {
              setDifferentialSubOption(null);
            }}
          />
        </Suspense>
      </div>
    );
  }
  // --- NEW: Tangent to Circle Panel ---
  if (homeMode === "differential" && differentialSubOption === "tangent-circle") {
    return (
      <div className={`App bg-${theme}`}>
        <button
          className="btn btn-outline-secondary theme-toggle"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
        </button>
        <Suspense fallback={<div className="container p-4">Loading…</div>}>
          <TangentToCirclePanelLazy
            onBack={() => {
              setDifferentialSubOption(null);
            }}
          />
        </Suspense>
      </div>
    );
  }
  // --- NEW: Tangent to Ellipse Panel ---
  if (homeMode === "differential" && differentialSubOption === "tangent-ellipse") {
    return (
      <div className={`App bg-${theme}`}>
        <button
          className="btn btn-outline-secondary theme-toggle"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
        </button>
        <Suspense fallback={<div className="container p-4">Loading…</div>}>
          <TangentToEllipsePanelLazy
            onBack={() => {
              setDifferentialSubOption(null);
            }}
          />
        </Suspense>
      </div>
    );
  }

  // --- NEW: Triangle from 3 Lines Panel ---
  if (homeMode === "differential" && differentialSubOption === "triangle-3lines") {
    return (
      <div className={`App bg-${theme}`}>
        <button
          className="btn btn-outline-secondary theme-toggle"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
        </button>
        <Suspense fallback={<div className="container p-4">Loading…</div>}>
          <TriangleLinesInputPanelLazy
            onBack={() => {
              setDifferentialSubOption(null);
            }}
          />
        </Suspense>
      </div>
    );
  }

  // --- MAIN PANEL LOGIC ---

  // --- LIMITS PANEL ---
  if (homeMode === "limits") {
    return (
      <div className={`App bg-${theme}`}>
        <button
          className="btn btn-outline-secondary theme-toggle"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
        </button>

        <Suspense fallback={<div className="container p-4">Loading…</div>}>
          <LimitPanelLazy onBack={() => setHomeMode(null)} />
        </Suspense>
      </div>
    );
  }

  // --- LINEAR EQUATION SOLVER PANEL (placeholder) ---
  if (homeMode === "linear-solver") {
    return (
      <div className={`App bg-${theme}`}>
        <button
          className="btn btn-outline-secondary theme-toggle"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
        </button>
        <Suspense fallback={<div className="container p-4">Loading…</div>}>
          <LinearEquationSolverPanelLazy onBack={() => setHomeMode(null)} />
        </Suspense>
      </div>
    );
  }

  // --- POLYNOMIAL ROOTS PANEL (placeholder) ---
  if (homeMode === "poly-roots") {
    return (
      <div className={`App bg-${theme}`}>
        <button
          className="btn btn-outline-secondary theme-toggle"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Theme
        </button>
        <Suspense fallback={<div className="container p-4">Loading…</div>}>
          <PolynomialRootsPanelLazy onBack={() => setHomeMode(null)} />
        </Suspense>
      </div>
    );
  }

  // Mode-dependent heading
  const getModeHeading = () => {
    switch (homeMode) {
      case "integral":
        if (integralSubOption === "area")
          return <h2 className="fw-bold mb-4 text-success">Area of a Figure (Integral)</h2>;
        if (integralSubOption === "volume")
          return <h2 className="fw-bold mb-4 text-info">Volume by Integration</h2>;
        return <h2 className="fw-bold mb-4 text-primary">Integral Calculator</h2>;
      case "differential":
        if (differentialSubOption === "tangent")
          return <h2 className="fw-bold mb-4 text-secondary">Tangent at a Point (Differential)</h2>;
        return <h2 className="fw-bold mb-4 text-danger">Differential Calculator</h2>;
      case "limits":
        return <h2 className="fw-bold mb-4 text-success">Limit Calculator</h2>;
      default:
        return null;
    }
  };

  // Math logic
  const handleInputChange = (expr) => {
    setMathExpr(expr);
    const res = validateMathExpression(expr, operation);
    setValidation(res);
    if (res.valid) setResult({ formatted: "", error: "", raw: "" });
  };
  const handleOperationChange = (op) => {
    setOperation(op);
    const res = validateMathExpression(mathExpr, op);
    setValidation(res);
    setResult({ formatted: "", error: "", raw: "" });
    setShowExample(false);
  };
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

  const examples = {
    limit: "lim_{x\\to0} sin(x)/x",
    integral: "\\int x^2 dx",
    differential: "d/dx x^2",
    trigonometric: "cos(3.14159)",
  };

  const OP_ICONS = {
    limit: "🍀",
    integral: "∫",
    differential: "ᴇ/ᴇᵪ",
    trigonometric: "𝓣𝓪𝓷",
  };
  const OP_DESCS = {
    limit: "Calculate the value a function approaches.",
    integral: "Find the integral or area under a curve.",
    differential: "Find the derivative or rate of change.",
    trigonometric: "Evaluate sine, cosine, tangent, etc.",
  };

  return (
    <div className={`App bg-${theme} app-root`} data-testid="main-app-container">
      <div className="content-surface">
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
        {/* Panel title for current mode */}
        {getModeHeading()}

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
                  className="btn btn-compute btn-lg w-100 animate__animated animate__pulse btn-affirm"
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
                Example for <span className="fw-bold text-primary">{operation}</span>{" "}
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
    </div>
  );
}

export default App;
