import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Capture l'événement natif d'installation PWA le plus tôt possible, même
// avant que la popup d'installation ne soit montée (voir InstallAppPopup.tsx).
import "./lib/pwaInstall";

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Non-fatal: app still works without offline support
    });
  });
}
