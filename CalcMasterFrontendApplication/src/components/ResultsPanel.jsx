import React from "react";
import PropTypes from "prop-types";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

/**
 * Renders calculation results using KaTeX.
 * @param {boolean} isValid
 * @param {string} error
 * @param {string} resultLatex
 * @param {string} raw - (plain text result)
 * @param {string} inputExpr
 * @param {string} operation
 */
// PUBLIC_INTERFACE
function ResultsPanel({ isValid, error, resultLatex, raw, inputExpr, operation }) {
  if (!isValid && !error) return null;
  return (
    <div className="results-panel card shadow-sm border-0 mx-auto" style={{ maxWidth: 700 }}>
      <div className="card-body">
        <h2 className="h5 card-title mb-3" tabIndex={0}>
          Result
        </h2>
        {error && (
          <div className="alert alert-danger" role="alert" aria-live="polite">
            <strong>Error:</strong> {error}
          </div>
        )}
        {!error && resultLatex && (
          <BlockMath math={resultLatex} aria-label="Math result (LaTeX)" className="display-6" />
        )}
        {!error && raw && (
          <pre className="small mt-3 p-2 bg-light border rounded" tabIndex={0}>
            <code>{raw}</code>
          </pre>
        )}
        {!error && !resultLatex && !raw && (
          <div className="alert alert-info" role="status">
            Submit a valid expression to see the result here.
          </div>
        )}
      </div>
      <div className="card-footer small bg-light text-muted">
        <span aria-label="Math operation info">
          <strong>Input:</strong> {inputExpr || <em>(none)</em>} | <strong>Operation:</strong>{" "}
          {operation.charAt(0).toUpperCase() + operation.slice(1)}
        </span>
      </div>
    </div>
  );
}

ResultsPanel.propTypes = {
  isValid: PropTypes.bool.isRequired,
  error: PropTypes.string,
  resultLatex: PropTypes.string,
  raw: PropTypes.string,
  inputExpr: PropTypes.string,
  operation: PropTypes.string,
};

export default ResultsPanel;
