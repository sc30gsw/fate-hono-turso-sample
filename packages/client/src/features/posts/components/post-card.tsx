import type { Post } from "@app/api/features/posts/views";
import { Link } from "@tanstack/react-router";
import { useLiveView, useView, type ViewRef } from "react-fate";

import { AuthorBadge } from "~/features/posts/components/author-badge";
import { PostListItemView } from "~/features/posts/views/post-views";

export function PostCard({ post: postRef }: Record<"post", ViewRef<"Post">>) {
  const post = useView(PostListItemView, postRef);

  return <PostCardContent post={post} />;
}

export function LivePostCard({ post: postRef }: Record<"post", ViewRef<"Post">>) {
  const post = useLiveView(PostListItemView, postRef);

  return <PostCardContent post={post} />;
}

type PostCardData = Pick<Post, "commentCount" | "createdAt" | "id" | "likeCount" | "title"> & {
  author: ViewRef<"User">;
};

function PostCardContent({ post }: { post: PostCardData }) {
  return (
    <article className="rounded border border-neutral-200 bg-white p-4 hover:border-neutral-300">
      <Link className="block" params={{ id: String(post.id) }} to="/posts/$id">
        <h2 className="text-lg font-semibold text-neutral-900">{post.title}</h2>
        <p className="mt-1 text-sm text-neutral-600">
          by <AuthorBadge user={post.author} /> ·{" "}
          {new Date(post.createdAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          {post.likeCount} likes · {post.commentCount} comments
        </p>
      </Link>
    </article>
  );
}
