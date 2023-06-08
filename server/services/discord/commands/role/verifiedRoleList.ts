import { EmbedBuilder, PermissionsBitField } from "discord.js";
import { verifiedroles } from "../../../../database/database";
import { SlashCommandSubcommand } from "../../models/SlashCommandSubcommand";

const verifiedroleList = new SlashCommandSubcommand(
  "list",
  "List roles",
  undefined,
  [PermissionsBitField.Flags.Administrator]
);

verifiedroleList.setExecuteFunction(async (command) => {
  try {
    const allRoles = await verifiedroles.find();

    const embed = new EmbedBuilder()
      .setTitle("📑 Verification roles")
      .setDescription(
        allRoles.length == 0
          ? "Nothing to show here..."
          : allRoles.map((r, i) => `- ${i + 1} <@&${r._id}>`).join("\n")
      )
      .setColor("#4ebc7f");

    command.editReply({
      embeds: [embed],
    });
  } catch (e) {
    console.error(e);
  }
});

export default verifiedroleList;
