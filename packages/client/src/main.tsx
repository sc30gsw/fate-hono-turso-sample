import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FateClient } from "react-fate";

import { fateClient } from "~/lib/fate-client";
import { router } from "~/router";

import "~/styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <FateClient client={fateClient}>
      <RouterProvider router={router} />
    </FateClient>
  </StrictMode>,
);
