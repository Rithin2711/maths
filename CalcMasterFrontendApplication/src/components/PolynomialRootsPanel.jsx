import React, { useState } from "react";
import PropTypes from "prop-types";

// PUBLIC_INTERFACE
/**
 * PolynomialRootsPanel
 * A basic placeholder UI for entering a polynomial and computing its roots.
 * Currently validates input and shows a stub message.
 */
function PolynomialRootsPanel({ onBack }) {
  const [poly, setPoly] = useState("");

  const handleCompute = (e) => {
    e.preventDefault();
    if (!poly.trim()) {
      alert("Enter a polynomial, e.g., x^3 - 6x^2 + 11x - 6");
      return;
    }
    // Placeholder: will use math.js or a dedicated solver later
    alert(`Finding roots of: ${poly} (placeholder).`);
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Find Polynomial Roots</h2>
        <button className="btn btn-outline-secondary" onClick={onBack} aria-label="Back to Home">
          ← Back
        </button>
      </div>
      <form onSubmit={handleCompute}>
        <div className="mb-3">
          <label htmlFor="polyExpr" className="form-label fw-bold">Polynomial</label>
          <input
            id="polyExpr"
            type="text"
            className="form-control"
            placeholder="e.g., x^3 - 6x^2 + 11x - 6"
            value={poly}
            onChange={(e) => setPoly(e.target.value)}
            aria-label="Polynomial expression"
          />
          <div className="form-text">Use x as the variable. Coefficients can be integers or decimals.</div>
        </div>
        <button type="submit" className="btn btn-primary">Compute Roots (placeholder)</button>
      </form>
      <div className="alert alert-warning mt-3" role="note">
        This is a placeholder interface. Root calculation and LaTeX formatting will be implemented later.
      </div>
    </div>
  );
}

PolynomialRootsPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default PolynomialRootsPanel;
