import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route configuration map
 * Defines all routes and their access requirements
 * Replicated from RouteProxy for middleware compatibility
 */
interface RouteConfig {
  path: string;
  allowedRoles: string[];
  isPublic?: boolean;
  redirectTo?: string;
}

const ROUTE_CONFIG: RouteConfig[] = [
  // Public routes
  { path: "/", allowedRoles: [], isPublic: true },

  // Officer routes
  { path: "/dashboard", allowedRoles: ["officer", "administrator"] },
  { path: "/dashboard/analytics", allowedRoles: ["officer", "administrator"] },
  { path: "/dashboard/briefs", allowedRoles: ["officer", "administrator"] },
  { path: "/dashboard/kingpins", allowedRoles: ["officer", "administrator"] },
  { path: "/dashboard/map", allowedRoles: ["officer", "administrator"] },
  { path: "/dashboard/patterns", allowedRoles: ["officer", "administrator"] },
  { path: "/dashboard/rings", allowedRoles: ["officer", "administrator"] },
  { path: "/dashboard/tracking", allowedRoles: ["officer", "administrator"] },
  { path: "/dashboard/upload", allowedRoles: ["officer", "administrator"] },

  // Admin-only routes
  { path: "/admin", allowedRoles: ["administrator"], redirectTo: "/dashboard" },
  {
    path: "/admin/cases",
    allowedRoles: ["administrator"],
    redirectTo: "/dashboard",
  },
  {
    path: "/admin/officers",
    allowedRoles: ["administrator"],
    redirectTo: "/dashboard",
  },
  {
    path: "/admin/upload",
    allowedRoles: ["administrator"],
    redirectTo: "/dashboard",
  },
  {
    path: "/admin/warrants",
    allowedRoles: ["administrator"],
    redirectTo: "/dashboard",
  },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get auth cookies
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("user_role")?.value;
  const isAuthenticated = !!token;

  // 2. Find route config
  const config = ROUTE_CONFIG.find(
    (route) => pathname === route.path || pathname.startsWith(route.path + "/"),
  );

  // 3. Handle public routes
  if (config?.isPublic) {
    // If authenticated and trying to access login page, redirect to correct dashboard with reload
    if (pathname === "/" && isAuthenticated) {
      const dashboard = role === "administrator" ? "/admin" : "/dashboard";

      // Create redirect response with cache-busting to force reload
      const redirectUrl = new URL(dashboard, request.url);
      redirectUrl.searchParams.set("_reload", Date.now().toString());

      const response = NextResponse.redirect(redirectUrl);
      // Add headers to prevent caching and force reload
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");

      return response;
    }
    return NextResponse.next();
  }

  // 4. Handle protected routes
  if (!isAuthenticated) {
    // If not authenticated, redirect to login with reload
    const loginUrl = new URL("/", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate",
    );

    return response;
  }

  // 5. Check role permissions
  if (config) {
    const hasPermission = config.allowedRoles.includes(role || "");

    if (!hasPermission) {
      // If no permission, redirect to designated fallback or default dashboard with reload
      const fallback =
        config.redirectTo ||
        (role === "administrator" ? "/admin" : "/dashboard");

      // Create redirect with cache-busting to force reload
      const redirectUrl = new URL(fallback, request.url);
      redirectUrl.searchParams.set("_reload", Date.now().toString());

      const response = NextResponse.redirect(redirectUrl);
      // Force reload headers
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate",
      );
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");

      return response;
    }
  }

  // Default: proceed
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
