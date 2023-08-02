import { randomBytes } from "crypto";
import {
  ActionRowBuilder,
  EmbedBuilder,
  InteractionCollector,
  PermissionsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from "discord.js";

import generateErrorEmbedWithTitle from "../../helpers/generateErrorEmbedWithTitle";
import generateSuccessEmbed from "../../helpers/generateSuccessEmbed";
import { SlashCommandSubcommand } from "../../models/SlashCommandSubcommand";
import { unverifiedroles } from "../../../../database/database";

const unverifiedRoleRemoveRole = new SlashCommandSubcommand(
  "remove",
  "Remove a role",
  undefined,
  [PermissionsBitField.Flags.Administrator]
);

unverifiedRoleRemoveRole.setExecuteFunction(async (command) => {
  try {
    if (!command.guild) return;

    const allRoles = await unverifiedroles.find();

    if (allRoles.length < 1)
      return command.editReply({
        embeds: [generateErrorEmbedWithTitle("There's no roles to remove!")],
      });

    const handshakeId = randomBytes(10).toString("hex");
    const menu = new StringSelectMenuBuilder()
      .setMinValues(1)
      .setMaxValues(allRoles.length)
      .setPlaceholder("Select Roles")
      .setCustomId(handshakeId);

    for (const role of allRoles) {
      const roleData = await command.guild.roles.fetch(role._id);

      if (!roleData)
        await unverifiedroles.deleteOne({
          _id: role._id,
        });

      if (roleData)
        menu.addOptions({
          label: `@${roleData.name}`,
          value: role._id,
        });
    }

    const embed = new EmbedBuilder()
      .setTitle("Select Roles")
      .setDescription("You can select multiple roles at the same time!")
      .setFooter({
        text: "You have 1 minute to select",
      })
      .setColor("#4ebc7f");

    const menuRow =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

    await command.editReply({
      embeds: [embed],
      components: [menuRow],
    });

    const collector = new InteractionCollector(command.client, {
      filter: (menu) =>
        menu.user.id == command.user.id && menu.customId == handshakeId,
    });

    collector.on("collect", async (menu: StringSelectMenuInteraction) => {
      try {
        await menu.deferUpdate();

        const roles = menu.values;

        collector.stop();

        for (const role of roles) {
          await unverifiedroles.deleteOne({ _id: role });
        }

        command.editReply({
          components: [],
          embeds: [generateSuccessEmbed("Roles removed!")],
        });
      } catch (e) {
        console.error(e);
      }
    });
  } catch (e) {
    console.error(e);
  }
});

export default unverifiedRoleRemoveRole;
