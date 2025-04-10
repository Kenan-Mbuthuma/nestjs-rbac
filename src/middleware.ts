import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, fetchAuthSession } from "@aws-amplify/auth";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  "cognito:groups"?: string[];
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Skip all auth checks in CI
  if (process.env.CI === "true") {
    console.log("🔁 Skipping middleware in CI environment");
    return NextResponse.next();
  }

  // ✅ Skip middleware for /auth route to avoid infinite redirects
  if (pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  try {
    // ✅ Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // ✅ Get ID token from session
    const session = await fetchAuthSession();
    const idTokenString = session.tokens?.idToken?.toString() ?? "";
    if (!idTokenString) throw new Error("ID token not found");

    // ✅ Decode token to get group info
    const decoded: DecodedToken = jwtDecode(idTokenString);
    const role = decoded["cognito:groups"]?.[0] || "None";

    // ✅ Protect /admin route (SystemAdmin only)
    if (pathname.startsWith("/admin") && role !== "SystemAdmin") {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    // ✅ Protect /dashboard route (OrgAdmin & OrgUser only)
    if (pathname.startsWith("/dashboard") && !["OrgAdmin", "OrgUser"].includes(role)) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

  } catch (error) {
    console.error("Middleware Auth Error:", error);
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  return NextResponse.next();
}
