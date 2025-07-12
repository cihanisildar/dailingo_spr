import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  rp_accessToken: string;
  rp_refreshToken: string;
}

interface AuthResponse {
  user: User;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          console.log('[DEBUG] Attempting login with:', { email: credentials.email });
          
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            }),
            credentials: 'include'
          });

          const result = await response.json() as ApiResponse<AuthResponse>;
          console.log('[DEBUG] Login response:', result);

          if (result.status === 'error' || !response.ok) {
            console.log('[DEBUG] Login failed:', result);
            return null;
          }

          if (result.data) {
            const user = result.data.user;
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image || null,
              accessToken: user.rp_accessToken,
              refreshToken: user.rp_refreshToken,
            };
          }
          return null;
        } catch (error) {
          console.error("[DEBUG] Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[DEBUG] signIn callback triggered', { provider: account?.provider, user, profile });
      return true;
    },
    async jwt({ token, user, account }) {
      console.log('[DEBUG] JWT Callback - Input:', { token, user, account });
      if (account && account.provider === 'google') {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/sync-google-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user?.id,
              email: user?.email,
              name: user?.name,
              image: user?.image,
            }),
          });
          const result = await response.json();
          console.log('[DEBUG] Google sync result:', result);
          if (result.status === 'success' && result.data && result.data.user) {
            const syncedUser = result.data.user;
            token.id = syncedUser.id;
            token.email = syncedUser.email;
            token.name = syncedUser.name;
            token.picture = syncedUser.image;
            token.accessToken = result.data.rp_accessToken;
            token.refreshToken = result.data.rp_refreshToken;
            console.log('[DEBUG] Token after sync:', token);
          } else {
            token.id = user?.id;
            token.email = user?.email;
            token.name = user?.name;
            token.picture = user?.image;
            console.log('[DEBUG] Google sync failed, fallback token:', token);
          }
        } catch (error) {
          token.id = user?.id;
          token.email = user?.email;
          token.name = user?.name;
          token.picture = user?.image;
          console.log('[DEBUG] Google sync error, fallback token:', token);
        }
      } else if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        if ((user as any).accessToken) {
          token.accessToken = (user as any).accessToken;
          token.refreshToken = (user as any).refreshToken;
        }
      }
      console.log('[DEBUG] JWT Callback - Output token:', token);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}