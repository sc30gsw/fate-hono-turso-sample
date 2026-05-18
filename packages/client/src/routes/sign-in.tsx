import { createRoute, Link, stripSearchParams } from "@tanstack/react-router";
import { valibotValidator } from "@tanstack/valibot-adapter";

import { SignInForm } from "~/features/auth/components/sign-in-form";
import {
  authSearchSchema,
  defaultAuthSearchParams,
} from "~/features/auth/schemas/search-params/auth-serarch-schema";
import { Route as RootRoute } from "~/routes/root";

function SignInPage() {
  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <SignInForm />
      <p className="text-sm text-neutral-600">
        No account yet?{" "}
        <Link className="underline" to="/auth/sign-up">
          Sign up
        </Link>
      </p>
    </section>
  );
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/auth/sign-in",
  component: SignInPage,
  validateSearch: valibotValidator(authSearchSchema),
  search: {
    middlewares: [stripSearchParams(defaultAuthSearchParams)],
  },
});
