import * as v from "valibot";

export const signUpSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required.")),
  email: v.pipe(v.string(), v.email("Enter a valid email address.")),
  password: v.pipe(
    v.string(),
    v.minLength(8, "Password must be at least 8 characters."),
    v.maxLength(128, "Password must be at most 128 characters."),
  ),
});

export type SignUpInput = v.InferOutput<typeof signUpSchema>;

export const defaultSignUpValues: SignUpInput = { name: "", email: "", password: "" };
