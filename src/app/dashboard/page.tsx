"use client"; // ✅ Mark this as a Client Component

import { getCurrentUser, fetchAuthSession } from "@aws-amplify/auth"; // ✅ Correct imports for Amplify Gen 2
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode"; // ✅ Correct way to decode tokens

// Type definition for JWT decoding
interface DecodedToken {
  "cognito:groups"?: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    async function getUserRole() {
      try {
        // ✅ Fetch the current authenticated user
        const user = await getCurrentUser();

        // ✅ Fetch the authentication session to get the ID token
        const session = await fetchAuthSession();
        const idTokenString = session.tokens?.idToken?.toString() ?? "";

        if (idTokenString) {
          // ✅ Decode the token to get the user's Cognito groups
          const decoded: DecodedToken = jwtDecode(idTokenString);
          const userGroups = decoded["cognito:groups"] || [];
          const userRole = userGroups.length > 0 ? userGroups[0] : "None";

          // ✅ Redirect if user is not OrgAdmin or OrgUser
          if (!["OrgAdmin", "OrgUser"].includes(userRole)) {
            router.push("/auth");
          }

          setRole(userRole);
        }
      } catch (error) {
        router.push("/auth");
      }
    }

    getUserRole();
  }, []);

  // ✅ PayFast Test Payment Function with Console Logging of Payload
  const handlePayFastTest = async () => {
    setPaymentLoading(true);

    const payload = {
      amount: "100.00",
      item_name: "Test Item",
      return_url: "https://sustivate.com/payment/success",
      cancel_url: "https://sustivate.com/payment/cancel",
      notify_url: "https://p3oyojkfgh.execute-api.eu-west-1.amazonaws.com/api/payfast-notify",
      organization_id: "71bele33-aefb-4ec7-9f29-245c1c9eb13a",
    };

    console.log("🔄 PayFast Payload Being Sent:", JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(
        "https://p3oyojkfgh.execute-api.eu-west-1.amazonaws.com/api/payfast-payment?ffffgfg=null",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`PayFast API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ PayFast API Response:", data);

      const paymentUrl = data.payment_url;

      if (!paymentUrl) {
        alert("Payment initiation failed. Please try again.");
        return;
      }

      window.location.href = paymentUrl;
    } catch (error) {
      console.error("❌ PayFast Payment Error:", error);
      alert("Error processing PayFast payment. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Role: {role}</p>
      <p>Welcome to the company dashboard!</p>

      {/* ✅ PayFast Test Button */}
      <button
        onClick={handlePayFastTest}
        disabled={paymentLoading}
        style={{
          padding: "10px 20px",
          backgroundColor: paymentLoading ? "#ccc" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: paymentLoading ? "not-allowed" : "pointer",
          marginTop: "20px",
        }}
      >
        {paymentLoading ? "Processing..." : "Test PayFast Payment"}
      </button>
    </div>
  );
}
