import { EmbedBuilder, PermissionsBitField } from "discord.js";
import { DiscordBot } from "../../DiscordBot";
import { SlashCommand } from "../../models/SlashCommand";
import { unverifiedroles } from "../../../../database/database";

const pingunverified = new SlashCommand(
  "pingunverified",
  "i will not add a description for this cuz its obvious",
  "Admin",
  false,
  undefined,
  [PermissionsBitField.Flags.Administrator],
  true
);

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(() => resolve(true), ms));

pingunverified.setExecuteFunction(async (command) => {
  try {
    const unverifiedRoles = await unverifiedroles.find();

    const allMembers = command.guild.members.cache.filter((member) =>
      member.roles.cache.get(unverifiedRoles[0]._id)
    );

    let count = 0;
    for (const member of allMembers) {
      await DiscordBot.sendEmbedIntoDms(member[1], false);

      console.log(`Sent dm to ${count + 1}/${allMembers.size}`);

      sleep(250);

      count++;
    }

    command.editReply("Process started...");
  } catch (e) {
    return command.reply(`this bot sucks`);
  }
});

export default pingunverified;
