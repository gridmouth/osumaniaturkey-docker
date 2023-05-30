import { EmbedBuilder } from "discord.js";

export default (title: string, response?: string): EmbedBuilder => {
  return new EmbedBuilder({
    title: title,
    description: response || "There was an error executing this operation.",
  }).setColor("#4ebc7f");
};
