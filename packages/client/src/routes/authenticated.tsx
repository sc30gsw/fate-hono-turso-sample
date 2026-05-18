import { createRoute, Outlet, redirect } from "@tanstack/react-router";

import { authClient } from "~/lib/auth-client";
import { Route as RootRoute } from "~/routes/root";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  id: "_authenticated",
  beforeLoad: async ({ location }) => {
    const { data } = await authClient.getSession();

    if (!data?.session) {
      throw redirect({
        to: "/auth/sign-in",
        search: { redirect: location.href },
      });
    }
  },
  component: () => <Outlet />,
});
