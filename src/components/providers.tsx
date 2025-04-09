"use client"; // Ensure it's a client component

import { Amplify } from "aws-amplify";
import awsExports from "../aws-exports";

Amplify.configure(awsExports);

export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
