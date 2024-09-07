import { EmbedBuilder } from "discord.js";
import { DiscordBot } from "../../DiscordBot";
import { SlashCommand } from "../../models/SlashCommand";

const multiEmbed = new SlashCommand(
  "multi",
  "Multi çağırmak için kullanın. Kullanımı 5 dakika ile sınırlıdır.",
  "Friends",
  false,
  undefined,
  undefined,
  true
);

multiEmbed.builder.addStringOption((o) =>
  o.setName("mesaj").setDescription("Gönderilecek mesajınız").setRequired(true)
);

function getDifferenceInMinutes(date1: Date, date2: Date): number {
  const differenceInMilliseconds = date2.getTime() - date1.getTime();

  const differenceInMinutes = Math.floor(
    differenceInMilliseconds / (1000 * 60)
  );

  return differenceInMinutes;
}

multiEmbed.setExecuteFunction(async (command) => {
  try {
    const canExecute = () => {
      if (DiscordBot.latestMultiplayerPing == null) return true;

      const calculation = getDifferenceInMinutes(
        DiscordBot.latestMultiplayerPing,
        new Date()
      );

      if (calculation < 5) return false;

      return true;
    };

    if (canExecute()) {
      const message = command.options.getString("mesaj", true);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: command.user.username,
          iconURL: command.user.avatarURL(),
        })
        .setDescription(`Multi çağırılıyorsunuz!\n\`${message}\``);

      DiscordBot.someoneUsedMultiplayerPing();

      return command.reply({
        content: `<@&${process.env.MULTIPLAYER_ROLE_ID}>`,
        embeds: [embed],
        allowedMentions: {
          roles: [process.env.MULTIPLAYER_ROLE_ID],
        },
      });
    } else {
      const calculation = getDifferenceInMinutes(
        DiscordBot.latestMultiplayerPing,
        new Date()
      );

      return command.reply(
        `Bu komutu tekrar kullanmak için ${
          5 - calculation
        } dakika beklemeniz gerekiyor.`
      );
    }
  } catch (e) {
    return command.reply(`this bot sucks`);
  }
});

export default multiEmbed;
