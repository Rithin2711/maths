import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import NormalIntegrationPanel from "./NormalIntegrationPanel";

// Helper to input values
async function computeIntegral({ lower, upper, expr }) {
  render(<NormalIntegrationPanel onBack={() => {}} />);
  // Fill inputs
  if (lower !== undefined) {
    fireEvent.change(screen.getByLabelText(/Lower Limit/i), {
      target: { value: lower },
    });
  }
  if (upper !== undefined) {
    fireEvent.change(screen.getByLabelText(/Upper Limit/i), {
      target: { value: upper },
    });
  }
  fireEvent.change(screen.getByLabelText(/Integrand expression/i), {
    target: { value: expr },
  });
  // Submit the form
  fireEvent.click(
    screen.getByRole("button", { name: /compute integral/i })
  );
}

describe("NormalIntegrationPanel", () => {
  it("computes indefinite integral correctly for x^2", async () => {
    await computeIntegral({ expr: "x^2" });
    await waitFor(() => {
      expect(screen.getByText(/x\^3[/]3/, { exact: false })).toBeInTheDocument();
    });
  });

  it("computes definite integral correctly for x^2 from 0 to 2", async () => {
    await computeIntegral({ lower: "0", upper: "2", expr: "x^2" });
    await waitFor(() => {
      expect(screen.getByText(/Definite integral/i)).toBeInTheDocument();
      // 2^3/3 - 0^3/3 = 8/3 - 0 = 8/3 ≈ 2.6666...
      // We look for "2.666" or "8/3" in result text
      expect(
        screen.getByText(/2\.666|8\/3/, { exact: false })
      ).toBeInTheDocument();
    });
  });

  it("computes definite integral for trig functions (sin(x), 0 to pi)", async () => {
    await computeIntegral({ lower: "0", upper: "pi", expr: "sin(x)" });
    await waitFor(() => {
      // The integral of sin(x) from 0 to pi is 2
      expect(screen.getByText(/definite integral/i)).toBeInTheDocument();
      expect(screen.getByText(/2[^\\d]|^2$/, { exact: false })).toBeInTheDocument();
    });
  });

  it("errors when one bound is missing", async () => {
    await computeIntegral({ lower: "", upper: "2", expr: "x" });
    await waitFor(() => {
      expect(screen.getByText(/provide both limits/i)).toBeInTheDocument();
    });
    await computeIntegral({ lower: "0", upper: "", expr: "x" });
    await waitFor(() => {
      expect(screen.getByText(/provide both limits/i)).toBeInTheDocument();
    });
  });

  it("displays error for invalid input", async () => {
    await computeIntegral({ expr: "BAD+!!" });
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it("+C is appended only to indefinite integrals", async () => {
    await computeIntegral({ expr: "x^2" });
    await waitFor(() => {
      expect(screen.queryByText(/\+ C/)).toBeInTheDocument();
    });

    await computeIntegral({ lower: "0", upper: "2", expr: "x^2" });
    await waitFor(() => {
      expect(screen.queryByText(/\+ C/)).not.toBeInTheDocument();
    });
  });
});
