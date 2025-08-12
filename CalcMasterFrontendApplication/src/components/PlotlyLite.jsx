import React from "react";
import createPlotlyComponent from "react-plotly.js/factory";

/**
 * Lightweight Plotly wrapper that code-splits the heavy Plotly bundle.
 * Dynamically loads plotly.js-basic-dist-min at runtime and renders a react-plotly component.
 * Shows a minimal placeholder while loading.
 */
// PUBLIC_INTERFACE
function PlotlyLite(props) {
  const [Comp, setComp] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    // Dynamically import the minimal Plotly bundle
    import("plotly.js-basic-dist-min")
      .then((mod) => {
        const Plotly = mod?.default || mod;
        const PlotComponent = createPlotlyComponent(Plotly);
        if (mounted) {
          // store component constructor
          setComp(() => PlotComponent);
        }
      })
      .catch((_err) => {
        // Optional: log or report error; fallback to no chart
        if (mounted) setComp(() => null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!Comp) {
    return (
      <div role="status" aria-label="Loading plot" className="text-muted small">
        Loading plot…
      </div>
    );
  }
  const C = Comp;
  return <C {...props} />;
}

export default PlotlyLite;
