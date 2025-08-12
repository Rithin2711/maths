import React from "react";
import PropTypes from "prop-types";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

/**
 * PUBLIC_INTERFACE
 * ResultsPanel renders calculation results using KaTeX while ensuring that, for integrals,
 * only the final numeric/evaluated value is shown (no raw 'latex' or 'latex*' labels, and
 * no LaTeX code is displayed as plain text). For other operations, we preserve the existing
 * rendering with KaTeX and optionally a plain text block for accessibility.
 *
 * Props:
 * @param {boolean} isValid - Whether the input expression is valid
 * @param {string} error - Error message if any
 * @param {string} resultLatex - The formatted (LaTeX) result string
 * @param {string} raw - Plain text result
 * @param {string} inputExpr - The original input expression
 * @param {string} operation - Operation type (e.g., 'integral', 'limit', etc.)
 */
// PUBLIC_INTERFACE
function ResultsPanel({ isValid, error, resultLatex, raw, inputExpr, operation }) {
  if (!isValid && !error) return null;

  // Utility to ensure no "latex" or "latex*" labels are displayed to the user in plain text.
  const stripLatexLabels = (s) => (s || "").replace(/latex\*?/gi, "").trim();

  // Determine if we are rendering an integral result where only the final value should be shown.
  const isIntegral = (operation || "").toLowerCase() === "integral";

  // For integrals: try to extract the numeric/evaluated right-hand side if an equality exists in resultLatex.
  // e.g., "... = 0.5" -> show only "0.5" (rendered).
  let integralDisplayValue = "";
  if (isIntegral && !error) {
    if (typeof resultLatex === "string" && resultLatex.includes("=")) {
      const eqMatch = resultLatex.match(/=(.*)$/s);
      integralDisplayValue = stripLatexLabels(eqMatch ? eqMatch[1].trim() : "");
    } else if (raw) {
      // Fallback to raw if we don't have an equality in the LaTeX result.
      // Ensure we strip any accidental "latex"/"latex*" labels in raw text.
      integralDisplayValue = stripLatexLabels(raw);
    }
  }

  // Decide whether to show the general LaTeX result (for non-integral operations).
  const canShowGeneralLatex =
    !isIntegral && !error && typeof resultLatex === "string" && resultLatex.trim().length > 0;

  // Decide whether to show the raw/plain block (for non-integral operations only, and hide any latex labels).
  const canShowRaw =
    !isIntegral &&
    !error &&
    typeof raw === "string" &&
    raw.trim().length > 0 &&
    !/\blatex\*?\b/i.test(raw);

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

        {/* Integral: show ONLY the final value (formatted), hide LaTeX code and raw blocks */}
        {!error && isIntegral && integralDisplayValue && (
          <div
            className="display-6 animate__animated animate__pulse"
            aria-label="Integral result"
            style={{ fontSize: "1.35rem" }}
          >
            {/* Render the final value via MathJax (BlockMath) to present a clean mathematical form.
               If it's a plain number (e.g., "0.5"), KaTeX will render it as-is without exposing code. */}
            <BlockMath>{integralDisplayValue}</BlockMath>
          </div>
        )}

        {/* Non-integral: show the LaTeX-rendered full result as before */}
        {canShowGeneralLatex && (
          <div className="display-6 animate__animated animate__pulse" aria-label="Math result">
            <BlockMath>{stripLatexLabels(resultLatex)}</BlockMath>
          </div>
        )}

        {/* Non-integral: show a plain text snippet (but never if it contains 'latex' or 'latex*') */}
        {canShowRaw && (
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
            <code>{stripLatexLabels(raw)}</code>
          </pre>
        )}

        {/* Empty state */}
        {!error && !isIntegral && !canShowGeneralLatex && !canShowRaw && (
          <div
            className="alert alert-info"
            role="status"
            tabIndex={0}
            style={{ borderRadius: 10, marginTop: 8 }}
          >
            Ready! Please enter and submit your expression above to get a solution.
          </div>
        )}

        {/* For integrals: if there is no displayable value at all (edge case), show a friendly hint */}
        {!error && isIntegral && !integralDisplayValue && (
          <div
            className="alert alert-info"
            role="status"
            tabIndex={0}
            style={{ borderRadius: 10, marginTop: 8 }}
          >
            Enter bounds for a definite integral or use the Normal Integration panel for more options.
          </div>
        )}
      </div>

      <div className="card-footer small bg-light text-muted" style={{ borderRadius: "0 0 18px 18px" }}>
        <span aria-label="Math operation info" className="d-flex flex-wrap gap-3">
          <span>
            <strong>Input:</strong> {inputExpr || <em>(none)</em>}
          </span>
          <span>
            <strong>Operation:</strong> {operation ? operation.charAt(0).toUpperCase() + operation.slice(1) : "(unknown) "}
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
