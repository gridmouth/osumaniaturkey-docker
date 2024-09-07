import { SlashCommand } from "../models/SlashCommand";
import verificationEmbed from "./embed/verificationEmbed";
import grouprole from "./grouprole/grouprole";
import multiEmbed from "./multiplayerping/multiplayerping";
import pingunverified from "./pingunverified/pingunverified";
import rankrole from "./rankrole/rankrole";
import unverifiedRole from "./role/unverifiedRole";
import verifiedRole from "./role/verifiedRole";

export const DiscordCommands = [
  grouprole,
  rankrole,
  verificationEmbed,
  verifiedRole,
  unverifiedRole,
  multiEmbed,
  pingunverified,
] as SlashCommand[];
