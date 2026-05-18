import { createRoute, Link } from "@tanstack/react-router";
import { useRequest } from "react-fate";

import { LivePostCard } from "~/features/posts/components/post-card";
import { PostListItemView } from "~/features/posts/views/post-views";
import { Route as AuthenticatedRoute } from "~/routes/authenticated";

function PostList() {
  const { posts } = useRequest(
    { posts: { list: PostListItemView } },
    { mode: "stale-while-revalidate" },
  );

  return posts.length === 0 ? (
    <p className="text-neutral-500">No posts yet.</p>
  ) : (
    <ul className="space-y-3">
      {posts.map((post) => (
        <li key={post.id}>
          <LivePostCard post={post} />
        </li>
      ))}
    </ul>
  );
}

function LiveHomePage() {
  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts (live)</h1>
        <Link className="rounded bg-neutral-900 px-3 py-1 text-sm text-white" to="/new">
          New post
        </Link>
      </header>
      <PostList />
    </section>
  );
}

export const Route = createRoute({
  getParentRoute: () => AuthenticatedRoute,
  path: "/live",
  component: LiveHomePage,
});
