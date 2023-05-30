import { ApiResponse } from "../../server/types/generics";

export class CredentialsManager {
  constructor() {}

  storeVerificationKey(key: string) {
    localStorage["verificationKey"] = key;
  }

  getVerificationToken() {
    return localStorage["verificationKey"];
  }

  async fetchOsuOauthURL() {
    return fetch("/api/oauth/callback").then((r) => r.json());
  }

  async fetchDiscordRedirect() {
    return fetch("/api/oauth/discord").then((r) => r.json());
  }

  async postVerification(key: string, osuToken: string) {
    return fetch("/api/users/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        osuToken,
      }),
    }).then((r) => r.json()) as Promise<ApiResponse<null>>;
  }
}
