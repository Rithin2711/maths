import React from 'react';

/**
 * PUBLIC_INTERFACE
 * CollageBackground
 * A non-intrusive, responsive collage-style background for the app using layered SVGs and gradients.
 * It stays fixed, behind the main content, and adapts across breakpoints while preserving readability.
 */
export default function CollageBackground() {
  /**
   * We preserve the collage everywhere except a horizontal safe strip
   * around the main action button area to avoid visual interference.
   * The safe strip is implemented with two overlay masks (top and bottom)
   * that cover about 18vh above and 18vh below the vertical center.
   * This keeps the region around primary buttons clean while the rest
   * of the page retains its decorative background.
   */
  return (
    <div aria-hidden="true" className="collage-background">
      {/* Layer 1: subtle gradient */}
      <div className="collage-layer gradient" />

      {/* Layer 2: abstract math shapes (SVG) */}
      <svg
        className="collage-layer shapes"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Light pattern circles */}
        <g fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2">
          <circle cx="120" cy="140" r="60" />
          <circle cx="360" cy="240" r="36" />
          <circle cx="1000" cy="120" r="42" />
          <circle cx="1280" cy="220" r="28" />
          <circle cx="840" cy="380" r="54" />
          <circle cx="200" cy="520" r="46" />
          <circle cx="1140" cy="600" r="62" />
          <circle cx="660" cy="700" r="30" />
        </g>

        {/* Math symbols */}
        <g fill="rgba(255,255,255,0.12)">
          <text x="160" y="120" fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" fontSize="48">∑</text>
          <text x="400" y="320" fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" fontSize="38">∫</text>
          <text x="980" y="180" fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" fontSize="44">π</text>
          <text x="1240" y="280" fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" fontSize="36">∞</text>
          <text x="820" y="440" fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" fontSize="42">Δ</text>
          <text x="180" y="580" fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" fontSize="40">√</text>
          <text x="1110" y="660" fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" fontSize="48">θ</text>
          <text x="640" y="750" fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" fontSize="34">≅</text>
        </g>

        {/* Equations (semi-transparent) */}
        <g fill="rgba(255,255,255,0.12)">
          <text x="240" y="200" fontSize="18" fontFamily="monospace">e^(iπ)+1=0</text>
          <text x="980" y="260" fontSize="16" fontFamily="monospace">a^2+b^2=c^2</text>
          <text x="720" y="520" fontSize="16" fontFamily="monospace">lim x→0: sin(x)/x = 1</text>
          <text x="320" y="680" fontSize="16" fontFamily="monospace">∫ x^n dx = x^(n+1)/(n+1)+C</text>
        </g>

        {/* Soft blobs */}
        <g>
          <defs>
            <radialGradient id="blobBlue" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(66,153,225,0.25)" />
              <stop offset="100%" stopColor="rgba(66,153,225,0)" />
            </radialGradient>
            <radialGradient id="blobPurple" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(128,90,213,0.22)" />
              <stop offset="100%" stopColor="rgba(128,90,213,0)" />
            </radialGradient>
            <radialGradient id="blobGreen" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(72,187,120,0.22)" />
              <stop offset="100%" stopColor="rgba(72,187,120,0)" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="140" r="180" fill="url(#blobBlue)" />
          <circle cx="1180" cy="300" r="220" fill="url(#blobPurple)" />
          <circle cx="760" cy="740" r="240" fill="url(#blobGreen)" />
        </g>
      </svg>

      {/* Layer 3: subtle noise texture via CSS variable (uses filter for performance-friendly effect) */}
      <div className="collage-layer noise" />

      {/* Layer 4: SAFE STRIPS — mask the collage around primary button rows */}
      <div className="collage-safe-strip collage-safe-strip--top" />
      <div className="collage-safe-strip collage-safe-strip--bottom" />
    </div>
  );
}
