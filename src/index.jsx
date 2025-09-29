import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { loadAppConfig } from "./config/runtimeConfig";

// Load runtime config before mounting the app
loadAppConfig().finally(() => {
  createRoot(document.getElementById("app")).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
