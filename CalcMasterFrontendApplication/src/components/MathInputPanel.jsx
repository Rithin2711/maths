import React, { useRef } from "react";
import PropTypes from "prop-types";

// PUBLIC_INTERFACE
/**
 * Input panel for math expression - upgrades with inline help, icon, and friendly banner.
 * @param {string} value - The expression value.
 * @param {Function} onChange - Callback for input change.
 * @param {boolean} [disabled]
 * @param {string} [ariaLabel]
 */
function MathInputPanel({ value, onChange, disabled = false, ariaLabel }) {
  const inputRef = useRef();

  // Keyboard accessibility: Ctrl+Enter submits, arrow navigation
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.target.form?.requestSubmit?.();
    }
  };

  const handleInput = (e) => {
    onChange(e.target.value);
  };

  return (
    <label className="form-label w-100" htmlFor="math-expr-input">
      <span className="fw-bold" style={{ fontSize: 18 }}>
        ✏️ Expression{" "}
        <span
          tabIndex={0}
          role="tooltip"
          style={{ fontSize: 14, color: "#E87A41", cursor: "help" }}
          aria-label="You can use basic math, parentheses, and math keywords!"
        >
          (What's this?)
        </span>
      </span>
      <input
        ref={inputRef}
        id="math-expr-input"
        className="form-control"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        required
        aria-label={ariaLabel || "Math expression input"}
        autoFocus
        autoComplete="off"
        spellCheck={false}
        inputMode="text"
        aria-required="true"
        aria-describedby="math-expr-help"
        style={{
          fontFamily: "'JetBrains Mono', 'Menlo', 'Consolas', monospace",
          fontSize: "1.07rem",
          borderRadius: 12,
          marginTop: 3,
          background: "#fafafc",
        }}
        placeholder='e.g. sin(x), ∫ x^2 dx, "lim_{x→0} sin(x)/x"'
      />
      <div
        id="math-expr-help"
        className="form-text"
        tabIndex={0}
        aria-live="polite"
        style={{ fontSize: 14, color: "#8e6128", background: "#fffbe5", borderRadius: 6, padding: "4px 9px", marginTop: 7 }}
      >
        Please enter your math expression.<br />
        Examples: <code>sin(x)</code>, <code>∫ x² dx</code>, <code>lim_&#123;x→0&#125; sin(x)/x</code><br />
        <span className="text-muted small">Tip: Use basic math symbols, trigonometric or calculus notation!</span>
      </div>
    </label>
  );
}

MathInputPanel.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  ariaLabel: PropTypes.string,
};

export default MathInputPanel;
