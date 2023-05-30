import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";
import { SlashCommandSubcommand } from "./SlashCommandSubcommand";
import { LoggerService } from "../../../helpers/LoggerService";

export class SlashCommandSubcommandGroup {
  private commands: SlashCommandSubcommand[] = [];
  public builder = new SlashCommandSubcommandGroupBuilder();
  private Logger = new LoggerService("SlashCOmmandSubCommandGroup");

  constructor(name: string, description: string) {
    this.builder.setName(name);
    this.builder.setDescription(description);
  }

  addCommand(subcommand: SlashCommandSubcommand) {
    this.commands.push(subcommand);
    this.builder.addSubcommand(subcommand.builder);

    return this;
  }

  get subcommands() {
    return this.commands;
  }

  runCommand(interaction: ChatInputCommandInteraction, subcommand: string) {
    const target = this.commands.find((c) => c.builder.name == subcommand);

    if (!target) return;

    this.Logger.printInfo(
      `Executing command ${interaction.commandName} ${this.builder.name} ${target.builder.name}`
    );

    target.run(interaction);
  }
}
