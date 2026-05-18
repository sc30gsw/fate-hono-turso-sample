import * as v from "valibot";

const passwordSchema = v.pipe(
  v.string(),
  v.minLength(8, "Password must be at least 8 characters."),
  v.maxLength(128, "Password must be at most 128 characters."),
  v.regex(/[A-Z]/, "Password must include at least one uppercase letter."),
  v.regex(/[a-z]/, "Password must include at least one lowercase letter."),
  v.regex(/[0-9]/, "Password must include at least one number."),
  v.regex(/[^A-Za-z0-9]/, "Password must include at least one symbol."),
);

export const signUpSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required.")),
  email: v.pipe(v.string(), v.email("Enter a valid email address.")),
  password: passwordSchema,
});

export type SignUpInput = v.InferOutput<typeof signUpSchema>;

export const defaultSignUpValues: SignUpInput = { name: "", email: "", password: "" };
