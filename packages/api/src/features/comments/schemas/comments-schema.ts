import * as v from "valibot";

export const addCommentInput = v.object({
  postId: v.pipe(v.string(), v.minLength(1)),
  content: v.pipe(v.string(), v.trim(), v.minLength(1, "Comment is required."), v.maxLength(2_000)),
});

export type AddCommentInput = v.InferOutput<typeof addCommentInput>;

export const deleteCommentInput = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
});

export type DeleteCommentInput = v.InferOutput<typeof deleteCommentInput>;

export const commentBodyInput = v.pick(addCommentInput, ["content"]);

export const defaultCommentBodyValues: v.InferOutput<typeof commentBodyInput> = {
  content: "",
};
