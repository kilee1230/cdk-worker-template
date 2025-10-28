/**
 * Logger Redaction Examples
 *
 * This file demonstrates how sensitive data is automatically redacted from logs.
 * Run this file to see redaction in action (not meant to be imported).
 */

import { logger } from "./logger.js";

// Example 1: Simple email field
logger.info(
  {
    username: "john_doe",
    email: "john@example.com",
  },
  "User registration"
);
// Output: {"username":"john_doe","email":"[REDACTED]"}

// Example 2: Authorization header
logger.info(
  {
    method: "POST",
    url: "/api/users",
    headers: {
      authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "content-type": "application/json",
    },
  },
  "API Request"
);
// Output: headers.authorization will be "[REDACTED]"

// Example 3: Nested email in user object
logger.info(
  {
    user: {
      id: 123,
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
    },
  },
  "User details"
);
// Output: user.email will be "[REDACTED]"

// Example 4: Multiple sensitive fields
logger.info(
  {
    action: "login",
    username: "john_doe",
    password: "MySecretPassword123!",
    token: "abc123def456",
    email: "john@example.com",
    ip: "192.168.1.1",
  },
  "User authentication"
);
// Output: password, token, and email will be "[REDACTED]", but username and ip remain

// Example 5: API Key and Secret
logger.info(
  {
    service: "external-api",
    apiKey: "sk_live_51234567890",
    secret: "whsec_1234567890",
    endpoint: "https://api.example.com/v1/resource",
  },
  "External API call"
);
// Output: apiKey and secret will be "[REDACTED]"

// Example 6: AWS Credentials (should never log these, but if you do, they'll be redacted)
logger.info(
  {
    AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE",
    AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    region: "us-east-1",
  },
  "AWS Configuration"
);
// Output: AWS_SECRET_ACCESS_KEY will be "[REDACTED]"

// Example 7: Error with sensitive data
logger.error(
  {
    error: "Authentication failed",
    email: "john@example.com",
    password: "attempted_password",
    ip: "192.168.1.1",
  },
  "Login error"
);
// Output: email and password will be "[REDACTED]"

console.log(
  "\n✅ All examples logged - check the output to see redaction in action!"
);
console.log(
  "💡 Tip: Sensitive fields are replaced with '[REDACTED]' automatically\n"
);
