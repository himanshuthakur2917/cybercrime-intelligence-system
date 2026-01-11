import { login } from "@/lib/auth-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    const result = await login(email, password);

    if (result?.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Login failed",
        details: error,
      },
      { status: 500 }
    );
  }
}
