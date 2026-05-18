import { createPostInput, defaultCreatePostValues } from "@app/api/features/posts/schemas";
import { useForm } from "@tanstack/react-form";
import { getRouteApi } from "@tanstack/react-router";
import { useFateClient } from "react-fate";

const routeApi = getRouteApi("/_authenticated/new");

export function PostForm() {
  const navigate = routeApi.useNavigate();
  const fate = useFateClient();

  const form = useForm({
    defaultValues: defaultCreatePostValues,
    validators: {
      onChange: createPostInput,
      onSubmitAsync: async ({ value }) => {
        const result = await fate.mutations.createPost({ input: value });
        if (result.error) {
          return { form: result.error.message ?? "Failed to create post.", fields: {} };
        }
        return null;
      },
    },
    onSubmit: async ({ value: _value }) => {
      //? Server returns `{ id }` but the mutation result is not directly accessible
      //? from `onSubmit` — for now redirect to home; switching to the new post would
      //? require capturing `result.result.id` from `onSubmitAsync`.
      await navigate({ to: "/" });
    },
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      className="space-y-3"
    >
      <form.Field name="title">
        {(field) => (
          <label className="block">
            <span className="block text-sm font-medium text-neutral-700">Title</span>
            <input
              className="mt-1 block w-full rounded border border-neutral-300 p-2"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              type="text"
              value={field.state.value}
            />
            {field.state.meta.isTouched && field.state.meta.errors[0] ? (
              <p className="mt-1 text-sm text-red-600">
                {String(field.state.meta.errors[0]?.message ?? field.state.meta.errors[0])}
              </p>
            ) : null}
          </label>
        )}
      </form.Field>

      <form.Field name="content">
        {(field) => (
          <label className="block">
            <span className="block text-sm font-medium text-neutral-700">Content</span>
            <textarea
              className="mt-1 block w-full rounded border border-neutral-300 p-2"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={8}
              value={field.state.value}
            />
            {field.state.meta.isTouched && field.state.meta.errors[0] ? (
              <p className="mt-1 text-sm text-red-600">
                {String(field.state.meta.errors[0]?.message ?? field.state.meta.errors[0])}
              </p>
            ) : null}
          </label>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.errorMap.onSubmit ?? null}>
        {(formError) => (formError ? <p className="text-sm text-red-600">{formError}</p> : null)}
      </form.Subscribe>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <button
            className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
            disabled={!canSubmit || isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Publishing…" : "Publish"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
