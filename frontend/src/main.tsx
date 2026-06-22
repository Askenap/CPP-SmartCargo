import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import { MLRouteSheetScreen } from "./screens/ml/MLRouteSheetScreen";
import { UvedCreateWizard } from "./screens/uved/UvedCreateWizard";
import { UvedRouteSheetScreen } from "./screens/uved/UvedRouteSheetScreen";
import { UvedDemoScreen } from "./screens/uved/UvedDemoScreen";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/ml/_demo" element={<MLRouteSheetScreen demo />} />
        <Route path="/ml/:code" element={<MLRouteSheetScreen />} />
        <Route path="/uved/new" element={<UvedCreateWizard />} />
        <Route path="/uved/by-code/:code" element={<UvedRouteSheetScreen />} />
        <Route path="/uved/_demo" element={<UvedDemoScreen />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
