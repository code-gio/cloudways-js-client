import axios from "axios";
import type { AxiosResponse } from "axios";
import type { AuthToken, GetOAuthAccessTokenRequest } from "./types";
import { HttpMethod } from "./types";

/** Configuration for the Cloudways API */
let config: GetOAuthAccessTokenRequest = {
  email: "",
  api_key: "",
};

/** Auth token and its expiration */
let authToken: AuthToken | null = null;

/**
 * Initialize the Cloudways API with user configuration.
 * @param userConfig - User configuration for Cloudways API access.
 */
export function initializeCloudwaysApi(userConfig: GetOAuthAccessTokenRequest) {
  config = userConfig;
}

/**
 * Get a new API token for authorization.
 * @throws {Error} if the configuration is incomplete.
 * @private
 */

async function getNewToken(): Promise<void> {
  if (!config.email || !config.api_key) {
    throw new Error(
      "Configuration is incomplete. Please initialize with email and api_key."
    );
  }

  try {
    const response: AxiosResponse = await axios.post(
      "https://api.cloudways.com/api/v1/oauth/access_token",
      config
    );

    authToken = {
      token: response.data.access_token,
      expiration: Date.now() + (response.data.expires_in - 300) * 1000,
    };
  } catch (error) {
    throw new Error("Error getting new token: " + error);
  }
}

/**
 * Make an API call to Cloudways API.
 * @param endpoint - The API endpoint to call.
 * @param method - The HTTP method to use (default: HttpMethod.GET).
 * @param data - The data to send in the request (if applicable).
 * @returns {Promise<any>} - Promise resolving to the API response data.
 * @throws {Error} if the API call fails.
 */
export async function apiCall(
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  data: any = null
): Promise<any> {
  if (!authToken || Date.now() >= authToken.expiration) {
    await getNewToken();
  }

  if (!authToken) {
    throw new Error("No API token available.");
  }

  try {
    const response: AxiosResponse = await axios({
      url: `https://api.cloudways.com/api/v1${endpoint}`,
      method,
      headers: {
        Authorization: `Bearer ${authToken.token}`,
      },
      data,
    });
    return response.data;
  } catch (error) {
    throw new Error("API call failed: " + error);
  }
}
