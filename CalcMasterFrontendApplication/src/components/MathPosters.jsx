import React from "react";
import PropTypes from "prop-types";
import "./MathPosters.css";

/**
 * A list of open-license math images from Wikimedia Commons to serve as posters.
 * Each item includes a title, image URL, and descriptive alt text.
 */
const POSTERS = [
  {
    title: "Integral: Area Under Curve",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Integral_as_region_under_curve.svg/512px-Integral_as_region_under_curve.svg.png",
    alt: "Integral symbol with the area under a curve shaded",
  },
  {
    title: "Derivative: Tangent Line",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Tangent_to_a_curve.svg/512px-Tangent_to_a_curve.svg.png",
    alt: "Tangent line touching a curve at a single point illustrating derivative",
  },
  {
    title: "Trigonometry: Unit Circle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Unit_circle_angles_color.svg/512px-Unit_circle_angles_color.svg.png",
    alt: "Unit circle with angles labeled around the circle",
  },
  {
    title: "Sine and Cosine Waves",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Sine_cosine_one_period.svg/512px-Sine_cosine_one_period.svg.png",
    alt: "Sine and cosine functions over one period on a coordinate axis",
  },
  {
    title: "Limits Concept",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/LimitDefinition.svg/512px-LimitDefinition.svg.png",
    alt: "Graph showing function approaching a limit value near a point",
  },
];

// PUBLIC_INTERFACE
/**
 * MathPosters: visually enriches the UI with math-related posters/collage elements.
 * Variant "banner" shows a prominent hero-like collage with brief text.
 * Variant "strip" shows a horizontally scrollable set of poster cards.
 *
 * Accessibility:
 * - All images include descriptive alt text.
 * - Regions have aria-labels so screen readers can identify their purpose.
 */
function MathPosters({ variant = "banner", className = "", ariaLabel, maxHeight }) {
  if (variant === "strip") {
    return (
      <section
        className={`math-poster-strip ${className}`}
        role="region"
        aria-label={ariaLabel || "Math concept posters"}
      >
        <div className="strip-scroll" tabIndex={0}>
          {POSTERS.map((p, idx) => (
            <article
              key={`${p.title}-${idx}`}
              className="poster-card"
              role="img"
              aria-label={`${p.title}: ${p.alt}`}
              title={p.title}
            >
              <div className="poster-card-media">
                <img src={p.url} alt={p.alt} loading="lazy" decoding="async" />
              </div>
              <div className="poster-card-body">
                <h3 className="poster-card-title">{p.title}</h3>
                <p className="poster-card-caption">
                  Visual reference for {p.title.toLowerCase()}.
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  // Default "banner" variant
  return (
    <section
      className={`math-poster-banner ${className}`}
      role="region"
      aria-label={ariaLabel || "Mathematics collage banner"}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <div className="banner-grid">
        <div className="banner-media" aria-hidden="true">
          {POSTERS.slice(0, 4).map((p, idx) => (
            <figure key={`${p.title}-${idx}`} className="banner-figure">
              <img src={p.url} alt={p.alt} loading="lazy" decoding="async" />
              <figcaption className="visually-hidden">{p.title}</figcaption>
            </figure>
          ))}
        </div>
        <div className="banner-text">
          <h2 className="banner-title">Explore Calculus, Trigonometry & Limits</h2>
          <p className="banner-subtitle">
            A visual companion to help you grasp core concepts quickly. All images are
            open-license resources from Wikimedia Commons.
          </p>
        </div>
      </div>
    </section>
  );
}

MathPosters.propTypes = {
  variant: PropTypes.oneOf(["banner", "strip"]),
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
  maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default MathPosters;
