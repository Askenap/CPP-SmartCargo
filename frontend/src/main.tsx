import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import { MLRouteSheetScreen } from "./screens/ml/MLRouteSheetScreen";
import { UvedCreateWizard } from "./screens/uved/UvedCreateWizard";
import { UvedRouteSheetScreen } from "./screens/uved/UvedRouteSheetScreen";
import { UvedMyRouteSheetsScreen } from "./screens/uved/UvedMyRouteSheetsScreen";
import { UvedDemoScreen } from "./screens/uved/UvedDemoScreen";
import "./index.css";

function MobileShell({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 420, margin: "0 auto" }}>{children}</div>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/ml/_demo" element={<MobileShell><MLRouteSheetScreen demo /></MobileShell>} />
        <Route path="/ml/:code" element={<MobileShell><MLRouteSheetScreen /></MobileShell>} />
        <Route path="/uved/new" element={<MobileShell><UvedCreateWizard /></MobileShell>} />
        <Route path="/uved/my" element={<MobileShell><UvedMyRouteSheetsScreen /></MobileShell>} />
        <Route path="/uved/by-code/:code" element={<MobileShell><UvedRouteSheetScreen /></MobileShell>} />
        <Route path="/uved/_demo" element={<MobileShell><UvedDemoScreen /></MobileShell>} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
