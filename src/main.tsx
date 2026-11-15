import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "./index.css";
import App from "./App";
import { captureOmadaParams } from "./lib/omada";

// The Omada controller puts device details in the address. Keep them before the router changes the address.
captureOmadaParams();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
