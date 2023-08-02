import { SlashCommand } from "../models/SlashCommand";
import verificationEmbed from "./embed/verificationEmbed";
import grouprole from "./grouprole/grouprole";
import rankrole from "./rankrole/rankrole";
import unverifiedRole from "./role/unverifiedRole";
import verifiedRole from "./role/verifiedRole";

export const DiscordCommands = [
  grouprole,
  rankrole,
  verificationEmbed,
  verifiedRole,
  unverifiedRole,
] as SlashCommand[];
