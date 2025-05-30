import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }
    const suggestion = await prisma.suggestion.create({
      data: { message },
    });
    return NextResponse.json({ success: true, suggestion });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save suggestion." }, { status: 500 });
  }
} 