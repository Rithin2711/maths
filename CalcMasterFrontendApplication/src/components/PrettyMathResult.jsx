import React from "react";
import PropTypes from "prop-types";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

// PUBLIC_INTERFACE
/**
 * PrettyMathResult visually presents a LaTeX-rendered math result inside a
 * styled card with an accent color, title, and optional subtitle.
 *
 * This component ensures math is rendered via KaTeX (not shown as raw LaTeX text),
 * and applies a clear, accessible presentation suitable for result displays.
 *
 * Props:
 * @param {string} title - Heading for the result section (e.g., "Partial Derivative")
 * @param {string} [subtitle] - Optional subtitle (e.g., "with respect to x")
 * @param {string} latex - The LaTeX string to render (rendered with KaTeX BlockMath)
 * @param {string} [accentColor] - Hex/RGB color used for the accent border and header
 * @param {string} [ariaLabel] - Optional ARIA label for accessibility
 */
function PrettyMathResult({ title, subtitle, latex, accentColor = "#6c63ff", ariaLabel }) {
  const headerStyle = {
    color: accentColor,
    fontWeight: 700,
    letterSpacing: 0.2,
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  };

  const cardStyle = {
    borderRadius: 14,
    padding: "14px 16px",
    background: "#fffefd",
    border: `2px solid ${accentColor}22`,
    boxShadow: "0 4px 18px 0 rgba(20,20,20,0.06)",
  };

  const badgeStyle = {
    display: "inline-block",
    background: `${accentColor}14`,
    color: accentColor,
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.3,
  };

  return (
    <div
      className="pretty-math-result"
      aria-label={ariaLabel || title || "Math result"}
      role="group"
      style={{
        position: "relative",
        borderLeft: `6px solid ${accentColor}`,
        borderRadius: 14,
      }}
    >
      <div className="card" style={cardStyle}>
        <div style={headerStyle}>
          <span aria-hidden="true" style={{ fontSize: 18 }}>∎</span>
          <span>{title}</span>
          {subtitle && (
            <span className="ms-auto" style={badgeStyle}>
              {subtitle}
            </span>
          )}
        </div>
        <div
          className="math-body"
          style={{
            fontSize: "1.08rem",
            background: "#fbfbff",
            borderRadius: 10,
            padding: "10px 12px",
          }}
        >
          <BlockMath>{latex}</BlockMath>
        </div>
      </div>
    </div>
  );
}

PrettyMathResult.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  latex: PropTypes.string.isRequired,
  accentColor: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default PrettyMathResult;
