import { OAuth } from "@raycast/api";
import { URLSearchParams } from "url";
import fetch from "node-fetch";
const clientId = "861926046372-4c7r0bi4ih5q7jmp9cjb97cdorpv3q90.apps.googleusercontent.com";

export const client = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.AppURI,
  providerName: "Google",
  providerIcon: "google.png",
  providerId: "google",
  description: "Connect your Google account...",
});

export async function authorize(): Promise<void> {
  const tokenSet = await client.getTokens();
  if (tokenSet?.accessToken) {
    if (tokenSet.refreshToken && tokenSet.isExpired()) {
      await client.setTokens(await refreshTokens(tokenSet.refreshToken));
    }
    return;
  }

  const authRequest = await client.authorizationRequest({
    endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    clientId: clientId,
    scope: "https://www.googleapis.com/auth/script.projects https://www.googleapis.com/auth/drive",
  });
  const { authorizationCode } = await client.authorize(authRequest);

  await client.setTokens(await fetchTokens(authRequest, authorizationCode));
}

async function fetchTokens(authRequest: OAuth.AuthorizationRequest, authCode: string): Promise<OAuth.TokenResponse> {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("code", authCode);
  params.append("verifier", authRequest.codeVerifier);
  params.append("grant_type", "authorization_code");
  params.append("redirect_uri", authRequest.redirectURI);

  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: params });
  if (!response.ok) {
    console.error("fetch tokens error:", await response.text());
    throw new Error(response.statusText);
  }

  return (await response.json()) as OAuth.TokenResponse;
}

async function refreshTokens(refreshToken: string): Promise<OAuth.TokenResponse> {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("refresh_token", refreshToken);
  params.append("grant_type", "refresh_token");

  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: params });
  if (!response.ok) {
    console.error("refresh tokens error:", await response.text());
    throw new Error(response.statusText);
  }
  const tokenResponse = (await response.json()) as OAuth.TokenResponse;
  tokenResponse.refresh_token = tokenResponse.refresh_token ?? refreshToken;
  return tokenResponse;
}

export async function runScript(): Promise<void> {
  const scriptID: string = "AKfycbxRzoBBmm6zHFvWiZFWfPd9nj3mYtliS2h8Q8Gfesp_VLcR6rBXgqwddYb_B6oHXyYq";

  const tokenSet = await client.getTokens();

  const response = await fetch(`https://script.googleapis.com/v1/scripts/${scriptID}:run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenSet?.accessToken}`,
    },
    body: JSON.stringify({
      function: "myFunction",
    }),
  });

  if (!response.ok) {
    console.error("run script error:", await response.text());
    throw new Error(response.statusText);
  }

  return;
}
