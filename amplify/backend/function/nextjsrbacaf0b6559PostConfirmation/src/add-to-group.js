const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminAddUserToGroupCommand,
  GetGroupCommand,
  CreateGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const cognitoIdentityServiceProvider = new CognitoIdentityProviderClient({});

/**
 * @type {import('@types/aws-lambda').PostConfirmationTriggerHandler}
 */
exports.handler = async (event) => {
  const userEmail = event.request.userAttributes.email; // Get user's email
  const userPoolId = event.userPoolId;
  const userDomain = userEmail.split("@")[1]; // Extract domain
  let userGroup = "OrgUser"; // Default group

  console.log(`Processing sign-up for: ${userEmail}`);

  // ✅ Prim-U SystemAdmin check
  if (userEmail.endsWith("@prim-u.com")) {
    userGroup = "SystemAdmin";
  } else {
    console.log(`Checking if OrgAdmin exists for domain: ${userDomain}`);

    // ✅ Fetch all users and check for an existing OrgAdmin manually
    try {
      let paginationToken;
      let hasOrgAdmin = false;

      do {
        const listUsersParams = {
          UserPoolId: userPoolId,
          Limit: 60, // Adjust as needed
        };

        const listUsersResponse = await cognitoIdentityServiceProvider.send(
          new ListUsersCommand(listUsersParams)
        );

        // ✅ Check if any user from the same domain is an OrgAdmin
        for (const user of listUsersResponse.Users) {
          const emailAttr = user.Attributes.find((attr) => attr.Name === "email");
          const groupAttr = user.Attributes.find((attr) => attr.Name === "cognito:groups");

          if (emailAttr && emailAttr.Value.endsWith(`@${userDomain}`)) {
            console.log(`Found user from same domain: ${emailAttr.Value}`);

            if (groupAttr && groupAttr.Value === "OrgAdmin") {
              console.log(`Existing OrgAdmin found: ${emailAttr.Value}`);
              hasOrgAdmin = true;
              break;
            }
          }
        }

        paginationToken = listUsersResponse.PaginationToken;
      } while (paginationToken && !hasOrgAdmin);

      if (!hasOrgAdmin) {
        console.log(`No OrgAdmin found for domain ${userDomain}, assigning OrgAdmin.`);
        userGroup = "OrgAdmin";
      } else {
        console.log(`OrgAdmin already exists for domain ${userDomain}, assigning OrgUser.`);
      }
    } catch (error) {
      console.error("Error checking for existing OrgAdmin:", error);
    }
  }

  // ✅ Define Cognito group parameters
  const groupParams = {
    GroupName: userGroup,
    UserPoolId: userPoolId,
  };

  const addUserParams = {
    GroupName: userGroup,
    UserPoolId: userPoolId,
    Username: event.userName,
  };

  try {
    // ✅ Check if group exists; if not, create it
    await cognitoIdentityServiceProvider.send(new GetGroupCommand(groupParams));
  } catch (e) {
    await cognitoIdentityServiceProvider.send(new CreateGroupCommand(groupParams));
  }

  // ✅ Add user to the determined group
  await cognitoIdentityServiceProvider.send(
    new AdminAddUserToGroupCommand(addUserParams)
  );

  console.log(`✅ User ${event.userName} assigned to group: ${userGroup}`);
  return event;
};
