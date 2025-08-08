import React, { useRef } from "react";
import PropTypes from "prop-types";

// PUBLIC_INTERFACE
/**
 * Input panel for entering a math expression.
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
      <span className="fw-bold">Expression</span>
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
        style={{ fontFamily: "'JetBrains Mono', 'Menlo', 'Consolas', monospace" }}
      />
      <div id="math-expr-help" className="form-text">
        e.g. <code>sin(x)</code>, <code>\\int x^2 dx</code>, <code>lim_&#123;x\\to 0&#125; \\frac&#123;sin(x)&#125;&#123;x&#125;</code>
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
