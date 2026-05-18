import { createRouter } from "@tanstack/react-router";

import { Route as AuthenticatedRoute } from "~/routes/authenticated";
import { Route as HomeRoute } from "~/routes/home";
import { Route as LiveRoute } from "~/routes/live";
import { Route as NewPostRoute } from "~/routes/new";
import { Route as PostDetailRoute } from "~/routes/posts.$id";
import { Route as LivePostDetailRoute } from "~/routes/posts.$id.live";
import { Route as RootRoute } from "~/routes/root";
import { Route as SignInRoute } from "~/routes/sign-in";
import { Route as SignUpRoute } from "~/routes/sign-up";

const routeTree = RootRoute.addChildren([
  AuthenticatedRoute.addChildren([
    HomeRoute,
    LiveRoute,
    NewPostRoute,
    PostDetailRoute,
    LivePostDetailRoute,
  ]),
  SignInRoute,
  SignUpRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
