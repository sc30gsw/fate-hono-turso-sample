import type { Post } from "@app/api/features/posts/views";
import { useNavigate } from "@tanstack/react-router";
import { useActionState } from "react";
import { useFateClient } from "react-fate";

import { useSession } from "~/lib/auth-client";

type DeletePostButtonProps = {
  authorId: Post["author"]["id"];
  postId: Post["id"];
};

export function DeletePostButton({ authorId, postId }: DeletePostButtonProps) {
  const fate = useFateClient();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [result, deletePost, isPending] = useActionState(fate.actions.deletePost, null);
  const showError = result && "error" in result && result.error !== undefined;

  if (session?.user.id !== authorId) {
    return null;
  }

  return (
    <button
      className="rounded border border-red-200 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
      disabled={isPending}
      onClick={() => {
        void deletePost({ input: { id: postId }, delete: true });
        void navigate({ to: "/" });
      }}
      type="button"
    >
      {isPending ? "Deleting..." : showError ? "Retry delete" : "Delete post"}
    </button>
  );
}
