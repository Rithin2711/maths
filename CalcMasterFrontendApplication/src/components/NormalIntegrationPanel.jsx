import React, { useState, useRef } from "react";
import PropTypes from "prop-types";

/**
 * PUBLIC_INTERFACE
 * Panel for performing Normal (Definite) Integration.
 * Allows input of lower and upper bounds and the integrand expression,
 * with quick-entry math symbol buttons for common functions and constants.
 * 
 * @param {function} onBack - Callback to return to Integral Options page.
 */
function NormalIntegrationPanel({ onBack }) {
  const [lower, setLower] = useState("");
  const [upper, setUpper] = useState("");
  const [expr, setExpr] = useState("");
  const inputRef = useRef();

  // List of symbols for quick-entry
  const QUICK_SYMBOLS = [
    { label: "sin", insert: "sin()", tip: "Insert sine" },
    { label: "cos", insert: "cos()", tip: "Insert cosine" },
    { label: "tan", insert: "tan()", tip: "Insert tangent" },
    { label: "π", insert: "pi", tip: "Insert pi" },
    { label: "e", insert: "e", tip: "Insert Euler's number" },
    { label: "√", insert: "sqrt()", tip: "Insert square root" },
    { label: "∫", insert: "∫ ", tip: "Integral symbol" },
    { label: "^", insert: "^", tip: "Insert exponent" },
  ];

  // Insert symbol at cursor position or append
  const handleSymbolClick = (sym) => {
    if (inputRef.current) {
      const el = inputRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const before = expr.substring(0, start);
      const after = expr.substring(end);
      let insertValue = sym;

      // If function with parentheses, put cursor inside
      let newCursorPos = start + sym.length;
      if (sym.endsWith("()")) {
        insertValue = sym;
        newCursorPos = start + sym.indexOf("(") + 1;
      }

      const newVal = before + insertValue + after;
      setExpr(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setExpr(expr + sym);
    }
  };

  // Guidance text for users
  const infoText = (
    <div className="mt-2 small text-muted" style={{ fontSize: 14 }}>
      <span>
        Enter the lower and upper limits for the definite integral.<br />
        Expression example: <code>sin(x) + e^x</code> &nbsp; &bull; &nbsp;<code>cos(pi*x)</code>
        <br />
        Use the quick-entry buttons for common symbols/functions.
      </span>
    </div>
  );

  return (
    <main className="container py-5" style={{ maxWidth: 540 }}>
      <h2 className="fw-bold text-primary mb-4" tabIndex={0}>
        ∫ Normal Integration
      </h2>
      <form autoComplete="off">
        <div className="mb-3">
          <label htmlFor="lower-limit" className="form-label fw-semibold">
            Lower Limit
          </label>
          <input
            id="lower-limit"
            className="form-control"
            type="text"
            value={lower}
            onChange={e => setLower(e.target.value)}
            placeholder="e.g. 0"
            inputMode="decimal"
            style={{ borderRadius: 10 }}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="upper-limit" className="form-label fw-semibold">
            Upper Limit
          </label>
          <input
            id="upper-limit"
            className="form-control"
            type="text"
            value={upper}
            onChange={e => setUpper(e.target.value)}
            placeholder="e.g. pi"
            inputMode="decimal"
            style={{ borderRadius: 10 }}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="integrand" className="form-label fw-semibold">
            Integrand Expression
          </label>
          <div className="d-flex flex-wrap gap-2 mb-1">
            {QUICK_SYMBOLS.map(symbol =>
              <button
                type="button"
                key={symbol.label}
                className="btn btn-sm btn-outline-secondary"
                style={{ fontWeight: 650, fontSize: 15, borderRadius: 8 }}
                title={symbol.tip}
                tabIndex={0}
                onClick={() => handleSymbolClick(symbol.insert)}
                aria-label={symbol.tip}
              >
                {symbol.label}
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            id="integrand"
            className="form-control"
            type="text"
            value={expr}
            onChange={e => setExpr(e.target.value)}
            autoComplete="off"
            placeholder="Enter integrand, e.g. sin(x) + x^2"
            style={{
              borderRadius: 10,
              fontFamily: "'JetBrains Mono', 'Menlo', 'Consolas', monospace",
              fontSize: "1.1rem",
            }}
            aria-label="Integrand expression"
            spellCheck={false}
          />
        </div>
        {infoText}
        <div className="mt-4 d-flex justify-content-between">
          <button
            type="button"
            className="btn btn-outline-secondary"
            style={{ borderRadius: 10, fontWeight: 500 }}
            onClick={onBack}
            aria-label="Go Back"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ borderRadius: 10, fontWeight: 600 }}
            disabled={!(lower.trim() && upper.trim() && expr.trim())}
            tabIndex={0}
            aria-label="Integrate"
          >
            Compute Integral
          </button>
        </div>
      </form>
    </main>
  );
}

NormalIntegrationPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default NormalIntegrationPanel;
