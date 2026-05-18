import type { UserRow } from "@app/db/auth-schema";
import { dataView, type Entity } from "@nkzw/fate/server";

export const userDataView = dataView<UserRow>("User")({
  id: true,
  name: true,
  image: true,
});

export type User = Entity<typeof userDataView, "User">;
