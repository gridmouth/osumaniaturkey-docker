import { PermissionsBitField } from "discord.js";
import { SlashCommand } from "../../models/SlashCommand";
import verifiedRoleAddRole from "./verifiedRoleAddRole";
import verifiedRoleRemoveRole from "./verifiedRoleRemoveRole";
import verifiedroleList from "./verifiedRoleList";

const verifiedRole = new SlashCommand(
  "verifiedrole",
  "Manage default verification roles",
  "VerificationRole",
  false,
  undefined,
  [PermissionsBitField.Flags.Administrator]
);

verifiedRole
  .addSubcommand(verifiedRoleAddRole)
  .addSubcommand(verifiedRoleRemoveRole)
  .addSubcommand(verifiedroleList);

export default verifiedRole;
