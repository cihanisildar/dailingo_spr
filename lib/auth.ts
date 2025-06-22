import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { ApiResponse } from '@/types/api';
import jwt from 'jsonwebtoken';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
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
          
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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

          const result = await response.json() as ApiResponse<User>;
          console.log('[DEBUG] Login response:', result);

          if (result.status === 'error' || !response.ok) {
            console.log('[DEBUG] Login failed:', result);
            return null;
          }

          if (result.data) {
            // Return the user object in the format NextAuth expects
            return {
              id: result.data.id,
              email: result.data.email,
              name: result.data.name,
              image: result.data.image || null,
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

      // User sync is handled in the JWT callback for proper token management

      return true;
    },
    async jwt({ token, user, account }) {
      console.log('[DEBUG] JWT Callback - Input:', { token, user, account, isFirstSignIn: !!user });
      
      // On first login, user is present - this is when we need to map Google ID to internal ID
      if (user && account) {
        console.log('[DEBUG] First sign-in detected, processing user mapping...');
        
        if (account.provider === 'google') {
          try {
            console.log('[DEBUG] Fetching internal user ID for Google user:', user.email, 'with Google ID:', user.id);
            const response = await fetch('https://repeekerserver-production.up.railway.app/api/auth/sync-google-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: user.id, // Google's unique user ID
                email: user.email,
                name: user.name,
                image: user.image,
              }),
            });

            const result = await response.json();
            console.log('[DEBUG] Sync response in JWT:', result);

            if (result.status === 'success' && result.data && result.data.user && result.data.user.id) {
              // Use the internal database ID instead of the Google ID
              token.id = result.data.user.id;
              token.email = result.data.user.email || user.email;
              token.name = result.data.user.name || user.name;
              token.picture = result.data.user.image || user.image;
              console.log('[DEBUG] Updated token with internal database user:', {
                oldId: user.id,
                newId: token.id,
                email: token.email
              });
            } else {
              // Fallback to using the Google ID if sync fails
              console.error('[DEBUG] Sync failed, using Google ID as fallback:', result);
              token.id = user.id;
              token.email = user.email;
              token.name = user.name;
              token.picture = user.image;
            }
          } catch (error) {
            console.error('[DEBUG] Error getting internal user ID, using Google ID as fallback:', error);
            token.id = user.id;
            token.email = user.email;
            token.name = user.name;
            token.picture = user.image;
          }
        } else {
          // For non-Google providers (like credentials), use the user data as-is
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.picture = user.image;
        }
      }
      
      // Always generate a JWT for accessToken if we have the info
      if (token.id && token.email) {
        console.log('[DEBUG] JWT Callback - Generating access token with:', {
          id: token.id,
          email: token.email,
          name: token.name,
          secret: process.env.NEXTAUTH_SECRET ? 'exists' : 'missing'
        });
        
        token.accessToken = jwt.sign(
          { id: token.id, email: token.email, name: token.name },
          process.env.NEXTAUTH_SECRET!,
          { expiresIn: '30d' }
        );
      }
      
      console.log('[DEBUG] JWT Callback - Output token:', token);
      return token;
    },
    async session({ session, token }) {
      console.log('[DEBUG] Session Callback - Input:', { session, token });
      
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      session.accessToken = token.accessToken as string;
      
      console.log('[DEBUG] Session Callback - Output session:', session);
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}