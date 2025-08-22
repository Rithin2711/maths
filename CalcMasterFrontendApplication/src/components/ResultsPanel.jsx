import React from "react";
import PropTypes from "prop-types";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

/**
 * PUBLIC_INTERFACE
 * ResultsPanel renders calculation results cleanly using KaTeX. It ensures:
 * - No raw 'latex' or 'latex*' tokens/labels are shown
 * - Numeric roots are detected, rounded to 3 decimal points, and highlighted
 * - Symbolic expressions are preserved without modification
 *
 * PUBLIC_INTERFACE
 * Props:
 * @param {boolean} isValid - Whether the input expression is valid
 * @param {string} error - Error message if any
 * @param {string} resultLatex - Formatted LaTeX result string
 * @param {string} raw - Plain text result
 * @param {string} inputExpr - Original input expression
 * @param {string} operation - Operation type (e.g., 'integral', 'limit', etc.)
 */
// PUBLIC_INTERFACE
function ResultsPanel({ isValid, error, resultLatex, raw, inputExpr, operation }) {
  if (!isValid && !error) return null;

  // Strip any literal occurrences of 'latex' or 'latex*' to avoid helper labels showing
  const stripLatexLabels = (s) => (s || "").replace(/\blatex\*?\b/gi, "").trim();

  // Helper: detect and process numeric values, returning { isNumeric, value, formatted }
  const processNumeric = (s) => {
    if (s == null) return { isNumeric: false, value: "", formatted: "" };
    const trimmed = String(s).trim();
    
    // Allow forms like "≈ 1.2345", "= 1.2345", or plain "1.2345"
    const eqMatch = trimmed.match(/(?:=|\u2248)?\\s*([+\-]?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/);
    
    if (eqMatch && eqMatch[1] != null) {
      const n = Number(eqMatch[1]);
      if (!Number.isNaN(n) && Number.isFinite(n)) {
        const rounded = Number(n.toFixed(3));
        // Replace only the matched numeric portion with the rounded value (preserve prefix if any)
        const formatted = trimmed.replace(eqMatch[1], String(rounded));
        return {
          isNumeric: true,
          value: rounded,
          formatted: formatted,
        };
      }
    }
    return { isNumeric: false, value: trimmed, formatted: trimmed };
  };

  const isIntegral = (operation || "").toLowerCase() === "integral";

  // Determine display strings with tokens stripped
  const cleanedLatex = stripLatexLabels(resultLatex);
  const cleanedRaw = stripLatexLabels(raw);

  // For integrals, show only the final evaluated part (RHS after '=' if present)
  let integralResult = { isNumeric: false, value: "", formatted: "" };
  if (!error && isIntegral) {
    let integralValue = "";
    if (typeof cleanedLatex === "string" && cleanedLatex.length > 0) {
      const eqMatch = cleanedLatex.match(/=(.*)$/s);
      if (eqMatch && eqMatch[1]) {
        integralValue = eqMatch[1].trim();
      }
    }
    if (!integralValue && typeof cleanedRaw === "string") {
      integralValue = cleanedRaw;
    }
    integralResult = processNumeric(integralValue);
  }

  // Non-integral display checks
  const canShowGeneralLatex =
    !isIntegral && !error && typeof cleanedLatex === "string" && cleanedLatex.trim().length > 0;

  const canShowRaw =
    !isIntegral && !error && typeof cleanedRaw === "string" && cleanedRaw.trim().length > 0;

  // Process general latex and raw results
  const processedLatex = canShowGeneralLatex ? processNumeric(cleanedLatex) : { isNumeric: false, formatted: "" };
  const processedRaw = canShowRaw ? processNumeric(cleanedRaw) : { isNumeric: false, formatted: "" };

  // Styles for numeric highlighting
  const numericHighlightStyle = {
    color: "#2563eb", // Blue shade
    fontWeight: "500",
  };

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

        {/* Integral: render only the final value (KaTeX) */}
        {!error && isIntegral && integralResult.formatted && (
          <div
            className="display-6 animate__animated animate__pulse"
            aria-label="Integral result"
            style={{
              fontSize: "1.35rem",
              ...(integralResult.isNumeric ? numericHighlightStyle : {}),
            }}
          >
            <BlockMath>{integralResult.formatted}</BlockMath>
          </div>
        )}

        {/* Non-integral: render LaTeX result (with tokens stripped and numeric highlighted) */}
        {canShowGeneralLatex && (
          <div 
            className="display-6 animate__animated animate__pulse" 
            aria-label="Math result"
            style={processedLatex.isNumeric ? numericHighlightStyle : {}}
          >
            <BlockMath>{processedLatex.formatted}</BlockMath>
          </div>
        )}

        {/* Non-integral: accessible plain text snippet */}
        {canShowRaw && (
          <pre
            className="small mt-3 p-2"
            tabIndex={0}
            aria-label="Plain result"
            style={{
              border: "1px dashed #b7d7ee",
              background: "#f0f6ff",
              borderRadius: 9,
              ...(processedRaw.isNumeric ? numericHighlightStyle : {}),
            }}
          >
            <code>{processedRaw.formatted}</code>
          </pre>
        )}

        {/* Empty state for non-integrals */}
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

        {/* Edge case for integrals with nothing to display */}
        {!error && isIntegral && !integralResult.formatted && (
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
            <strong>Operation:</strong>{" "}
            {operation ? operation.charAt(0).toUpperCase() + operation.slice(1) : "(unknown) "}
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
