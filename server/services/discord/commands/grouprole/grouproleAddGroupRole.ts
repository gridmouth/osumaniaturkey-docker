import { PermissionsBitField } from "discord.js";
import { SlashCommandSubcommand } from "../../models/SlashCommandSubcommand";
import { grouproles } from "../../../../database/database";
import generateErrorEmbedWithTitle from "../../helpers/generateErrorEmbedWithTitle";
import generateSuccessEmbed from "../../helpers/generateSuccessEmbed";
import { randomBytes } from "crypto";

const grouproleAddGroupRole = new SlashCommandSubcommand(
  "add",
  "Add a new role",
  undefined,
  [PermissionsBitField.Flags.Administrator]
);

grouproleAddGroupRole.builder
  .addStringOption((o) =>
    o
      .setName("group")
      .setDescription("Target Group")
      .setRequired(true)
      .addChoices(
        {
          name: "NAT",
          value: "NAT,false",
        },
        {
          name: "BN",
          value: "BN,false",
        },
        {
          name: "BN (Probation)",
          value: "BN,true",
        },
        {
          name: "GMT",
          value: "GMT,false",
        },
        {
          name: "LVD",
          value: "LVD,false",
        },
        {
          name: "Beatmap Spotlight Curators",
          value: "BSC,false",
        },
        {
          name: "Alumni",
          value: "ALM,false",
        }
      )
  )
  .addStringOption((o) =>
    o
      .setName("mode")
      .setDescription("Filter mode")
      .setRequired(true)
      .addChoices(
        {
          name: "none",
          value: "none",
        },
        {
          name: "osu!",
          value: "osu",
        },
        {
          name: "taiko",
          value: "taiko",
        },
        {
          name: "catch",
          value: "fruits",
        },
        {
          name: "mania",
          value: "mania",
        }
      )
  )
  .addRoleOption((o) =>
    o.setName("target_role").setDescription("Role to add").setRequired(true)
  );

grouproleAddGroupRole.setExecuteFunction(async (command) => {
  try {
    const group = command.options.getString("group", true);
    const mode = command.options.getString("mode", true);
    const role = command.options.getRole("target_role", true);

    const currentGroupRole = await grouproles.find({
      roleId: role.id,
      usergroup: group,
      mode: mode,
    });

    if (currentGroupRole.length != 0)
      return command.editReply({
        embeds: [
          generateErrorEmbedWithTitle(
            "You can't more than one role with the same parameters!"
          ),
        ],
      });

    await grouproles.create({
      _id: randomBytes(20).toString("hex"),
      mode,
      group,
      roleId: role.id,
    });

    return command.editReply({
      embeds: [generateSuccessEmbed("Role added!")],
    });
  } catch (e) {
    console.error(e);
  }
});

export default grouproleAddGroupRole;
