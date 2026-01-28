import { UserRole } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";

// TODO: Extenderlo con el Id del parqueadero al que pertence
export type ExtendedUser = DefaultSession["user"] & {
  name: string | null;
  image: string | null;
  phone: string | null;
  position?: string;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
    drupal?: {
      accessToken?: string;
      refreshToken?: string;
      user?: {
        uid: string;
        name: string;
        email: string;
      };
      expiresAt?: number;
      authData?: any; // Data completa de la respuesta de Drupal
    };
  }

  interface JWT {
    phone?: string; 
    position?: string; 
    drupalAccessToken?: string;
    drupalRefreshToken?: string;
    drupalUser?: {
      uid: string;
      name: string;
      email: string;
    };
    drupalTokenExpires?: number;
    drupalAuthData?: any; // Data completa de la respuesta de Drupal
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleTokenExpires?: number;
  }
}