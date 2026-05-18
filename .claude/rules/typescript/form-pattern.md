# Form Pattern (TanStack Form + valibot)

## Stack

| Concern | Tool |
|---|---|
| Field state, validation orchestration, accessibility wiring | `@tanstack/react-form` (`useForm`, `form.Field`, `form.Subscribe`) |
| Submitting / canSubmit flags | `form.state.isSubmitting` + `form.state.canSubmit` (built-in) |
| Submit-time errors (network / 401 / 500 / 409 / etc.) | `form.state.errorMap.onSubmit` via `formApi.setErrorMap` |
| Field-level validation errors | `field.state.meta.errors` (populated by validators) |
| Schema validation (synchronous, client + server) | `valibot` 1.x — Standard Schema compatible, **no adapter needed** |
| Schema placement | `features/<feature>/schemas/<name>-schema.ts` |

**TanStack Form owns the entire form lifecycle.** Do NOT introduce `useState`, `useReducer`, `useTransition`, `useFormStatus`, or `useMutation` to track submitting / pending / server-error state. They duplicate machinery that already exists in `form.state` and they desync from the form's own view of the world.

## Schema file shape

```ts
// features/auth/schemas/sign-in-schema.ts
import * as v from "valibot";

export const SignInSchema = v.object({
  email: v.pipe(v.string(), v.email("Enter a valid email address.")),
  password: v.pipe(v.string(), v.minLength(8, "Password must be at least 8 characters.")),
});

export type SignInInput = v.InferOutput<typeof SignInSchema>;
export const defaultSignInValues: SignInInput = { email: "", password: "" };
```

Export three things per schema file:
- The schema (`<Name>Schema`).
- `<Name>Input` derived via `v.InferOutput`.
- `default<Name>Values` so the route never has to spell out blank defaults inline.

## Form component shape

```tsx
import { useForm } from "@tanstack/react-form";

import { defaultSignInValues, SignInSchema } from "~/features/auth/schemas/sign-in-schema";
import { signIn } from "~/lib/auth-client";

export function SignInPage() {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: defaultSignInValues,
    //? valibot 1.x implements Standard Schema, so TanStack Form accepts the schema
    //? directly. Do not install `@tanstack/valibot-adapter`.
    validators: { onChange: SignInSchema },
    //? Async onSubmit is awaited; `state.isSubmitting` is true for the whole flow
    //? (call + navigation). Server failures go into `errorMap.onSubmit` via
    //? `formApi.setErrorMap`. No useState, useTransition, useFormStatus needed.
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });        // clear stale
      const result = await signIn.email(value);
      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? "Sign-in failed.",
            // Optional: route a server-side validation error to a specific field.
            // fields: { email: "Email is already taken." }
          },
        });
        return;
      }
      await navigate({ to: "/" });
    },
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="email">
        {(field) => (
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              type="email"
              value={field.state.value}
            />
            {field.state.meta.isTouched && field.state.meta.errors[0] ? (
              <p>{String(field.state.meta.errors[0]?.message ?? field.state.meta.errors[0])}</p>
            ) : null}
          </label>
        )}
      </form.Field>

      {/* Submit-time / server errors live in form state, not local useState. */}
      <form.Subscribe
        selector={(state) => (state.errorMap.onSubmit as { form?: string } | undefined)?.form ?? null}
      >
        {(formError) => (formError ? <p>{formError}</p> : null)}
      </form.Subscribe>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <button disabled={!canSubmit || isSubmitting} type="submit">
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
```

## Where form state lives

`form.state` covers everything you'd otherwise reach for `useState` to track:

| Need | Read from |
|---|---|
| "Is the form currently submitting?" | `state.isSubmitting` |
| "Can the form submit right now?" (valid + not submitting) | `state.canSubmit` |
| "Has the form ever been submitted?" | `state.isSubmitted` |
| "Did the last submit succeed?" | `state.isSubmitSuccessful` |
| Field validation errors | `field.state.meta.errors` |
| Form-level submit / server errors | `state.errorMap.onSubmit` (and `.fields` for per-field server errors) |
| Async validator errors | `state.errorMap.onSubmitAsync` |

Read these via `form.Subscribe` with a `selector` so only the consuming subtree re-renders.

## Server / API error handling

The canonical way to surface a failed API call (sign-in failed, email taken, etc.) is:

```ts
onSubmit: async ({ value, formApi }) => {
  formApi.setErrorMap({ onSubmit: undefined });   // clear stale errors on retry
  const result = await api.call(value);
  if (result.error) {
    formApi.setErrorMap({
      onSubmit: {
        form: result.error.message,                // form-level banner
        fields: { email: "Already taken." },        // route to a specific field
      },
    });
    return;
  }
  // success
},
```

The `form.Subscribe` selectors above pick the slice they need. Field components automatically surface their `fields[name]` value alongside validator errors (`field.state.meta.errors`).

When you need **async validation** (e.g., "is this username available?") that runs as part of submit, use `validators.onSubmitAsync` instead — see the [TanStack Form validation guide](https://tanstack.com/form/latest/docs/framework/react/guides/validation). It returns the same `{ form, fields }` shape and populates `errorMap.onSubmitAsync`.

## Rules

### DO

- **Use `form.state.isSubmitting`** to drive the submit button's disabled / label state via `form.Subscribe`.
- **Use `formApi.setErrorMap({ onSubmit: {...} })` inside `onSubmit`** to publish API failures into form state.
- **Clear stale submit errors at the top of `onSubmit`** (`setErrorMap({ onSubmit: undefined })`) so retry attempts start clean.
- **Use `form.Subscribe` with `selector`** for derived state like `canSubmit`, `isSubmitting`, or individual `errorMap` slots. It avoids re-rendering the whole form on every keystroke.
- **Render field errors only after `meta.isTouched`** to keep the empty initial state quiet.
- **Place schemas under `features/<feature>/schemas/`** with kebab-case file names ending in `-schema.ts`.
- **Set `noValidate` on the `<form>`** so the browser's built-in validation doesn't fight valibot.
- **`async onSubmit` returns a Promise that TanStack Form awaits** — this is what keeps `isSubmitting` true for the full duration. Make sure you don't fire-and-forget.

### DON'T

- **Don't add `useState` for "submitError" / "isPending" / "isSubmitting".** That's `form.state.errorMap.onSubmit` and `form.state.isSubmitting`. Two sources of truth always desync.
- **Don't wrap the submit in `useTransition` or `useFormStatus`.** TanStack Form's `isSubmitting` already covers the full async flow because it awaits your `onSubmit`. Adding `useTransition` produces a second pending flag that races the form's own.
- **Don't import `@tanstack/valibot-adapter`.** Not needed since valibot 1.x is Standard Schema compatible. Pass the schema directly to `validators.onChange`.
- **Don't use `useMutation` (TanStack Query) for form submission.** Forms are inherently transient state; `useMutation` is for caching server state. Mixing them creates two stores for the same lifecycle.
- **Don't `throw` from `onSubmit` for expected failures.** Throwing leaves the error nowhere visible to the UI. Set it on the form via `setErrorMap`. Reserve throws for truly unexpected bugs that should reach the Error Boundary.
- **Don't access errors as strings naively** — `field.state.meta.errors[0]` may be a `string` (custom message) or an object with `.message`. The pattern above handles both with `String(err?.message ?? err)`.

### When to escape this pattern

- For huge multi-step forms, consider `useFieldGroup` or a dedicated wizard library.
- For optimistic UI tied to fate mutations, use `useActionState` from React with `fate.actions.*` (see [`fate-best-practices.md`](../fate-best-practices.md)). That's a different lane from form-input collection — fate's `useActionState` is paired with the normalized cache and handles rollback automatically.

## Related rules

- [`valibot-validation.md`](./valibot-validation.md) — schema placement and `InferOutput` patterns.
- [`react-conventions.md`](./react-conventions.md) — named exports, function declarations, React Compiler.
- [`no-index-files.md`](./no-index-files.md) — file-naming convention applied to schemas and routes.
