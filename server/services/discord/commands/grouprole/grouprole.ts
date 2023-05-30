import { PermissionsBitField } from "discord.js";
import { SlashCommand } from "../../models/SlashCommand";
import grouproleAddGroupRole from "./grouproleAddGroupRole";
import grouproleRemoveGroupRole from "./grouproleRemoveGroupRole";

const grouprole = new SlashCommand(
  "grouprole",
  "Manage group roles",
  "GroupRole",
  false,
  undefined,
  [PermissionsBitField.Flags.Administrator]
);

grouprole.addSubcommand(grouproleAddGroupRole);
grouprole.addSubcommand(grouproleRemoveGroupRole);

export default grouprole;
