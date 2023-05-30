import { PermissionsBitField } from "discord.js";

import { verifiedroles } from "../../../../database/database";
import generateErrorEmbedWithTitle from "../../helpers/generateErrorEmbedWithTitle";
import generateSuccessEmbed from "../../helpers/generateSuccessEmbed";
import { SlashCommandSubcommand } from "../../models/SlashCommandSubcommand";

const verifiedRoleAddRole = new SlashCommandSubcommand(
  "add",
  "Add a new role",
  undefined,
  [PermissionsBitField.Flags.Administrator]
);

verifiedRoleAddRole.builder.addRoleOption((o) =>
  o.setName("role").setDescription("Role to add").setRequired(true)
);

verifiedRoleAddRole.setExecuteFunction(async (command) => {
  try {
    const role = command.options.getRole("role", true);

    const matchingRoles = await verifiedroles.find();

    if (matchingRoles.filter((r) => r._id == role.id).length != 0)
      return command.editReply({
        embeds: [
          generateErrorEmbedWithTitle(
            "You can't add more than 1 role with the same parameters!"
          ),
        ],
      });

    await verifiedroles.create({
      _id: role.id,
    });

    command.editReply({
      embeds: [generateSuccessEmbed("Role added!")],
    });
  } catch (e) {
    console.error(e);
  }
});

export default verifiedRoleAddRole;
