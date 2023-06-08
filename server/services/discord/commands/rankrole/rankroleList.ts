import { EmbedBuilder, PermissionsBitField } from "discord.js";
import { rankroles } from "../../../../database/database";
import { SlashCommandSubcommand } from "../../models/SlashCommandSubcommand";

const rankroleList = new SlashCommandSubcommand(
  "list",
  "List rank roles",
  undefined,
  [PermissionsBitField.Flags.Administrator]
);

rankroleList.setExecuteFunction(async (command) => {
  try {
    const allRoles = await rankroles.find();

    const embed = new EmbedBuilder()
      .setTitle("📑 Ranking roles")
      .setDescription(
        allRoles.length == 0
          ? "Nothing to show here..."
          : allRoles
              .map(
                (r, i) => `- ${i + 1} <@&${r.roleId}> | #${r.min} -> #${r.max}`
              )
              .join("\n")
      )
      .setColor("#4ebc7f");

    command.editReply({
      embeds: [embed],
    });
  } catch (e) {
    console.error(e);
  }
});

export default rankroleList;
