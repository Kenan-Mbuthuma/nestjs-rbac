"use client";

import { fetchAuthSession } from "@aws-amplify/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  "cognito:groups"?: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState(false); // ✅ For error tracking

  useEffect(() => {
    async function getUserRole() {
      try {
        const session = await fetchAuthSession();
        const idTokenString = session.tokens?.idToken?.toString() ?? "";

        if (idTokenString) {
          const decoded: DecodedToken = jwtDecode(idTokenString);
          const userGroups = decoded["cognito:groups"] || [];
          const userRole = userGroups.length > 0 ? userGroups[0] : "None";

          if (!["OrgAdmin", "OrgUser"].includes(userRole)) {
            router.push("/auth");
          }

          setRole(userRole);
        }
      } catch {
        router.push("/auth");
      }
    }

    getUserRole();
  }, [router]);

  const handlePayFastTest = async () => {
    setPaymentLoading(true);
    setError(false); // ✅ Reset before retry

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
      setError(true); // ✅ Show Retry UI
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <main style={{ padding: "20px" }}>
      <h1>Dashboard</h1>
      <p>Role: {role}</p>
      <p>Welcome to the company dashboard!</p>

      {/* ✅ Show Retry UI for Playwright test */}
      {error && (
        <div
          data-testid="retry-ui"
          style={{ color: "red", marginTop: "20px", border: "1px solid red", padding: "10px" }}
        >
          <p>Something went wrong. Please try again.</p>
          <button onClick={handlePayFastTest}>Retry</button>
        </div>
      )}

      {/* ✅ PayFast Button */}
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
    </main>
  );
}
