// src/lib/configureAmplify.ts

import { Amplify } from "aws-amplify";
import type { ResourcesConfig } from "@aws-amplify/core";

export function configureAmplify() {
  if (process.env.NODE_ENV === "development" || process.env.CI === "true") {
    const dummyConfig: ResourcesConfig = {
      Auth: {
        Cognito: {
          userPoolId: "us-east-1_mock",
          userPoolClientId: "mockclientid",
          loginWith: {
            username: true,
          },
        },
      },
    };

    Amplify.configure(dummyConfig);
    console.log("✅ Amplify configured with dummy config");
  } else {
    try {
      // Use require here because it's synchronous and compatible with .ts or .js
      // @ts-ignore
      const awsExports = require("../aws-exports").default;
      Amplify.configure(awsExports);
      console.log("✅ Amplify configured with aws-exports.js");
    } catch (err) {
      console.warn("⚠️ Failed to load aws-exports.js for Amplify:", err);
    }
  }
}
