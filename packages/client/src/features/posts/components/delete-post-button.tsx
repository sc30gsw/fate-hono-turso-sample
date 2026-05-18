import type { Post } from "@app/api/features/posts/views";
import { useActionState, useRef } from "react";
import { useFateClient } from "react-fate";

export function DeletePostButton({ postId }: Record<"postId", Post["id"]>) {
  const fate = useFateClient();
  const [result, deletePost, isPending] = useActionState(fate.actions.deletePost, null);
  const showError = result && "error" in result && result.error !== undefined;

  return (
    <button
      className="rounded border border-red-200 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
      disabled={isPending}
      onClick={() => {
        void deletePost({ input: { id: postId }, delete: true });
      }}
      type="button"
    >
      {isPending ? "Deleting..." : showError ? "Retry delete" : "Delete post"}
    </button>
  );
}
