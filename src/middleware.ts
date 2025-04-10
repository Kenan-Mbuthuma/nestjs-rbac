import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, fetchAuthSession } from "@aws-amplify/auth";
import { jwtDecode } from "jwt-decode"; // Make sure jwt-decode is installed

interface DecodedToken {
  "cognito:groups"?: string[];
}

export async function middleware(req: NextRequest) {
  // ✅ Skip all auth checks in CI
  if (process.env.CI === "true") {
    console.log("🔁 Skipping middleware in CI environment");
    return NextResponse.next();
  }

  try {
    // ✅ Fetch authenticated user
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // ✅ Fetch session to get ID token
    const session = await fetchAuthSession();
    const idTokenString = session.tokens?.idToken?.toString() ?? "";
    if (!idTokenString) throw new Error("ID token not found");

    // ✅ Decode ID token to extract Cognito groups
    const decoded: DecodedToken = jwtDecode(idTokenString);
    const role = decoded["cognito:groups"]?.[0] || "None";

    // ✅ Protect Admin Route
    if (req.nextUrl.pathname.startsWith("/admin") && role !== "SystemAdmin") {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    // ✅ Protect Dashboard Route (OrgAdmin & OrgUser only)
    if (req.nextUrl.pathname.startsWith("/dashboard") && !["OrgAdmin", "OrgUser"].includes(role)) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

  } catch (error) {
    console.error("Middleware Auth Error:", error);
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  return NextResponse.next();
}
