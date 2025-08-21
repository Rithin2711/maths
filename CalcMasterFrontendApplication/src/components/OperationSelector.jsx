import React from "react";
import PropTypes from "prop-types";

// PUBLIC_INTERFACE
/**
 * Friendlier radio button group for selecting math operation type, optionally with icons.
 * @param {string} value
 * @param {Function} onChange
 * @param {boolean} [withIcons] - Show icons (default: false)
 * @param {object} [OP_ICONS]
 * @param {object} [OP_DESCS]
 */
function OperationSelector({ value, onChange, withIcons, OP_ICONS = {}, OP_DESCS = {} }) {
  // For radio layout, give each option additional cues and tooltips.
  const options = [
    {
      val: "limit",
      label: "Limit",
      icon: OP_ICONS.limit ?? "🍀",
      desc: OP_DESCS.limit ?? "Calculate approaching value",
    },
    {
      val: "integral",
      label: "Integral",
      icon: OP_ICONS.integral ?? "∫",
      desc: OP_DESCS.integral ?? "Find area under curve",
    },
    {
      val: "trigonometric",
      label: "Trig",
      icon: OP_ICONS.trigonometric ?? "𝚃𝚛𝚒𝚐",
      desc: OP_DESCS.trigonometric ?? "Sine, cosine, etc.",
    },
  ];
  return (
    <fieldset className="form-group" aria-label="Select operation type">
      <legend className="form-label fw-bold mb-2" style={{ fontSize: "1rem" }}>
        Operation <span className="ms-1" aria-hidden>{withIcons ? "🛠️" : ""}</span>
      </legend>
      <div className="d-flex gap-3 justify-content-between flex-wrap" role="radiogroup" tabIndex={0}>
        {options.map((o) => (
          <div
            key={o.val}
            className="form-check flex-fill"
            style={{
              minWidth: 80,
              maxWidth: 200,
            }}
            title={o.desc}
            tabIndex={0}
          >
            <input
              className="form-check-input"
              type="radio"
              name="operation"
              id={`op-${o.val}`}
              value={o.val}
              checked={value === o.val}
              onChange={() => onChange(o.val)}
              aria-checked={value === o.val}
              aria-label={o.label}
              tabIndex={0}
              style={{ cursor: "pointer" }}
            />
            <label className="form-check-label" htmlFor={`op-${o.val}`} style={{ cursor: "pointer" }}>
              {withIcons && (
                <span className="me-1" aria-hidden="true" style={{ fontSize: 18 }}>
                  {o.icon}
                </span>
              )}
              <span className="fw-bold" style={{ fontSize: "1rem" }}>{o.label}</span>
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

OperationSelector.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  withIcons: PropTypes.bool,
  OP_ICONS: PropTypes.object,
  OP_DESCS: PropTypes.object,
};

export default OperationSelector;
