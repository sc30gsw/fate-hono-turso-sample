import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "~/styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <main className="p-6 font-sans">
      <h1 className="text-2xl font-bold text-red-500">Hello fate</h1>
      <p>Phase 1 smoke test. Phase 2 will replace this with the real app.</p>
    </main>
  </StrictMode>,
);
