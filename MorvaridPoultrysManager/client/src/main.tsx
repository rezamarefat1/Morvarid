import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./hooks/use-theme";
import "./index.css";

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="system" storageKey="morvarid-theme">
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error('Root element with id "root" not found');
}