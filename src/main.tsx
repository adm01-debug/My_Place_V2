import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { errorTracker } from "./lib/monitoring";

// Initialize error tracking globally
errorTracker.init(window.location.origin);

createRoot(document.getElementById("root")!).render(<App />);
