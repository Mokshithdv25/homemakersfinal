import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { initNativeShell } from "@/lib/capacitorPlatform";

const root = ReactDOM.createRoot(document.getElementById("root"));

initNativeShell().finally(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
