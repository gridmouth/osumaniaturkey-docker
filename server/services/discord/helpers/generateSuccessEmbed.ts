import { EmbedBuilder } from "discord.js";

export default (title: string, response?: string): EmbedBuilder => {
  return new EmbedBuilder({
    title: title,
    description: response || "Task finished!",
  }).setColor("#4ebc7f");
};
