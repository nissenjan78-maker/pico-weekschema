import React from "react";
import ReactDOM from "react-dom/client";

import './index.css';
import './styles.css';

// Auth context (PIN + family)
import { AuthProvider } from "./lib/AuthProvider";

// Jouw hoofd-app (bijv. WeekschemaApp)
import WeekschemaApp from "./WeekschemaApp.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <WeekschemaApp />
    </AuthProvider>
  </React.StrictMode>
);
