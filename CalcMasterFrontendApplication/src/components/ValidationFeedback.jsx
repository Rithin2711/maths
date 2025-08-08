import React from "react";
import PropTypes from "prop-types";

// PUBLIC_INTERFACE
/**
 * Friendlier validation feedback for math input panel, with animated icon and color cues.
 * @param {boolean} valid - Is the input valid?
 * @param {string} message - Feedback message.
 */
function ValidationFeedback({ valid, message }) {
  if (!message) return null;
  return (
    <div
      className={`alert d-flex align-items-center gap-2 ${
        valid ? "alert-success" : "alert-danger"
      } mt-2 animate__animated animate__fadeIn`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={0}
      style={{
        borderRadius: 10,
        fontSize: "1.02rem",
        boxShadow: valid ? "0 1px 12px #e4ffe6" : "0 1px 12px #ffe4e4",
      }}
    >
      <span
        aria-hidden
        style={{
          fontSize: 20,
          verticalAlign: "middle",
          marginRight: 8,
          animation: "pulse .8s cubic-bezier(.4,0,.6,1)",
        }}
      >
        {valid ? "✅" : "⚠️"}
      </span>
      <span>{message}</span>
    </div>
  );
}

ValidationFeedback.propTypes = {
  valid: PropTypes.bool.isRequired,
  message: PropTypes.string,
};

export default ValidationFeedback;
