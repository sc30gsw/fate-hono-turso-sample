import { createFateServer, list } from "@nkzw/fate/server";

import { postSummaryDataView } from "./views";

type Roots = NonNullable<Parameters<typeof createFateServer>[0]>["roots"];

export const Root = {
  posts: list(postSummaryDataView, { orderBy: { createdAt: "desc", id: "desc" } }),
} as const satisfies Roots;
