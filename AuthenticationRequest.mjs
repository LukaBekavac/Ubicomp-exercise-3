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
    // Get id and secret
    const idInfo = await getSecret();
    console.log("*** The secret and id are: ", idInfo);

    // Get token and key
    const [dpopKey, accessToken] = await getToken(idInfo[0], idInfo[1]);
    console.log("*** The token and DPoP key are: ", accessToken, dpopKey);

    // Create an authenticated fetch function
    const authFetch = await buildAuthenticatedFetch(fetch, accessToken, { dpopKey });


    try {
        const response = await authFetch('https://solid.interactions.ics.unisg.ch/LukaBPod/.acl');
        const responseData = await response.text();
        console.log("*** Authenticated Fetch Data: ", responseData);
    } catch (error) {
        console.error("Error with authenticated fetch:", error.message);
    }


    /*
    try {
        const aclData = await getACL('https://solid.interactions.ics.unisg.ch/LukaBPod/.acl', accessToken, dpopKey);
        console.log("*** ACL Data: ", aclData);
    } catch (error) {
        console.error("Error fetching ACL:", error.message);
    }

     */
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


runAsyncFunctions()