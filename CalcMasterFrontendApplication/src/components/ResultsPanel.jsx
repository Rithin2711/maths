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
/**
 * Results panel, now animated and more welcoming.
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
    <div
      className="results-panel card shadow border-0 mx-auto animate__animated animate__fadeInUp"
      style={{
        maxWidth: 700,
        boxShadow: "0 2px 18px #e9e6fa2e",
        borderRadius: 18,
        marginBottom: 24,
      }}
      tabIndex={0}
      aria-live="polite"
    >
      <div className="card-body">
        <h2 className="h5 card-title mb-3" tabIndex={0}>
          📊 {error ? "Oops!" : "Result"}
        </h2>
        {error && (
          <div
            className="alert alert-danger d-flex align-items-center gap-2"
            role="alert"
            aria-live="polite"
            tabIndex={0}
          >
            <span style={{ fontSize: 18, marginRight: 6 }}>❌</span>
            <span>{error}</span>
          </div>
        )}
        {!error && resultLatex && (
          <div className="display-6 animate__animated animate__pulse" aria-label="Math result (LaTeX)">
            <BlockMath>{resultLatex}</BlockMath>
          </div>
        )}
        {!error && raw && (
          <pre
            className="small mt-3 p-2 bg-light border rounded"
            tabIndex={0}
            aria-label="Plain result"
            style={{
              border: "1px dashed #b7d7ee",
              background: "#f0f6ff",
              borderRadius: 9,
            }}
          >
            <code>{raw}</code>
          </pre>
        )}
        {!error && !resultLatex && !raw && (
          <div
            className="alert alert-info"
            role="status"
            tabIndex={0}
            style={{ borderRadius: 10, marginTop: 8 }}
          >
            Ready! Please enter and submit your expression above to get a solution.
          </div>
        )}
      </div>
      <div className="card-footer small bg-light text-muted" style={{ borderRadius: "0 0 18px 18px" }}>
        <span aria-label="Math operation info" className="d-flex flex-wrap gap-3">
          <span>
            <strong>Input:</strong> {inputExpr || <em>(none)</em>}
          </span>
          <span>
            <strong>Operation:</strong> {operation.charAt(0).toUpperCase() + operation.slice(1)}
          </span>
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
