import { QueryWithHelpers } from "mongoose";
import { OsuApi } from "../osu/OsuApi";
import status from "statuses";
import { User } from "../../types/user";
import { Discord } from "../../server";
import { LoggerService } from "../../helpers/LoggerService";
import {
  grouproles,
  rankroles,
  unverifiedroles,
  users,
  verifications,
  verifiedroles,
} from "../../database/database";
import { GuildMember } from "discord.js";
import { randomBytes } from "crypto";

export interface IVerification {
  _id: string;
  userId: string;
  key: string;
}

export async function syncAllMembers() {
  const logger = new LoggerService("MembersSync");

  try {
    logger.printInfo("Starting members sync...");

    const osuApi = new OsuApi();
    const targetGuild = await Discord.guilds.fetch(process.env.DISCORD_GUILD);
    const allMembers = await targetGuild.members.list({ limit: 1000 });
    const allMembersProfiles = await osuApi.fetchAllMembersProfiles(
      Array.from(allMembers.values())
    );

    for (const member of allMembers.map((m) => m)) {
      const userDatabase = await users.findById(member.id);

      if (userDatabase && userDatabase.osuId) {
        const verification = new VerificationManager({
          member,
        });

        const userOsuProfile = allMembersProfiles.find(
          (p) => p.id == userDatabase.osuId
        );

        if (userOsuProfile) {
          verification.setUser(userOsuProfile);
          verification.validateUser(true);
        }
      }
    }

    logger.printSuccess("All members synced");

    setTimeout(syncAllMembers, 8.64e7); // 24h
  } catch (e) {
    logger.printError("Can't sync members:");
    console.error(e);

    setTimeout(syncAllMembers, 10000); // 24h
  }
}

export class VerificationManager {
  private verification: QueryWithHelpers<unknown, {}, IVerification>;
  private osuCode: string;
  private user!: User;
  private member!: GuildMember;
  private osuApi: OsuApi;
  private Logger = new LoggerService("VerificationManager");

  constructor({
    member,
    verification,
    osuCode,
  }: {
    member?: GuildMember;
    verification?: QueryWithHelpers<unknown, {}, IVerification>;
    osuCode?: string;
  }) {
    if (verification && osuCode) {
      this.verification = verification;
      this.osuCode = osuCode;
    }

    if (member) this.member = member;

    this.osuApi = new OsuApi(this.osuCode);
  }

  public static async createNewVerificationToken(member: GuildMember) {
    try {
      const Logger = new LoggerService("VerificationManager");

      Logger.printInfo(
        `Generating new verification token for ${member.user.tag}`
      );

      let databaseUser = await users.findById(member.id);

      if (!databaseUser)
        databaseUser = await users.create({
          _id: member.id,
          osuId: 0,
          createdAt: new Date(),
        });

      if (!databaseUser)
        return {
          status: 404,
          statusText: status.message[404],
          data: null,
        };

      const currentPendingVerification = await verifications.findOne({
        userId: member.id,
      });

      if (currentPendingVerification)
        return {
          status: 200,
          statusText: status.message[200],
          data: currentPendingVerification as IVerification,
        };

      const newVerifcation = await verifications.create({
        _id: randomBytes(10).toString("hex"),
        key: randomBytes(16).toString("hex"),
        userId: member.id,
      });

      return {
        status: 200,
        statusText: status.message[200],
        data: newVerifcation as IVerification,
      };
    } catch (e) {
      console.error(e);

      return {
        status: 500,
        statusText: status.message[500],
        data: null,
      };
    }
  }

  setUser(user: User) {
    this.user = user;

    return this;
  }

  async validateUser(isStatic?: boolean) {
    try {
      if (!this.member) await this.fetchMember();

      if (!isStatic) {
        const osuUser = await this.validateOsuUser();
        if (osuUser.status != 200) return osuUser;
      }

      const syncUsername = await this.syncUsername();
      if (syncUsername.status != 200) return syncUsername;

      const groupRoles = await this.syncUsergroupRoles();
      if (groupRoles.status != 200) return groupRoles;

      const rankRoles = await this.addRankRoles();
      if (rankRoles.status != 200) return rankRoles;

      const verifiedRoles = await this.addVerifiedRoles();
      if (verifiedRoles.status != 200) return verifiedRoles;

      const unverifiedRoles = await this.removeUnverifiedRoles();
      if (unverifiedRoles.status != 200) return unverifiedRoles;

      if (!isStatic)
        await verifications.deleteOne({ _id: this.verification._id });

      try {
        await users.findByIdAndUpdate(this.member.id, {
          $set: { osuId: this.user.id },
        });
      } catch (e) {
        console.error(e);
      }

      return this.handleResponse(200);
    } catch (e) {
      console.error(e);

      return this.handleResponse(500);
    }
  }

  async removeUnverifiedRoles() {
    try {
      this.Logger.printInfo("Removing unverified roles");

      const rolesToRemove = await unverifiedroles.find();

      for (const role of rolesToRemove) {
        try {
          await this.member.roles.remove(role._id);

          this.Logger.printSuccess(
            `Removed unverified role ${role._id} from ${this.member.user.username}`
          );
        } catch (e) {
          this.Logger.printError(
            `Cannot remove unverified role ${role._id}: `,
            e
          );
        }
      }

      return this.handleResponse(200);
    } catch (e) {
      this.Logger.printError("Cannot remove unverified roles: ", e);

      this.handleResponse(500);
    }
  }

  async validateOsuUser() {
    try {
      this.Logger.printInfo(`Validating osu!user`);
      await this.osuApi.validateOauthToken();

      const userResponse = await this.osuApi.fetchMe();

      if (userResponse.status == 200) {
        this.user = userResponse.data;
      }

      this.Logger.printSuccess(`osu!user validated!`);

      return this.handleResponse(200);
    } catch (e) {
      console.error(e);

      return this.handleResponse(500);
    }
  }

  async syncUsername() {
    try {
      this.Logger.printInfo(`Syncing username`);

      await this.member.setNickname(this.user.username);

      this.Logger.printSuccess(`Username set!`);

      return this.handleResponse(200);
    } catch (e) {
      console.error(e);

      return this.handleResponse(500);
    }
  }

  async addVerifiedRoles() {
    try {
      this.Logger.printInfo(`Adding verified roles`);

      const allRoles = await verifiedroles.find();

      for (const role of allRoles) {
        try {
          await this.member.roles.add(role._id);
        } catch (e) {
          this.Logger.printError(`Cannot add role ${role._id}: `, e);
        }
      }

      this.Logger.printSuccess(`Verified roles added!`);
      return this.handleResponse(200);
    } catch (e) {
      console.error(e);

      return this.handleResponse(500);
    }
  }

  async addRankRoles() {
    try {
      this.Logger.printInfo(`Adding rank roles`);

      const rankRoles = await rankroles.find();

      await this.member.fetch(true);

      for (const role of rankRoles) {
        if (
          this.user.statistics_rulesets.mania &&
          this.user.statistics_rulesets.mania.global_rank &&
          role.roleId &&
          this.user.is_active
        ) {
          if (
            this.user.statistics_rulesets.mania.global_rank >= (role.min || 0) &&
            this.user.statistics_rulesets.mania.global_rank <= (role.max || 0)
          ) {
            await this.member.roles.add(role.roleId);
          } else {
            this.member.roles.remove(role.roleId).catch(() => void {});
          }
        }
      }

      this.Logger.printSuccess(`Rank roles added!`);
      return this.handleResponse(200);
    } catch (e) {
      console.error(e);

      return this.handleResponse(500);
    }
  }

  async syncUsergroupRoles() {
    try {
      this.Logger.printInfo(`Adding usergroup roles`);

      const groupRoles = await grouproles.find();

      for (const role of groupRoles) {
        const roleParameters = {
          group: role.group?.split(",")[0] || "",
          probationary: role.group?.split(",")[1] == "true",
          mode: role.mode || "",
          roleId: role.roleId || "",
        };

        if (this.user.groups) {
          const targetGroupForThisRole = this.user.groups.find((g) => {
            if (
              g.short_name != roleParameters.group ||
              (g.has_playmodes && roleParameters.mode == "none")
            )
              return false;

            if (g.has_playmodes) {
              if (!g.playmodes.includes(roleParameters.mode)) return false;
            }

            return true;
          });

          if (targetGroupForThisRole)
            await this.member.roles.add(roleParameters.roleId);
        }
      }

      this.Logger.printSuccess(`Usergroup roles added!`);

      return this.handleResponse(200);
    } catch (e) {
      console.error(e);

      return this.handleResponse(500);
    }
  }

  async fetchMember() {
    try {
      this.Logger.printInfo(`Fetching member`);

      const guild = await Discord.guilds.fetch(process.env.DISCORD_GUILD);

      if (!guild) {
        this.Logger.printError("Base guild not found!");
        return this.handleResponse<GuildMember>(404);
      }

      const member = await guild.members.fetch(this.verification.userId);

      if (!member) {
        this.Logger.printError("Member not found!");
        return this.handleResponse<GuildMember>(404);
      }

      this.member = member;

      this.Logger.printSuccess(`Member found!`);

      return this.handleResponse<undefined>(200);
    } catch (e) {
      console.error(e);

      return this.handleResponse<undefined>(500);
    }
  }

  handleResponse<T>(code: number, data?: any) {
    return {
      status: code,
      statusText: status.message[code],
      data: (data as T) || null,
    };
  }
}
