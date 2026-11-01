import { z } from 'zod';

/** Mêmes règles que l'API (Assert\Regex de ChangePasswordDto / ResetPasswordDto) */
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit comporter au moins 8 caractères')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
  );

/** Identifiant de connexion : adresse e-mail ou nom d'utilisateur */
export const identifierSchema = z
  .string()
  .trim()
  .min(1, "L'identifiant est obligatoire")
  .refine((val) => z.email().safeParse(val).success || val.length >= 3, {
    message: "Veuillez renseigner une adresse e-mail valide ou un nom d'utilisateur (au moins 3 caractères)",
  });

/** Code de connexion à 6 chiffres reçu par e-mail */
export const loginCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Le code doit contenir exactement 6 chiffres');
