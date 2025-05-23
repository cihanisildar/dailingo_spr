import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Create and export handler functions directly
export const GET = NextAuth(authOptions);
export const POST = NextAuth(authOptions); 