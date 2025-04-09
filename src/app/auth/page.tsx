"use client"; // ✅ Ensure this is a Client Component

import { fetchUserAttributes, fetchAuthSession, signOut } from "@aws-amplify/auth";
import { Authenticator, View, Button, useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode"; // ✅ Correct import

// Type definition for decoding JWT token
interface DecodedToken {
  "cognito:groups"?: string[];
}

export default function AuthPage() {
  return (
    <Authenticator.Provider> {/* ✅ Wrap everything inside Authenticator.Provider */}
      <AuthContent />
    </Authenticator.Provider>
  );
}

// ✅ Extract main logic into a separate component to avoid hydration issues
function AuthContent() {
  const router = useRouter();
  const { user } = useAuthenticator((context) => [context.user]);
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        if (user) {
          // Fetch user attributes (email)
          const attributes = await fetchUserAttributes();
          setEmail(attributes.email || "Unknown");

          // ✅ Fetch Auth Session to get the ID token
          const session = await fetchAuthSession();
          const idTokenString = session.tokens?.idToken?.toString() ?? ""; // ✅ Extract token as string

          if (idTokenString) {
            // ✅ Decode token correctly
            const decoded: DecodedToken = jwtDecode(idTokenString);
            const userGroups = decoded["cognito:groups"] || [];
            setRole(userGroups.length > 0 ? userGroups[0] : "None");
          }
        }
      } catch (error) {
        console.error("Error fetching user attributes", error);
      }
    }

    fetchUserInfo();
  }, [user]);

  return (
    <View>
      {!user ? (
        <Authenticator />
      ) : (
        <View>
          <h1>Welcome, {user.username}!</h1>
          <p>Email: {email}</p>
          <p>Role: {role}</p>

          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
          {role === "SystemAdmin" && (
            <Button onClick={() => router.push("/admin")}>Go to Admin Panel</Button>
          )}
          <Button onClick={() => signOut()}>Sign Out</Button>
        </View>
      )}
    </View>
  );
}
