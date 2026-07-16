import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
// Bundled at build time — no runtime CDN dependency for the map styles.
import "leaflet/dist/leaflet.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
