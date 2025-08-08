import React from "react";
import PropTypes from "prop-types";

// PUBLIC_INTERFACE
/**
 * Page to select among Integral sub-options.
 * @param {function} onSelectOption - Callback with chosen sub-option: "normal", "area", "volume".
 * @param {function} onBack - Callback to go back to home.
 */
function IntegralOptionsPage({ onSelectOption, onBack }) {
  const options = [
    {
      key: "normal",
      label: "Normal Integration",
      desc: "Find the indefinite or definite integral of a function.",
      color: "#3b71eb",
      emoji: "∫",
    },
    {
      key: "area",
      label: "Area of a Figure",
      desc: "Calculate area bounded by a curve and lines.",
      color: "#35b46d",
      emoji: "🟩",
    },
    {
      key: "volume",
      label: "Volume",
      desc: "Find the volume of a solid of revolution.",
      color: "#e87a41",
      emoji: "🟠",
    },
  ];
  return (
    <main className="d-flex flex-column align-items-center justify-content-center pt-4 pb-4" style={{ minHeight: "98vh" }}>
      <h1 className="fw-bold mb-3 text-primary" tabIndex={0} style={{ fontSize: "2.1rem", letterSpacing: ".04em" }}>
        Choose Integral Type
      </h1>
      <div className="w-100 mb-4 d-flex flex-column gap-3 align-items-center" style={{ maxWidth: 430 }}>
        {options.map(o => (
          <button
            key={o.key}
            className="btn w-100 shadow-lg d-flex flex-column align-items-start justify-content-center"
            style={{
              minHeight: 94,
              borderRadius: 15,
              fontWeight: 600,
              fontSize: "1.13rem",
              letterSpacing: ".03em",
              background: `linear-gradient(90deg, ${o.color}16 36%, #fff 110%)`,
              border: `2.5px solid ${o.color}22`,
              boxShadow: "0 2px 14px #eef1ff26",
              padding: "22px 28px",
              cursor: "pointer",
              transition: "transform 0.12s, box-shadow 0.12s",
            }}
            aria-label={o.label}
            onClick={() => onSelectOption(o.key)}
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && onSelectOption(o.key)}
          >
            <span className="d-block mb-1" style={{ fontSize: "1.6rem" }}>{o.emoji}</span>
            <span className="fw-bold">{o.label}</span>
            <small className="text-secondary">{o.desc}</small>
          </button>
        ))}
      </div>
      <button
        className="btn btn-outline-secondary mt-2"
        onClick={onBack}
        aria-label="Go Back"
        style={{ borderRadius: 12, fontWeight: 500, minWidth: 110 }}
      >
        ← Back
      </button>
    </main>
  );
}
IntegralOptionsPage.propTypes = {
  onSelectOption: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};
export default IntegralOptionsPage;
