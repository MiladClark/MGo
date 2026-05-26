import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FaviconSync } from "@/components/FaviconSync";
import "@/lib/i18n";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <FaviconSync />
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
