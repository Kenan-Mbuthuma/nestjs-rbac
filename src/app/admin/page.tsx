"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserRole } from "@/utils/getUserRole";
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  UserType,
  AttributeType,
} from "@aws-sdk/client-cognito-identity-provider";
import { Button } from "@aws-amplify/ui-react";

// AWS values
const REGION = "eu-west-1";
const USER_POOL_ID = "eu-west-1_7mT1JdGh7";

async function createCognitoClient() {
  const { fetchAuthSession } = await import("@aws-amplify/auth");
  const session = await fetchAuthSession();
  return new CognitoIdentityProviderClient({
    region: REGION,
    credentials: session.credentials,
  });
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      const userRole = await getUserRole();
      setRole(userRole);

      if (userRole !== "SystemAdmin") {
        router.push("/auth");
        return;
      }

      try {
        const usersList = await listAllUsers();
        setUsers(usersList);
      } catch (err) {
        console.error("Error fetching users", err);
        setError("Error fetching users. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [router]);

  async function listAllUsers() {
    try {
      const client = await createCognitoClient();
      const command = new ListUsersCommand({ UserPoolId: USER_POOL_ID });
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
      }

      const addCommand = new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        GroupName: newGroup,
      });
      await client.send(addCommand);

      setUsers(
        users.map((user) =>
          user.username === username ? { ...user, group: newGroup } : user
        )
      );

      alert(`User ${username} moved to group ${newGroup}`);
    } catch (err) {
      console.error("Error updating user group:", err);
      alert("Failed to update user role.");
    }
  }

  return (
    <div>
      <h1>System Admin Dashboard</h1>
      <p>Role: {role}</p>
      {loading && <p>Loading users...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && (
        <>
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
                      onChange={(e) =>
                        updateUserGroup(user.username, user.group, e.target.value)
                      }
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
        </>
      )}
    </div>
  );
}
