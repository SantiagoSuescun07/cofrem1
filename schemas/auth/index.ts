import z from "zod";

export const LoginFormSchema = z.object({
  email: z.email({ message: "Por favor ingresa un correo válido." }).trim(),
  password: z.string().min(1).trim(),
});

export const RegisterFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "El nombre debe tener por lo menos 2 caracteres." })
    .trim(),
  email: z.email({ message: "Por favor ingresa un correo válido." }).trim(),
  password: z
    .string()
    .min(8, { message: "Debe tener al menos 8 caracteres" })

    .trim(),
});
