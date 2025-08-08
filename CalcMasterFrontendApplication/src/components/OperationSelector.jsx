import React from "react";
import PropTypes from "prop-types";

// PUBLIC_INTERFACE
/**
 * Dropdown for selecting math operation type.
 * @param {string} value
 * @param {Function} onChange
 */
function OperationSelector({ value, onChange }) {
  return (
    <label className="form-label w-100" htmlFor="operation-select">
      <span className="fw-bold">Operation</span>
      <select
        id="operation-select"
        className="form-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select operation type"
        required
      >
        <option value="limit">Limit</option>
        <option value="integral">Integral</option>
        <option value="trigonometric">Trigonometric</option>
      </select>
    </label>
  );
}

OperationSelector.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default OperationSelector;
