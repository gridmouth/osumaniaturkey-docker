import { PermissionsBitField } from "discord.js";
import { SlashCommand } from "../../models/SlashCommand";
import unverifiedRoleAddRole from "./unverifiedRoleAddRole";
import unverifiedRoleRemoveRole from "./unverifiedRoleRemoveRole";
import unverifiedroleList from "./unverifiedRoleList";

const unverifiedRole = new SlashCommand(
  "unverifiedrole",
  "Manage default verification roles",
  "VerificationRole",
  false,
  undefined,
  [PermissionsBitField.Flags.Administrator]
);

unverifiedRole
  .addSubcommand(unverifiedRoleAddRole)
  .addSubcommand(unverifiedRoleRemoveRole)
  .addSubcommand(unverifiedroleList);

export default unverifiedRole;
