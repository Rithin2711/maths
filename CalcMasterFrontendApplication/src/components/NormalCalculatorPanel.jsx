import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './ButtonStyles.css';

// PUBLIC_INTERFACE
/**
 * Normal Calculator Panel component providing basic arithmetic operations
 * @param {function} onBack - Callback function to return to the previous screen
 */
const NormalCalculatorPanel = ({ onBack }) => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = (num) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (newNumber) {
      setDisplay('0.');
      setNewNumber(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperation = (op) => {
    if (operation && !newNumber) {
      handleEquals();
    }
    setPrevValue(parseFloat(display));
    setOperation(op);
    setNewNumber(true);
  };

  const handleEquals = () => {
    if (operation && prevValue !== null) {
      const current = parseFloat(display);
      let result;

      switch (operation) {
        case '+':
          result = prevValue + current;
          break;
        case '-':
          result = prevValue - current;
          break;
        case '*':
          result = prevValue * current;
          break;
        case '/':
          if (current === 0) {
            setDisplay('Error');
            setPrevValue(null);
            setOperation(null);
            setNewNumber(true);
            return;
          }
          result = prevValue / current;
          break;
        default:
          return;
      }

      setDisplay(result.toString());
      setPrevValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Normal Calculator</h2>
            <button
              onClick={onBack}
              className="btn btn-outline-secondary"
              aria-label="Go back"
            >
              ← Back
            </button>
          </div>

          <div className="calculator-container bg-white p-4 rounded-3 shadow-sm">
            <div 
              className="calc-display bg-light border rounded p-3 mb-4 text-end"
              style={{
                fontSize: '2rem',
                fontFamily: 'monospace',
                minHeight: '60px'
              }}
              role="textbox"
              aria-label="Calculator display"
            >
              {display}
            </div>

            <div className="calc-buttons">
              <div className="row g-2">
                {/* Numbers */}
                {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0].map((num) => (
                  <div key={num} className="col-4">
                    <button
                      onClick={() => handleNumber(num.toString())}
                      className="btn btn-light w-100 py-3 fs-5 shadow-sm"
                    >
                      {num}
                    </button>
                  </div>
                ))}
                <div className="col-4">
                  <button
                    onClick={handleDecimal}
                    className="btn btn-light w-100 py-3 fs-5 shadow-sm"
                  >
                    .
                  </button>
                </div>

                {/* Operations */}
                <div className="col-12">
                  <div className="row g-2">
                    {['+', '-', '*', '/'].map((op) => (
                      <div key={op} className="col-3">
                        <button
                          onClick={() => handleOperation(op)}
                          className="btn btn-primary w-100 py-3 fs-5"
                        >
                          {op}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear and Equals */}
                <div className="col-6">
                  <button
                    onClick={handleClear}
                    className="btn btn-danger w-100 py-3 fs-5"
                  >
                    C
                  </button>
                </div>
                <div className="col-6">
                  <button
                    onClick={handleEquals}
                    className="btn btn-success w-100 py-3 fs-5"
                  >
                    =
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

NormalCalculatorPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default NormalCalculatorPanel;
