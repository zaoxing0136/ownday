import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const hasRecoveredFromAssetError =
  typeof window !== "undefined" && window.sessionStorage.getItem("omd_asset_recovered") === "1";

if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();

    if (!hasRecoveredFromAssetError) {
      window.sessionStorage.setItem("omd_asset_recovered", "1");
      window.location.reload();
    }
  });

  window.addEventListener("error", (event) => {
    const message = event.message || "";
    const looksLikeAssetError =
      message.includes("Loading chunk") ||
      message.includes("Failed to fetch dynamically imported module");

    if (looksLikeAssetError && !hasRecoveredFromAssetError) {
      window.sessionStorage.setItem("omd_asset_recovered", "1");
      window.location.reload();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason =
      typeof event.reason === "string"
        ? event.reason
        : event.reason instanceof Error
          ? event.reason.message
          : "";

    if (reason.includes("Failed to fetch dynamically imported module") && !hasRecoveredFromAssetError) {
      window.sessionStorage.setItem("omd_asset_recovered", "1");
      window.location.reload();
    }
  });

  if (hasRecoveredFromAssetError) {
    window.sessionStorage.removeItem("omd_asset_recovered");
  }
}

createRoot(document.getElementById("root")!).render(<App />);
