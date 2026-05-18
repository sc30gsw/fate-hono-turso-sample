import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { NavBar } from "~/components/nav-bar";

function RootLayout() {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      <NavBar />
      <main className="mx-auto max-w-3xl p-6">
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          )}
        >
          <Suspense fallback={<p className="text-neutral-500">Loading…</p>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
