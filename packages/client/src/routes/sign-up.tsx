import { createRoute, Link, stripSearchParams } from "@tanstack/react-router";
import { valibotValidator } from "@tanstack/valibot-adapter";

import { SignUpForm } from "~/features/auth/components/sign-up-form";
import {
  authSearchSchema,
  defaultAuthSearchParams,
} from "~/features/auth/schemas/search-params/auth-serarch-schema";
import { Route as RootRoute } from "~/routes/root";

function SignUpPage() {
  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Create account</h1>
      <SignUpForm />
      <p className="text-sm text-neutral-600">
        Already have an account?{" "}
        <Link className="underline" to="/auth/sign-in">
          Sign in
        </Link>
      </p>
    </section>
  );
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/auth/sign-up",
  component: SignUpPage,
  validateSearch: valibotValidator(authSearchSchema),
  search: {
    middlewares: [stripSearchParams(defaultAuthSearchParams)],
  },
});
