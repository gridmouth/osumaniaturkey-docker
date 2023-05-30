import { SlashCommand } from "../models/SlashCommand";
import verificationEmbed from "./embed/verificationEmbed";
import grouprole from "./grouprole/grouprole";
import rankrole from "./rankrole/rankrole";

export const DiscordCommands = [
  grouprole,
  rankrole,
  verificationEmbed,
] as SlashCommand[];
