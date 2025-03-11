// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";  // <-- Use HashRouter
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <HashRouter>
    <App />
  </HashRouter>
);
