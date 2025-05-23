import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/prisma/prisma";
import { Adapter } from "next-auth/adapters";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true
          }
        });

        if (!user?.password) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin"
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow OAuth without email verification
      if (account?.provider === "google") {
        return true;
      }

      // For credentials, check if user exists and has password
      if (account?.provider === "credentials") {
        return true;
      }

      return false;
    },
    jwt: async ({ token, trigger, session }) => {
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      if (trigger === "update" && session?.email) {
        token.email = session.email;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub!;
        session.user.name = token.name;
        session.user.email = token.email as string;
      }
      return session;
    },
    redirect: async ({ url, baseUrl }) => {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  debug: false,
  secret: process.env.NEXTAUTH_SECRET,
};