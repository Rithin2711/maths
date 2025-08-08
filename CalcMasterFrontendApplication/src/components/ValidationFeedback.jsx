import React from "react";
import PropTypes from "prop-types";

// PUBLIC_INTERFACE
/**
 * Renders validation feedback for the input panel.
 * @param {boolean} valid - Is the input valid?
 * @param {string} message - Feedback message.
 */
function ValidationFeedback({ valid, message }) {
  if (!message) return null;
  return (
    <div
      className={`alert ${valid ? "alert-success" : "alert-danger"} mt-2`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {message}
    </div>
  );
}

ValidationFeedback.propTypes = {
  valid: PropTypes.bool.isRequired,
  message: PropTypes.string,
};

export default ValidationFeedback;
