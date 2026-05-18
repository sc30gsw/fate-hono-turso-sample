import { relations, sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth-schema";

export const post = sqliteTable("post", {
  id: text("id").primaryKey(),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const comment = sqliteTable("comment", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const like = sqliteTable(
  "like",
  {
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

export const postRelations = relations(post, ({ many, one }) => ({
  author: one(user, { fields: [post.authorId], references: [user.id] }),
  comments: many(comment),
  likes: many(like),
}));

export const commentRelations = relations(comment, ({ one }) => ({
  post: one(post, { fields: [comment.postId], references: [post.id] }),
  author: one(user, { fields: [comment.authorId], references: [user.id] }),
}));

export const likeRelations = relations(like, ({ one }) => ({
  post: one(post, { fields: [like.postId], references: [post.id] }),
  user: one(user, { fields: [like.userId], references: [user.id] }),
}));

export type PostRow = typeof post.$inferSelect;
export type CommentRow = typeof comment.$inferSelect;
