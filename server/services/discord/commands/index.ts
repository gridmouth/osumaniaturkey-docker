import { SlashCommand } from "../models/SlashCommand";
import verificationEmbed from "./embed/verificationEmbed";
import grouprole from "./grouprole/grouprole";
import rankrole from "./rankrole/rankrole";
import verifiedRole from "./role/verifiedRole";

export const DiscordCommands = [
  grouprole,
  rankrole,
  verificationEmbed,
  verifiedRole,
] as SlashCommand[];
