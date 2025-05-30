"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import dailingo_logo from "../../../public/repeeker.png";
import Image from "next/image";

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const router = useRouter();

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError("");

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const terms = formData.get("terms");

    if (!terms) {
      setFormError("Please accept the terms and conditions");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Sign in the user after successful registration
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      router.push("/dashboard");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Something went wrong"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#5B7CFA]/20 via-[#6C5DD3]/10 to-white dark:from-[#5B7CFA]/40 dark:via-[#6C5DD3]/20 dark:to-slate-900/50 pointer-events-none" />
      <div className="fixed inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,transparent)] dark:bg-grid-slate-800/50 pointer-events-none" />
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.01] mix-blend-overlay pointer-events-none" />

      {/* Decorative elements */}
      <div className="absolute -left-8 -top-8 w-48 h-48 bg-gradient-to-br from-rose-300/20 to-indigo-300/20 rounded-full blur-3xl"></div>
      <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-gradient-to-tl from-indigo-300/20 to-rose-300/20 rounded-full blur-3xl"></div>

      <Card className="w-full max-w-[420px] relative bg-white dark:bg-slate-900/80 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="space-y-2 text-center relative pt-6">
          <div className="flex justify-center mb-2">
            <Link href="/" className="flex items-center gap-2">
              <Image src={dailingo_logo} alt="logo" width={50} height={50} />
              <span className="text-2xl font-bold bg-gradient-to-r from-[#5B7CFA] to-[#6C5DD3] bg-clip-text text-transparent">
                Repeeker
              </span>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold">
            Create an account
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Start your vocabulary learning journey today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {formError && (
            <div className="bg-destructive/10 text-destructive text-center p-2 rounded-lg text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  disabled={isLoading}
                  required
                  className="h-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  disabled={isLoading}
                  required
                  className="h-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                placeholder="john@example.com"
                type="email"
                disabled={isLoading}
                required
                className="h-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                placeholder="Create a password"
                type="password"
                disabled={isLoading}
                required
                minLength={8}
                className="h-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" name="terms" />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-[#5B7CFA] hover:text-[#6C5DD3] dark:text-[#5B7CFA] dark:hover:text-[#6C5DD3] font-medium"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-[#5B7CFA] hover:text-[#6C5DD3] dark:text-[#5B7CFA] dark:hover:text-[#6C5DD3] font-medium"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-[#5B7CFA] to-[#6C5DD3] hover:from-[#6C5DD3] hover:to-[#5B7CFA] text-white mt-2 shadow-lg shadow-blue-200/40"
              disabled={isLoading}
            >
              Create Account
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground">
                  OR CONTINUE WITH
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full h-10 bg-white hover:bg-white/90 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pb-6 pt-0 text-center flex items-center justify-center">
          <div className="text-sm text-muted-foreground space-x-2">
            <span>Already have an account? </span>
            <Link
              href="/auth/signin"
              className="text-[#5B7CFA] hover:text-[#6C5DD3] dark:text-[#5B7CFA] dark:hover:text-[#6C5DD3] font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
