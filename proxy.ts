import { NextResponse, type NextRequest } from "next/server";

// Locale routing plus an explicit closed-admin redirect until auth is installed.
// Protected handlers must still authorize independently of this navigation guard.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (/^\/(en|bn)(\/|$)/.test(path)) return NextResponse.next();
  const target = request.nextUrl.clone();
  target.pathname = `/en${path === "/" ? "" : path}`;
  return NextResponse.redirect(target);
}
export const config = {
  matcher: ["/((?!api|_next|images|favicon.ico|icon.svg|.*\\..*).*)"],
};
