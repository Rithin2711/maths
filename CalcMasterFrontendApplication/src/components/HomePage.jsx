import React from "react";
import PropTypes from "prop-types";
import "./HomePage.css";

// PUBLIC_INTERFACE
/**
 * HomePage for CalcMaster: lets user select Integral, Differential, or Limits mode.
 * This version includes a collage-friendly layout with a readable focus panel and subtle watermark accents.
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
      icon: "𝐑/𝐑ᵥ",
      colorClass: "home-btn-differential",
    },
    {
      key: "limits",
      label: "Limits",
      desc: "Calculate mathematical limits and continuity.",
      icon: "lim",
      colorClass: "home-btn-limits",
    },
    {
      key: "linear-solver",
      label: "Solve Linear Equation (2-6 variables)",
      desc: "Solve Ax = b for 2 to 6 variables.",
      icon: "A𝒙=b",
      colorClass: "home-btn-linear",
    },
    {
      key: "poly-roots",
      label: "Find Polynomial Roots",
      desc: "Compute roots (real/complex) of polynomials.",
      icon: "roots",
      colorClass: "home-btn-poly",
    },
  ];

  return (
    <main
      className="homepage-main d-flex flex-column justify-content-center align-items-center"
      role="region"
      aria-label="Calculator home"
    >
      {/* Background accent stripe (non-text watermark) */}
      <div className="watermark-accent" aria-hidden="true" />

      {/* Readable focus wrapper to ensure content prominence */}
      <section className="home-focus" aria-labelledby="calc-title">
        <h1 id="calc-title" className="homepage-title mt-4 mb-2 fw-bold" tabIndex={0}>
          CalcMaster
        </h1>
        <h2 className="homepage-subtitle mb-4" tabIndex={0}>
          Choose a Math Operation
        </h2>

        <div
          className="homepage-modes d-flex flex-row gap-4 flex-wrap justify-content-center mb-2"
          role="group"
          aria-label="Select operation"
        >
          {modes.map((mode) => (
            <button
              key={mode.key}
              className={`home-mode-btn ${mode.colorClass} shadow-lg`}
              tabIndex={0}
              aria-label={mode.label}
              onClick={() => onSelectMode(mode.key)}
              style={{
                minWidth: 170,
                minHeight: 145,
                fontSize: "1.2rem",
                border: "none",
                borderRadius: 18,
                padding: "30px 28px",
                cursor: "pointer",
                transition: "transform 0.12s ease, box-shadow 0.12s",
                outline: "none",
                fontWeight: 650,
                letterSpacing: 0.2,
                boxShadow: "0 4px 24px 0 rgba(80,100,200,0.06)",
                backgroundClip: "padding-box",
              }}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && onSelectMode(mode.key)
              }
            >
              <span
                style={{
                  fontSize: "2.7rem",
                  display: "block",
                  marginBottom: 14,
                }}
                aria-hidden="true"
              >
                {mode.icon}
              </span>
              <span className="d-block mb-1">{mode.label}</span>
              <span className="homepage-mode-desc small text-body-secondary">
                {mode.desc}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

HomePage.propTypes = {
  onSelectMode: PropTypes.func.isRequired,
};

export default HomePage;
