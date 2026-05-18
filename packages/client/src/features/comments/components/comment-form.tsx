import { commentBodyInput, defaultCommentBodyValues } from "@app/api/features/comments/schemas";
import type { Post } from "@app/api/features/posts/views";
import { useForm } from "@tanstack/react-form";
import { useFateClient } from "react-fate";

import { useSession } from "~/lib/auth-client";

export function CommentForm({ postId }: Record<"postId", Post["id"]>) {
  const fate = useFateClient();
  const { data: session } = useSession();

  const form = useForm({
    defaultValues: defaultCommentBodyValues,
    validators: {
      onChange: commentBodyInput,
      onSubmitAsync: async ({ value }) => {
        const now = new Date();
        const result = await fate.mutations.addComment({
          input: { postId, content: value.content },
          insert: "after",
          optimistic: session?.user
            ? {
                id: `optimistic:${crypto.randomUUID()}`,
                author: {
                  id: session.user.id,
                  image: session.user.image,
                  name: session.user.name,
                },
                content: value.content,
                createdAt: now,
                post: { id: postId },
              }
            : undefined,
        });
        if (result.error) {
          return { form: result.error.message ?? "Failed to add comment.", fields: {} };
        }
        return null;
      },
    },
    onSubmit: async ({ formApi }) => {
      formApi.reset();
    },
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      className="space-y-2"
    >
      <form.Field name="content">
        {(field) => (
          <label className="block">
            <span className="block text-sm font-medium text-neutral-700">Add a comment</span>
            <textarea
              className="mt-1 block w-full rounded border border-neutral-300 p-2"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={3}
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
            className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50"
            disabled={!canSubmit || isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Posting…" : "Post comment"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
