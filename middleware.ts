import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const protectedPaths = ["/manager", "/manage-tasks"];
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const managerAuth = request.cookies.get("manager-auth")?.value;

  if (managerAuth === "true") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/manager-login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  loginUrl.searchParams.set("reason", "expired");

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/manager/:path*", "/manage-tasks/:path*"],
};