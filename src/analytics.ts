// Only the published GitHub Pages site sends Google Analytics events.
// Keep the initializer in a first-party module so CSP needs no inline-script exception.
const MEASUREMENT_ID = "G-9ZPQXVFKN7";

if (
  window.location.hostname === "h4m4chi-ttr.github.io" &&
  window.location.pathname.startsWith("/army-knife/")
) {
  const analyticsWindow = window as Window & { dataLayer?: unknown[][] };
  const dataLayer = (analyticsWindow.dataLayer ||= []);

  function gtag(...args: unknown[]): void {
    dataLayer.push(args);
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID);
}
