import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Requer ao menos 1 letra maiúscula')
    .regex(/[0-9]/, 'Requer ao menos 1 número')
    .regex(/[^A-Za-z0-9]/, 'Requer ao menos 1 caractere especial'),
  organization: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const refreshSchema = z.object({
  refreshToken: z.string(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
