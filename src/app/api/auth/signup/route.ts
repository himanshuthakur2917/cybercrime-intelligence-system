import { signup } from "@/lib/auth-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Missing email, password, or role" },
        { status: 400 }
      );
    }

    const result = await signup(email, password, role as "admin" | "officer");

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Signup failed",
        details: error,
      },
      { status: 500 }
    );
  }
}
