import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const password = body.password;

  if (!process.env.MANAGER_PASSWORD) {
    return NextResponse.json(
      { error: "Manager password is not configured." },
      { status: 500 }
    );
  }

  if (password !== process.env.MANAGER_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("manager-auth", "true", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}