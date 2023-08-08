import axios, { AxiosResponse } from "axios";
import { User } from "../../types/user";
import { OAuthAccessToken } from "../../types/oauth_access_token";
import { LoggerService } from "../../helpers/LoggerService";
import { GuildMember } from "discord.js";
import { users } from "../../database/database";
import status from "statuses";
import { ApiResponse } from "../../types/generics";
import { stringify } from "querystring";

export class OsuApi {
  private code: string;
  private access_token: string = "";
  public Logger = new LoggerService("OsuApi");

  constructor(code?: string) {
    if (code) this.code = code;
  }

  async validateOauthToken() {
    const token = (await axios("https://osu.ppy.sh/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: stringify({
        client_id: process.env.OSU_CLIENT_ID,
        client_secret: process.env.OSU_CLIENT_SECRET,
        code: this.code,
        grant_type: "authorization_code",
        redirect_uri: process.env.OSU_CALLBACK_URL,
      }),
    })) as AxiosResponse<OAuthAccessToken>;

    this.access_token = token.data.access_token;
  }

  async startTokenGeneration() {
    const Logger = new LoggerService("OsuApi: Token");
    try {
      const token = (await axios("https://osu.ppy.sh/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          client_id: process.env.OSU_CLIENT_ID,
          client_secret: process.env.OSU_CLIENT_SECRET,
          grant_type: "client_credentials",
          scope: "public",
        }),
      })) as AxiosResponse<OAuthAccessToken>;

      if (token.status == 200) {
        Logger.printSuccess("Token refreshed!");
        process.env.OSU_TOKEN = token.data.access_token;

        setTimeout(
          this.startTokenGeneration.bind(this),
          token.data ? token.data.expires_in * 1000 : 30000
        );
      } else {
        Logger.printSuccess("Error during token refresh");
      }
    } catch (e) {
      console.error(e);
    }
  }

  async fetchAllMembersProfiles(members: GuildMember[]) {
    let responseData = [] as User[];
    const memberChunks = [] as GuildMember[][];

    members = members.filter((m) => m.user.bot == false);

    while (members.length > 0) memberChunks.push(members.splice(0, 50)); // Every chunk has 50 members

    for (const chunk of memberChunks) {
      const chunkResponse = await this.fetchChunk(chunk);

      if (chunkResponse.status == 200 && chunkResponse.data) {
        responseData = responseData.concat(chunkResponse.data.users);
      }

      await (() => new Promise((resolve) => setTimeout(resolve, 5000)))();
    }

    return responseData;
  }

  private async fetchChunk(chunk: GuildMember[]) {
    try {
      const usersList = new URLSearchParams();

      for (const member of chunk) {
        const userDatabase = await users.findById(member.id);

        if (userDatabase && userDatabase.osuId) {
          usersList.append("ids[]", userDatabase.osuId.toString());
        }
      }

      const fetchResponse = await this.fetchUsers(usersList);

      return fetchResponse;
    } catch (e) {
      console.error(e);

      return {
        status: 500,
        statusText: status.message[500],
        data: null,
      };
    }
  }

  fetchUsers(ids: URLSearchParams) {
    const url = new URL("https://osu.ppy.sh/api/v2/users");
    ids.getAll("ids[]").map((p) => url.searchParams.append("ids[]", p));

    return axios(url.href, {
      headers: {
        Authorization: `Bearer ${process.env.OSU_TOKEN}`,
      },
    }) as Promise<ApiResponse<{ users: User[] }>>;
  }

  fetchMe() {
    return axios("https://osu.ppy.sh/api/v2/me", {
      headers: {
        Authorization: `Bearer ${this.access_token}`,
      },
    }) as Promise<AxiosResponse<User>>;
  }
}
