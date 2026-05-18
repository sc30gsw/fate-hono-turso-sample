import { createFateServer, list } from "@nkzw/fate/server";

import { postDataView, postSummaryDataView } from "~/features/posts/views";

type Roots = NonNullable<Parameters<typeof createFateServer>[0]>["roots"];

export const Root = {
  post: postDataView,
  posts: list(postSummaryDataView, { orderBy: { createdAt: "desc", id: "desc" } }),
} as const satisfies Roots;
