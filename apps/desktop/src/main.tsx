import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@nuvokit/ui";
import "@nuvokit/ui/styles.css";
import { createAdapter } from "./platform";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App adapter={createAdapter()} />
  </StrictMode>,
);
