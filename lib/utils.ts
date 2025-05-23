import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import bcrypt from "bcryptjs"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateSlug(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

export function generateCardUrl(word: string, id: string): string {
  const slug = generateSlug(word);
  return `/dashboard/cards/${slug}-${id}`;
}
