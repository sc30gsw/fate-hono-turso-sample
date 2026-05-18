import { createRouter } from "@tanstack/react-router";

import { Route as HomeRoute } from "~/routes/home";
import { Route as LiveRoute } from "~/routes/live";
import { Route as RootRoute } from "~/routes/root";
import { Route as SignInRoute } from "~/routes/sign-in";
import { Route as SignUpRoute } from "~/routes/sign-up";

const routeTree = RootRoute.addChildren([HomeRoute, LiveRoute, SignInRoute, SignUpRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
