// Light/dark only: drop system preference as a persisted mode.
(function () {
  const stored = localStorage.getItem("theme");
  if (stored !== "dark" && stored !== "light") {
    localStorage.setItem("theme", window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  toggleThemeSetting = function () {
    setThemeSetting(determineThemeSetting() === "dark" ? "light" : "dark");
  };
})();
