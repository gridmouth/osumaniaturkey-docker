import { EmbedBuilder, PermissionsBitField } from "discord.js";
import { grouproles } from "../../../../database/database";
import { SlashCommandSubcommand } from "../../models/SlashCommandSubcommand";

const grouproleList = new SlashCommandSubcommand(
  "list",
  "List group roles",
  undefined,
  [PermissionsBitField.Flags.Administrator]
);

grouproleList.setExecuteFunction(async (command) => {
  try {
    const allRoles = await grouproles.find();

    const embed = new EmbedBuilder()
      .setTitle("📑 Verification group roles")
      .setDescription(
        allRoles.length == 0
          ? "Nothing to show here..."
          : allRoles
              .map(
                (r, i) =>
                  `- ${i + 1} <@&${r.roleId}> | ${r.group.split(",")[0]}${
                    r.group.split(",")[1].trim() == "true"
                      ? ` (Probationary)`
                      : ""
                  } | ${r.mode}`
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

export default grouproleList;
