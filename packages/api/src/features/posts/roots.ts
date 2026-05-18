import { createFateServer, list } from "@nkzw/fate/server";

import { postDataView } from "./views";

type Roots = NonNullable<Parameters<typeof createFateServer>[0]>["roots"];

export const Root = {
  posts: list(postDataView, { orderBy: { createdAt: "desc", id: "desc" } }),
} as const satisfies Roots;
