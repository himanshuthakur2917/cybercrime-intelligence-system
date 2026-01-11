import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return NextResponse.json({
      success: true,
      message: "Supabase connection works!",
      user: user ? { id: user.id, email: user.email } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Connection failed",
        details: error,
      },
      { status: 500 }
    );
  }
}
