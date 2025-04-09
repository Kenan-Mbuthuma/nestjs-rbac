"use client"; // ✅ Ensure this is a Client Component

import { fetchAuthSession } from "@aws-amplify/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  UserType,
  AttributeType,
} from "@aws-sdk/client-cognito-identity-provider";
import { Button } from "@aws-amplify/ui-react";

// 🔴 Replace with your actual AWS region & Cognito User Pool ID
const REGION = "eu-west-1"; // ✅ Your AWS region
const USER_POOL_ID = "eu-west-1_7mT1JdGh7"; // ✅ Replace with actual Cognito User Pool ID

// ✅ Function to create an AWS Cognito Client using Amplify Auth credentials
async function createCognitoClient() {
  const session = await fetchAuthSession();
  return new CognitoIdentityProviderClient({
    region: REGION,
    credentials: session.credentials,
  });
}

interface DecodedToken {
  "cognito:groups"?: string[];
}

interface CognitoUser {
  username: string;
  email: string;
  group: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [role, setRole] = useState<string>("");
  const [users, setUsers] = useState<CognitoUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const session = await fetchAuthSession();
        const idTokenString = session.tokens?.idToken?.toString() ?? "";

        if (idTokenString) {
          const decoded: DecodedToken = jwtDecode(idTokenString);
          const userGroups = decoded["cognito:groups"] || [];
          const userRole = userGroups.length > 0 ? userGroups[0] : "None";

          setRole(userRole);

          if (userRole !== "SystemAdmin") {
            router.push("/auth");
            return;
          }

          const usersList = await listAllUsers();
          setUsers(usersList);
        }
      } catch (error) {
        console.error("Error fetching user role", error);
        setError("Error fetching users. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [router]); // ✅ include router in dependency array

  async function listAllUsers() {
    try {
      const client = await createCognitoClient();

      const command = new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
      });

      const response = await client.send(command);

      return (
        response.Users?.map((user: UserType) => {
          const emailAttr = user.Attributes?.find((attr: AttributeType) => attr.Name === "email");
          const groupAttr = user.Attributes?.find((attr: AttributeType) => attr.Name === "cognito:groups");

          return {
            username: user.Username || "Unknown",
            email: emailAttr?.Value || "Unknown",
            group: groupAttr?.Value || "OrgUser",
          };
        }) || []
      );
    } catch (err) {
      console.error("Error listing users:", err);
      return [];
    }
  }

  async function updateUserGroup(username: string, currentGroup: string, newGroup: string) {
    if (currentGroup === newGroup) {
      alert("User is already in this group.");
      return;
    }

    try {
      const client = await createCognitoClient();

      if (currentGroup && currentGroup !== "None") {
        const removeCommand = new AdminRemoveUserFromGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
          GroupName: currentGroup,
        });

        await client.send(removeCommand);
        console.log(`User ${username} removed from ${currentGroup}`);
      }

      const addCommand = new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        GroupName: newGroup,
      });

      await client.send(addCommand);
      alert(`User ${username} moved to group ${newGroup}`);

      setUsers(
        users.map((user) =>
          user.username === username ? { ...user, group: newGroup } : user
        )
      );
    } catch (err) {
      console.error("Error updating user group:", err);
      alert("Failed to update user role.");
    }
  }

  return (
    <div>
      <h1>System Admin Dashboard</h1>
      <p>Role: {role}</p>
      <p>Welcome, you have full system access!</p>

      {loading && <p>Loading users...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>All Users</h2>
      <table border={1} width="100%">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Group</th>
            <th>Change Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.username}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.group}</td>
              <td>
                <select
                  value={user.group}
                  onChange={(e) => updateUserGroup(user.username, user.group, e.target.value)}
                >
                  <option value="OrgUser">OrgUser</option>
                  <option value="OrgAdmin">OrgAdmin</option>
                  <option value="SystemAdmin">SystemAdmin</option>
                </select>
                <Button onClick={() => updateUserGroup(user.username, user.group, user.group)}>
                  Update
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
