import React from "react";
import PropTypes from "prop-types";
import "./HomePage.css";

// PUBLIC_INTERFACE
/**
 * HomePage for CalcMaster: lets user select Integral, Differential, or Limits mode.
 * @param {function} onSelectMode - Called with mode: "integral", "differential", or "limits"
 */
function HomePage({ onSelectMode }) {
  const modes = [
    {
      key: "integral",
      label: "Integral",
      desc: "Compute integrals and area under curves.",
      icon: "∫",
      colorClass: "home-btn-integral",
    },
    {
      key: "differential",
      label: "Differential",
      desc: "Perform differentiation and solve derivatives.",
      icon: "𝑑/𝑑𝑥",
      colorClass: "home-btn-differential",
    },
    {
      key: "limits",
      label: "Limits",
      desc: "Calculate mathematical limits and continuity.",
      icon: "lim",
      colorClass: "home-btn-limits",
    },
  ];
  return (
    <main className="homepage-main d-flex flex-column justify-content-center align-items-center">
      <h1 className="homepage-title mt-4 mb-2 text-primary fw-bold" tabIndex={0}>
        CalcMaster
      </h1>
      <h2 className="homepage-subtitle mb-4 text-secondary" tabIndex={0}>
        Choose a Math Operation
      </h2>
      <div className="homepage-modes d-flex flex-row gap-4 flex-wrap justify-content-center mb-5">
        {modes.map((mode) => (
          <button
            key={mode.key}
            className={`home-mode-btn ${mode.colorClass} shadow-lg`}
            tabIndex={0}
            aria-label={mode.label}
            onClick={() => onSelectMode(mode.key)}
            style={{
              minWidth: 170, minHeight: 145,
              fontSize: "1.2rem",
              border: "none",
              borderRadius: 18,
              padding: "30px 28px",
              cursor: "pointer",
              transition: "transform 0.12s ease, box-shadow 0.12s",
              outline: "none",
              fontWeight: 650,
              letterSpacing: 0.2,
              boxShadow: "0 4px 24px 0 rgba(80,100,200,0.06)"
            }}
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && onSelectMode(mode.key)}
          >
            <span style={{ fontSize: "2.7rem", display: "block", marginBottom: 14 }}>{mode.icon}</span>
            <span className="d-block mb-1">{mode.label}</span>
            <span className="homepage-mode-desc small text-body-secondary">{mode.desc}</span>
          </button>
        ))}
      </div>
      <footer className="homepage-footer text-center mt-auto text-muted small">
        <span>
          Friendly Math for Everyone — <a href="https://github.com/kavia-ai" target="_blank" rel="noopener noreferrer">GitHub</a>
        </span>
      </footer>
    </main>
  );
}

HomePage.propTypes = {
  onSelectMode: PropTypes.func.isRequired,
};

export default HomePage;
