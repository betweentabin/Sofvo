import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
// Ensure CSS variables (:root --, --2, --3, --4) are bundled in production
import "../styleguide.css";
import { loadAppConfig } from "./config/runtimeConfig";

// Load runtime config before mounting the app
loadAppConfig().finally(() => {
  createRoot(document.getElementById("app")).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
