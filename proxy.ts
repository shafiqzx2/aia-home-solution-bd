import { NextResponse, type NextRequest } from "next/server";

// Locale routing only; this is deliberately not an authentication boundary.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const legacyLogin = path.match(/^\/(en|bn)\/admin\/login\/?$/);
  if (legacyLogin) {
    const target = request.nextUrl.clone();
    target.pathname = `/${legacyLogin[1]}/login`;
    return NextResponse.redirect(target);
  }
  if (/^\/(en|bn)(\/|$)/.test(path)) return NextResponse.next();
  const target = request.nextUrl.clone();
  target.pathname = `/en${path === "/" ? "" : path}`;
  return NextResponse.redirect(target);
}
export const config = {
  matcher: ["/((?!api|_next|images|favicon.ico|icon.svg|.*\\..*).*)"],
};
