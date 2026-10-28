// Only the published GitHub Pages site sends Google Analytics events.
// Keep the initializer in a first-party module so CSP needs no inline-script exception.
const MEASUREMENT_ID = "G-9ZPQXVFKN7";

if (
  window.location.hostname === "h4m4chi-ttr.github.io" &&
  window.location.pathname.startsWith("/army-knife/")
) {
  const analyticsWindow = window as Window & { dataLayer?: unknown[] };
  const dataLayer = (analyticsWindow.dataLayer ||= []);

  // gtag.js consumes the Arguments object used by Google's official snippet,
  // not the plain Array produced by a rest parameter.
  function gtag(..._args: unknown[]): void {
    dataLayer.push(arguments);
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID);
}

// Explicit module boundary for the TypeScript module-based bootstrap tests.
export {};
