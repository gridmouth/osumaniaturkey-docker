import { PermissionsBitField } from "discord.js";
import { SlashCommandSubcommand } from "../../models/SlashCommandSubcommand";
import { rankroles } from "../../../../database/database";
import generateErrorEmbedWithTitle from "../../helpers/generateErrorEmbedWithTitle";
import { randomBytes } from "crypto";
import generateSuccessEmbed from "../../helpers/generateSuccessEmbed";

const rankroleAddRole = new SlashCommandSubcommand(
  "add",
  "Add a new rank role",
  undefined,
  [PermissionsBitField.Flags.Administrator]
);

rankroleAddRole.builder
  .addIntegerOption((o) =>
    o
      .setName("min_rank")
      .setDescription("Minimum rank")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(9999999)
  )
  .addIntegerOption((o) =>
    o
      .setName("max_rank")
      .setDescription("Maximum rank")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(9999999)
  )
  .addRoleOption((o) =>
    o.setName("role").setDescription("Role to add").setRequired(true)
  );

rankroleAddRole.setExecuteFunction(async (command) => {
  try {
    const minRank = command.options.getInteger("min_rank", true);
    const maxRank = command.options.getInteger("max_rank", true);
    const role = command.options.getRole("role", true);

    const matchingRoles = await rankroles.find({
      min: minRank,
      max: maxRank,
      roleId: role.id,
    });

    if (matchingRoles.length != 0)
      return command.editReply({
        embeds: [
          generateErrorEmbedWithTitle(
            "You can't add more than 1 role with the same parameters!"
          ),
        ],
      });

    await rankroles.create({
      _id: randomBytes(10).toString("hex"),
      min: minRank,
      max: maxRank,
      roleId: role.id,
    });

    command.editReply({
      embeds: [generateSuccessEmbed("Role added!")],
    });
  } catch (e) {
    console.error(e);
  }
});

export default rankroleAddRole;
