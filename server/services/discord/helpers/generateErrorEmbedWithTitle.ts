import { EmbedBuilder } from "discord.js";

export default (title: string, response?: string): EmbedBuilder => {
  return new EmbedBuilder({
    title: title,
    description: response || "İşlem sırasında bir hata çıktık.",
  }).setColor("#4ebc7f");
};
