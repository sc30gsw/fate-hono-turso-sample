# Form Pattern (TanStack Form + valibot)

## Stack

| Concern | Tool |
|---|---|
| Field state, validation orchestration, accessibility wiring | `@tanstack/react-form` (`useForm`, `form.Field`, `form.Subscribe`) |
| Submitting / canSubmit flags | `form.state.isSubmitting` + `form.state.canSubmit` (built-in) |
| Submit-time errors (network / 401 / 500 / 409 / etc.) | `validators.onSubmitAsync` returning `{ form, fields }`, surfaced via `state.errorMap.onSubmit` |
| Field-level validation errors | `field.state.meta.errors` (populated by validators) |
| Schema validation (synchronous, client + server) | `valibot` 1.x — Standard Schema compatible, **no adapter needed** |
| Schema placement (field shape) | `features/<feature>/schemas/<name>-schema.ts` |
| Schema placement (route search params) | `features/<feature>/schemas/search-params/<name>-search-schema.ts` |

**TanStack Form owns the entire form lifecycle.** Do NOT introduce `useState`, `useReducer`, `useTransition`, `useFormStatus`, or `useMutation` to track submitting / pending / server-error state. They duplicate machinery that already exists in `form.state` and they desync from the form's own view of the world.

## File layout

Forms are split into two files:

| File | Responsibility |
|---|---|
| `routes/<route>.tsx` | Thin route shell. Defines the route, mounts the page section, renders the form component. |
| `features/<feature>/components/<feature>-form.tsx` | The actual `useForm` call, validators, fields, and `form.Subscribe` plumbing. |

The form component uses `getRouteApi("/path")` for typed `navigate` / `search` access instead of the global `useNavigate()`. This keeps the form decoupled and the typed search params flow through automatically.

## Schema file shape

```ts
// features/auth/schemas/sign-in-schema.ts
import * as v from "valibot";

export const signInSchema = v.object({
  email: v.pipe(v.string(), v.email("Enter a valid email address.")),
  password: v.pipe(v.string(), v.minLength(8, "Password must be at least 8 characters.")),
});

export type SignInInput = v.InferOutput<typeof signInSchema>;
export const defaultSignInValues: SignInInput = { email: "", password: "" };
```

Export three things per schema file (camelCase value names; UpperCamelCase type name):
- The schema (`<name>Schema`).
- `<Name>Input` derived via `v.InferOutput`.
- `default<Name>Values` so the form never has to spell out blank defaults inline.

## Form component shape

```tsx
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
      //? Sync field-shape validation (Standard Schema, no adapter).
      onChange: signInSchema,
      //? Server validation runs on submit. Returning `{ form, fields }` populates
      //? `state.errorMap.onSubmit` with a typed shape inferred from this function's
      //? return — no `as` cast needed.
      onSubmitAsync: async ({ value }) => {
        const result = await signIn.email(value);
        if (result.error) {
          return { form: result.error.message ?? "Sign-in failed.", fields: {} };
        }
        return null;
      },
    },
    //? Reached only when every validator resolves without errors.
    onSubmit: async () => {
      await navigate({ to: search.redirect ?? "/" });
    },
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
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
              onChange={(e) => field.handleChange(e.target.value)}
              type="email"
              value={field.state.value}
            />
            {field.state.meta.isTouched && field.state.meta.errors[0] ? (
              <p>{String(field.state.meta.errors[0]?.message ?? field.state.meta.errors[0])}</p>
            ) : null}
          </label>
        )}
      </form.Field>

      {/* errorMap.onSubmit merges sync+async submit validator errors; TanStack Form
          unwraps `{ form }` so the slot is typed `string | null` directly. */}
      <form.Subscribe selector={(state) => state.errorMap.onSubmit ?? null}>
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
| Submit-time / server errors | `state.errorMap.onSubmit` (sync `onSubmit` + async `onSubmitAsync` merge here) |

Read these via `form.Subscribe` with a `selector` so only the consuming subtree re-renders.

## Server / API error handling

The canonical pattern: do the server call inside `validators.onSubmitAsync` and return the error shape. TanStack Form routes the result into `state.errorMap.onSubmit` with the slot's type inferred from the validator's return — no manual cast.

```ts
validators: {
  onChange: signInSchema,
  onSubmitAsync: async ({ value }) => {
    const result = await api.call(value);
    if (result.error) {
      return {
        form: result.error.message,                // form-level banner
        fields: { email: "Already taken." },        // route to a specific field ({} if none)
      };
    }
    return null;                                    // success → onSubmit runs next
  },
},
onSubmit: async () => {
  // Reached only when validators succeed. Action (navigate, refresh, etc.) lives here.
},
```

The `form` field on the validator return becomes a `string | null` in `state.errorMap.onSubmit`. The `fields` map populates each field's `field.state.meta.errors` automatically.

`GlobalFormValidationError` requires both `form` and `fields`. Use `fields: {}` when you only have a form-level message; populate it to route per-field server errors that appear next to each field via `form.Field`.

## Rules

### DO

- **Put the server call in `validators.onSubmitAsync`** so the error type flows into `state.errorMap.onSubmit` with full type inference. Reserve the top-level `onSubmit` for the success action (navigate, refresh, close modal).
- **Use `form.state.isSubmitting`** for the submit button's disabled / label state via `form.Subscribe`. `useTransition` is not needed.
- **Use `form.Subscribe` with `selector`** for derived state. It avoids re-rendering the whole form on every keystroke.
- **Render field errors only after `meta.isTouched`** to keep the empty initial state quiet.
- **Place schemas under `features/<feature>/schemas/`** with kebab-case file names ending in `-schema.ts`. Share search-param schemas across related routes (`schemas/search-params/<topic>-search-schema.ts`).
- **Set `noValidate` on the `<form>`** so the browser's built-in validation doesn't fight valibot.
- **Use `getRouteApi("/path").useNavigate() / useSearch()`** inside form components instead of global `useNavigate()`. The typed route API keeps the search shape inferred.
- **Use single-letter `e` for event handler parameters** (`onChange={(e) => ...}`, `onSubmit={(e) => { e.preventDefault(); ... }}`).
- **`async onSubmit` and `async onSubmitAsync` are awaited internally** — that's what keeps `isSubmitting` true for the full duration. Make sure you don't fire-and-forget.

### DON'T

- **Don't add `useState` for "submitError" / "isPending" / "isSubmitting".** Those are `form.state.errorMap.onSubmit` and `form.state.isSubmitting`. Two sources of truth always desync.
- **Don't wrap the submit in `useTransition` or `useFormStatus`.** TanStack Form's `isSubmitting` already covers the full async flow because it awaits your validators and `onSubmit`. Adding `useTransition` produces a second pending flag that races the form's own.
- **Don't put the server call in the top-level `onSubmit` and then `formApi.setErrorMap`.** That works but loses the type inference from the validator's return — you have to cast `errorMap.onSubmit` because it's `never` when no `onSubmit` validator is configured. Use `validators.onSubmitAsync` instead.
- **Don't import `@tanstack/valibot-adapter` for the form's `validators`.** Not needed since valibot 1.x is Standard Schema compatible. (The same adapter IS used for TanStack Router's `validateSearch` — different concern, same package, see `auth-guard.md`.)
- **Don't use `useMutation` (TanStack Query) for form submission.** Forms are inherently transient state; `useMutation` is for caching server state. Mixing them creates two stores for the same lifecycle.
- **Don't `throw` from validators / `onSubmit` for expected failures.** Return the error shape from `onSubmitAsync` instead. Reserve throws for unexpected bugs that should reach the Error Boundary.
- **Don't cast `state.errorMap.onSubmit`** (`as { form?: string } | undefined` and friends). If you're reaching for a cast, the validator setup is wrong — wire the server call through `validators.onSubmitAsync` and the type comes for free.
- **Don't access errors as strings naively** — `field.state.meta.errors[0]` may be a `string` (custom message) or an object with `.message`. Handle both with `String(err?.message ?? err)`.

### When to escape this pattern

- For huge multi-step forms, consider `useFieldGroup` or a dedicated wizard library.
- For optimistic UI tied to fate mutations, use `useActionState` from React with `fate.actions.*` (see [`fate-best-practices.md`](../fate-best-practices.md)). That's a different lane from form-input collection — fate's `useActionState` is paired with the normalized cache and handles rollback automatically.

## Related rules

- [`valibot-validation.md`](./valibot-validation.md) — schema placement and `InferOutput` patterns.
- [`react-conventions.md`](./react-conventions.md) — named exports, function declarations, React Compiler.
- [`no-index-files.md`](./no-index-files.md) — file-naming convention applied to schemas and routes.
- [`../auth-guard.md`](../auth-guard.md) — Better Auth + TanStack Router integration that this form pattern plugs into.
