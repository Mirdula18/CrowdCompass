import React from "react";
import ReactDOM from "react-dom/client";
// Bundled at build time — no runtime CDN dependency for the map styles.
import "leaflet/dist/leaflet.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
