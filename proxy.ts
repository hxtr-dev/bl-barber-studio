import { NextResponse, type NextRequest } from "next/server";

// admin.blbarberstudio.com.br abre o painel do ADM como um site separado.
export function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const { pathname } = req.nextUrl;
  if (host.startsWith("admin.") && !pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
    const url = req.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon|icon|apple-icon|.*\\.(?:png|jpg|webp|svg|ico|txt|xml)$).*)"],
};
