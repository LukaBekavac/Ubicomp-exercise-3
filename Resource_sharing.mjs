import { createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { buildAuthenticatedFetch } from '@inrupt/solid-client-authn-core';
import * as fs from 'fs';

//import fetch from "node-fetch";
import fetch from 'cross-fetch';
import { userInfo } from 'os';
const getSecret = async () => {


    const response0 = await fetch('https://solid.interactions.ics.unisg.ch/idp/credentials/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // The email/password fields are those of your account.
        // The name field will be used when generating the ID of your token.
        body: JSON.stringify({ email: 'luka@bekavac.de', password: 'Ubicomp', name: 'token69' }),
    });

    // These are the identifier and secret of your token.
    // Store the secret somewhere safe as there is no way to request it again from the server!
    const { id, secret } = await response0.json();
    console.log("--This is id", id, "This is secret: ", secret);

    return [id,secret];
}

const getToken = async (id, secret) => {

    // A key pair is needed for encryption.
    // This function from `solid-client-authn` generates such a pair for you.
    const dpopKey = await generateDpopKeyPair();

    // These are the ID and secret generated in the previous step.
    // Both the ID and the secret need to be form-encoded.
    const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
    // This URL can be found by looking at the "token_endpoint" field at
    const tokenUrl = 'https://solid.interactions.ics.unisg.ch/.oidc/token';
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            // The header needs to be in base64 encoding.
            authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
            'content-type': 'application/x-www-form-urlencoded',
            dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
        },
        body: 'grant_type=client_credentials&scope=webid',
    });

    // This is the Access token that will be used to do an authenticated request to the server.
    // The JSON also contains an "expires_in" field in seconds,
    // which you can use to know when you need request a new Access token.
    const { access_token: accessToken } = await response.json();

    console.log("--This is access token:", accessToken);
    console.log("--This is dpop: ", dpopKey)

    return [dpopKey, accessToken];
}



const runAsyncFunctions = async () => {
    const baseUrl = 'https://solid.interactions.ics.unisg.ch/LukaBPod/';
    // Get id and secret
    const idInfo = await getSecret();
    console.log("*** The secret and id are: ", idInfo);

    // Get token and key
    const [dpopKey, accessToken] = await getToken(idInfo[0], idInfo[1]);
    console.log("*** The token and DPoP key are: ", accessToken, dpopKey);

    // Create an authenticated fetch function
    const authFetch = await buildAuthenticatedFetch(fetch, accessToken, { dpopKey });

    // Example use of authFetch
    try {
        const response = await authFetch('https://solid.interactions.ics.unisg.ch/LukaBPod/.acl');
        const responseData = await response.text();
        console.log("*** Authenticated Fetch Data: ", responseData);
    } catch (error) {
        console.error("Error with authenticated fetch:", error.message);
    }
    // Create containers 'gazeData' and 'test'
  //  await createContainer(authFetch, baseUrl, 'gazeData');
  //  await createContainer(authFetch, baseUrl, 'test');

  //  const gazeDataUrl = `${baseUrl}gazeData/`;
  //  const testUrl = `${baseUrl}test/`;

  //  await checkContainerExists(authFetch, gazeDataUrl);
  //  await checkContainerExists(authFetch, testUrl);

  //    await createResource(authFetch, baseUrl, 'test', 'myhobbies.txt',
  //      'My hobbies are playing Chess and working out');

    // URL of the 'myhobbies.txt' file in the 'test' container
   // const myHobbiesUrl = `${baseUrl}test/myhobbies.txt`;

    // Fetch and display the content of 'myhobbies.txt'
  //  const hobbiesContent = await getResourceContent(authFetch, myHobbiesUrl);
  //  if (hobbiesContent !== null) {
  //      console.log(hobbiesContent);
  //  }

    // Create .acl resources for the new containers
/*
    const aclContent = `# Root ACL resource for the agent account\n@prefix acl: <http://www.w3.org/ns/auth/acl#>.\n@prefix foaf: <http://xmlns.com/foaf/0.1/>.\n\n# The homepage is readable by the public\n<#public>\n    a acl:Authorization;\n    acl:agentClass foaf:Agent;\n    acl:accessTo <./>;\n    acl:mode acl:Read.\n\n# The owner has full access to every resource in their pod.\n# Other agents have no access rights,\n# unless specifically authorized in other .acl resources.\n<#owner>\n    a acl:Authorization;\n    acl:agent <https://solid.interactions.ics.unisg.ch/LukaBPod/profile/card#me>;\n    # Optional owner email, to be used for account recovery:\n    acl:agent <mailto:luka@bekavac.de>;\n    # Set the access to the root storage folder itself\n    acl:accessTo <./>;\n    # All resources will inherit this authorization, by default\n    acl:default <./>;\n    # The owner has all of the access modes allowed\n    acl:mode\n        acl:Read, acl:Write, acl:Control.`;
    await createAclResource(authFetch, baseUrl, 'gazeData', aclContent);
    await createAclResource(authFetch, baseUrl, 'test', aclContent);

 */

    // URLs of the .acl files for both containers
    const gazeDataAclUrl = `${baseUrl}gazeData/.acl`;
    const testAclUrl = `${baseUrl}test/.acl`;


    // Fetch and display the content of the .acl files

    const gazeDataAclContent = await getResourceContent(authFetch, gazeDataAclUrl);
    if (gazeDataAclContent !== null) {
        console.log("*** ACL for gazeData: ", gazeDataAclContent);


    }



    const testAclContent = await getResourceContent(authFetch, testAclUrl);
    if (testAclContent !== null) {
        console.log("*** ACL for test: ", testAclContent);
    }



    const aclUrl = `${baseUrl}test/.acl`; // URL of the .acl resource for the 'test' container
    const newRuleContent = `<#auth2lukas-ubicomp> a acl:Authorization;
acl:accessTo <https://solid.int.ics.unisg.ch/LukaBPod/test/myhobbies.txt>;
acl:mode acl:Read, acl:Write;
acl:agent <https://solid.int.ics.unisg.ch/lukas-ubicomp/profile/card#me>,
<mailto:lukas.volk@student.unisg.ch>;
acl:default <https://solid.int.ics.unisg.ch/LukaBPod/test/>.
`;

    // update the .acl file
    await addAuthorizationRule(authFetch, aclUrl, newRuleContent);


// Create 'myFriendsInfo.txt' inside 'test' container
    await createResource(authFetch, baseUrl, 'test', 'myFriendsInfo.txt', 'Content of my friends info.');

// Create 'myFamilyInfo.txt' in the Pod root
    await createResource(authFetch, baseUrl, '', 'myFamilyInfo.txt', 'Content of my family info.');

     const myFriendsURL = `${baseUrl}test/myFriendsInfo.txt`;
    // Fetch and display the content of 'myFriendsInfo.txt'
     const FriendsContent = await getResourceContent(authFetch, myFriendsURL);
      if (FriendsContent !== null) {
          console.log(FriendsContent);
      }

}


const getACL = async (aclUrl, accessToken, dpopKey) => {
    const dpopHeader = await createDpopHeader(aclUrl, 'GET', dpopKey);

    console.log("Fetching ACL from:", aclUrl);
    console.log("Access Token:", accessToken);
    console.log("DPoP Header:", dpopHeader);

    const response = await fetch(aclUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'DPoP': dpopHeader,
        },
    });

    console.log("Response Status:", response.status);
    console.log("Response Headers:", response.headers);

    if (!response.ok) {
        const responseBody = await response.text();
        console.log("Response Body:", responseBody);
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.text();
}

async function createContainer(authFetch, baseUrl, containerName) {
    const url = `${baseUrl}${containerName}/`;
    const response = await authFetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'text/turtle'
        },
        body: '' // Empty body for container creation
    });

    if (!response.ok) {
        throw new Error(`Error creating container: ${response.status}`);
    }

    console.log(`Container '${containerName}' created successfully.`);
}

async function checkContainerExists(authFetch, containerUrl) {
    try {
        const response = await authFetch(containerUrl);
        if (response.ok) {
            console.log(`Container exists at: ${containerUrl}`);
        } else {
            console.log(`Container not found at: ${containerUrl}`);
        }
    } catch (error) {
        console.error("Error checking container:", error.message);
    }
}

async function createResource(authFetch, baseUrl, containerName, resourceName, content) {
    const url = `${baseUrl}${containerName}/${resourceName}`;
    const response = await authFetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: content
    });

    if (!response.ok) {
        throw new Error(`Error creating resource: ${response.status}`);
    }

    console.log(`Resource '${resourceName}' created successfully in container '${containerName}'.`);
}

async function getResourceContent(authFetch, resourceUrl) {
    try {
        const response = await authFetch(resourceUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error("Error fetching resource:", error.message);
        return null;
    }
}

async function createAclResource(authFetch, baseUrl, containerName, aclContent) {
    const url = `${baseUrl}${containerName}/.acl`;
    const response = await authFetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'text/turtle'
        },
        body: aclContent
    });

    if (!response.ok) {
        throw new Error(`Error creating ACL resource: ${response.status}`);
    }

    console.log(`ACL resource for container '${containerName}' created successfully.`);
}

async function addAuthorizationRule(authFetch, aclUrl, newRuleContent) {
    try {
        const n3PatchData = `
            @prefix acl: <http://www.w3.org/ns/auth/acl#>.
            @prefix solid: <http://www.w3.org/ns/solid/terms#>.
            _:rename a solid:InsertDeletePatch;
            solid:inserts {
                ${newRuleContent}
            }.`;

        console.log("Sending PATCH request to:", aclUrl);
        console.log("N3 Patch Data:", n3PatchData);

        const response = await authFetch(aclUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'text/n3'
            },
            body: n3PatchData
        });

        if (!response.ok) {
            const responseBody = await response.text();
            console.error(`Error updating ACL: ${response.status}, Server response: ${responseBody}`);
            throw new Error(`Error updating ACL: ${response.status}`);
        }

        console.log("Authorization rule added successfully.");
    } catch (error) {
        console.error("Error adding authorization rule:", error.message);
    }
}


runAsyncFunctions()