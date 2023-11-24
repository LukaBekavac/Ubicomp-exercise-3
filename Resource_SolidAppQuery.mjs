import { createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { buildAuthenticatedFetch } from '@inrupt/solid-client-authn-core';
import * as fs from 'fs';

//import fetch from "node-fetch";
import fetch from 'cross-fetch';
import { QueryEngine } from '@comunica/query-sparql-solid';
import { Session } from '@inrupt/solid-client-authn-node';



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
 //   console.log("*** The secret and id are: ", idInfo);

    // Get token and key
    const [dpopKey, accessToken] = await getToken(idInfo[0], idInfo[1]);
 //   console.log("*** The token and DPoP key are: ", accessToken, dpopKey);

    // Create an authenticated fetch function
    const authFetch = await buildAuthenticatedFetch(fetch, accessToken, { dpopKey });

    // Example use of authFetch
    try {
        const response = await authFetch('https://solid.interactions.ics.unisg.ch/LukaBPod/.acl');
        const responseData = await response.text();
//        console.log("*** Authenticated Fetch Data: ", responseData);
    } catch (error) {
        console.error("Error with authenticated fetch:", error.message);
    }

    // URLs of the .acl files for both containers
    const gazeDataAclUrl = `${baseUrl}gazeData/.acl`;
    const testAclUrl = `${baseUrl}test/.acl`;


    // Fetch and display the content of the .acl files

    const gazeDataAclContent = await getResourceContent(authFetch, gazeDataAclUrl);
    if (gazeDataAclContent !== null) {
  //      console.log("*** ACL for gazeData: ", gazeDataAclContent);


    }



    const testAclContent = await getResourceContent(authFetch, testAclUrl);
    if (testAclContent !== null) {
 //       console.log("*** ACL for test: ", testAclContent);
    }





    // add occupation to profile card
    const profileCardUrl = `${baseUrl}profile/card#me`;

    const occupationTriple = `
    <https://solid.interactions.ics.unisg.ch/LukaBPod/profile/card#me> <https://ics.unisg.ch#hasOccupation> <https://ics.unisg.ch#technician> .
`;

   // await updateProfileCard(authFetch, profileCardUrl, occupationTriple);

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
async function updateProfileCard(authFetch, profileCardUrl, occupationTriple) {
    try {
        const n3PatchData = `
            @prefix acl: <http://www.w3.org/ns/auth/acl#>.
            @prefix solid: <http://www.w3.org/ns/solid/terms#>.
            @prefix ics: <https://ics.unisg.ch#>.
            _:bnode a solid:InsertDeletePatch;
            solid:inserts {
                ${occupationTriple}
            }.`;

        console.log("Sending PATCH request to:", profileCardUrl);
        console.log("N3 Patch Data:", n3PatchData);

        const response = await authFetch(profileCardUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'text/n3'
            },
            body: n3PatchData
        });

        if (!response.ok) {
            const responseBody = await response.text();
            console.error(`Error updating profile card: ${response.status}, Server response: ${responseBody}`);
            throw new Error(`Error updating profile card: ${response.status}`);
        }

        console.log("Profile card updated successfully.");
    } catch (error) {
        console.error("Error updating profile card:", error.message);
    }
}





runAsyncFunctions()