import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import { MLRouteSheetScreen } from "./screens/ml/MLRouteSheetScreen";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/ml/_demo" element={<MLRouteSheetScreen demo />} />
        <Route path="/ml/:code" element={<MLRouteSheetScreen />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
