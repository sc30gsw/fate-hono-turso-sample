import { useForm } from "@tanstack/react-form";
import { getRouteApi } from "@tanstack/react-router";

import { defaultSignInValues, signInSchema } from "~/features/auth/schemas/sign-in-schema";
import { signIn } from "~/lib/auth-client";

const routeApi = getRouteApi("/auth/sign-in");

export function SignInForm() {
  const navigate = routeApi.useNavigate();
  const search = routeApi.useSearch();

  const form = useForm({
    defaultValues: defaultSignInValues,
    validators: {
      onChange: signInSchema,
      onSubmitAsync: async ({ value }) => {
        const result = await signIn.email(value);

        if (result.error) {
          return { form: result.error.message ?? "Sign-in failed.", fields: {} };
        }

        return null;
      },
    },
    onSubmit: async () => {
      await navigate({ to: search.redirect ?? "/" });
    },
  });

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="email">
        {(field) => (
          <label className="block">
            <span className="block text-sm font-medium text-neutral-700">Email</span>
            <input
              autoComplete="email"
              className="mt-1 w-full rounded border border-neutral-300 p-2"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              required
              type="email"
              value={field.state.value}
            />
            {field.state.meta.isTouched && field.state.meta.errors[0] ? (
              <p className="mt-1 text-sm text-red-700">
                {String(field.state.meta.errors[0]?.message ?? field.state.meta.errors[0])}
              </p>
            ) : null}
          </label>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <label className="block">
            <span className="block text-sm font-medium text-neutral-700">Password</span>
            <input
              autoComplete="current-password"
              className="mt-1 w-full rounded border border-neutral-300 p-2"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              required
              type="password"
              value={field.state.value}
            />
            {field.state.meta.isTouched && field.state.meta.errors[0] ? (
              <p className="mt-1 text-sm text-red-700">
                {String(field.state.meta.errors[0]?.message ?? field.state.meta.errors[0])}
              </p>
            ) : null}
          </label>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.errorMap.onSubmit ?? null}>
        {(formError) => (formError ? <p className="text-sm text-red-700">{formError}</p> : null)}
      </form.Subscribe>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <button
            className="w-full rounded bg-neutral-900 px-3 py-2 text-white hover:bg-neutral-700 disabled:opacity-50"
            disabled={!canSubmit || isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
