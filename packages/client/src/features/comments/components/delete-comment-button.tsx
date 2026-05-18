import type { Comment } from "@app/api/features/comments/views";
import { useActionState } from "react";
import { useFateClient } from "react-fate";

import { useSession } from "~/lib/auth-client";

type DeleteCommentButtonProps = {
  authorId: Comment["author"]["id"];
  commentId: Comment["id"];
};

export function DeleteCommentButton({ authorId, commentId }: DeleteCommentButtonProps) {
  const fate = useFateClient();
  const { data: session } = useSession();
  const [result, deleteComment, isPending] = useActionState(fate.actions.deleteComment, null);
  const showError = result && "error" in result && result.error !== undefined;

  if (session?.user.id !== authorId) {
    return null;
  }

  return (
    <button
      className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
      disabled={isPending}
      onClick={() => void deleteComment({ input: { id: commentId }, delete: true })}
      type="button"
    >
      {isPending ? "Deleting..." : showError ? "Retry delete" : "Delete"}
    </button>
  );
}
