import * as v from "valibot";

export const createPostInput = v.object({
  title: v.pipe(v.string(), v.trim(), v.minLength(1, "Title is required."), v.maxLength(120)),
  content: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Content is required."),
    v.maxLength(10_000),
  ),
});

export type CreatePostInput = v.InferOutput<typeof createPostInput>;

export const deletePostInput = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
});

export type DeletePostInput = v.InferOutput<typeof deletePostInput>;

export const defaultCreatePostValues: CreatePostInput = {
  title: "",
  content: "",
};
