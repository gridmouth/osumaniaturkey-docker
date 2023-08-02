import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  GuildMember,
  PermissionResolvable,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

import { LoggerService } from "../../helpers/LoggerService";
import { DiscordCommands } from "./commands";
import generateErrorEmbedWithTitle from "./helpers/generateErrorEmbedWithTitle";
import { VerificationManager } from "../verification/handleVerification";
import { unverifiedroles, users, verifications } from "../../database/database";

export function checkMemberPermissions(
  member: GuildMember,
  permissions: PermissionResolvable[]
) {
  let pass = false;

  if (!member) return false;

  if (permissions.length == 0) return true;

  permissions.forEach((permission) => {
    if (member.permissions.has(permission)) pass = true;
  });

  return pass;
}

export class DiscordBot extends Client {
  private Logger = new LoggerService("Discord");

  constructor() {
    super({
      intents: [
        "GuildMembers",
        "GuildBans",
        "GuildModeration",
        "GuildMessages",
        "MessageContent",
        "Guilds",
      ],
    });
  }

  connect() {
    this.login(process.env.DISCORD_TOKEN)
      .then(() => {
        this.Logger.printSuccess(`Connected to discord as ${this.user?.tag}`);
        this.registerCommands();
      })
      .catch(console.error);

    this.on("interactionCreate", (command) => {
      if (command.isChatInputCommand()) {
        this.handleCommand.bind(this)(command);
        return;
      }

      if (command.isButton())
        this.handleVerificationRequest.bind(this)(command);
    });

    this.on("guildMemberAdd", this.handleMemberJoin.bind(this));
  }

  async handleMemberJoin(member: GuildMember) {
    const rolesToAdd = await unverifiedroles.find();

    for (const role of rolesToAdd) {
      await member.roles.add(role._id);

      this.Logger.printSuccess(
        `Added unverified role ${role._id} to ${member.user.username}`
      );
    }
  }

  async handleVerificationRequest(button: ButtonInteraction) {
    try {
      if (
        button.customId != "generateVerification" ||
        !button.member ||
        !button.guild
      )
        return;

      await button.deferReply({ ephemeral: true });

      const newVerification =
        await VerificationManager.createNewVerificationToken(
          button.member as GuildMember
        );

      if (!newVerification.data || newVerification.status != 200)
        return button.editReply({
          embeds: [generateErrorEmbedWithTitle("Bir şeyler ters gitti...")],
        });

      let userDatabase = await users.findById(button.user.id);

      if (!userDatabase)
        userDatabase = await users.create({
          _id: button.user.id,
          osuId: 0,
          createdAt: new Date(),
        });

      if (!userDatabase)
        return button.editReply({
          embeds: [generateErrorEmbedWithTitle("Bir şeyler ters gitti...")],
        });

      const verificationURL = `${process.env.WEBSITE_DOMAIN}/authorize?key=${newVerification.data.key}`;
      const embed = new EmbedBuilder()
        .setTitle("✅ Hesabını doğrula")
        .setDescription(
          `Sunucuya erişebilmek için hesabını [buradan](${verificationURL}) doğrula`
        )
        .setColor("#4ebc7f")
        .setThumbnail(button.guild.iconURL());

      const verifyButton = new ButtonBuilder()
        .setLabel("Doğrulamayı başlat")
        .setStyle(ButtonStyle.Link)
        .setURL(verificationURL);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        verifyButton
      );

      button.editReply({
        embeds: [embed],
        components: [row],
      });
    } catch (e) {
      console.error(e);

      button.editReply({
        embeds: [generateErrorEmbedWithTitle("Bir şeyler ters gitti...")],
      });
    }
  }

  async registerCommands() {
    if (!this.application) return;

    const commandsToAdd: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

    for (const command of DiscordCommands) {
      command.names.forEach((commandName) => {
        command.builder.setName(commandName);
        commandsToAdd.push(command.toJSON());
      });
    }

    await this.application.commands.set(commandsToAdd);

    this.Logger.printSuccess("Commands loaded!");
  }

  handleCommand(event: ChatInputCommandInteraction) {
    if (event.user.bot) return;

    const targetCommand = DiscordCommands.find((c) =>
      c.names.includes(event.commandName)
    );

    if (!targetCommand) return console.log("0"); // Command not found error embed

    if ((!targetCommand.allowDM && !event.channel) || !event.channel)
      return event.reply({
        embeds: [
          generateErrorEmbedWithTitle(
            "You need to run this command in a guild!"
          ),
        ],
      }); // Command error message

    if (!targetCommand.allowDM && event.channel.isDMBased())
      return event.reply({
        embeds: [
          generateErrorEmbedWithTitle(
            "You need to run this command in a guild!"
          ),
        ],
      }); // Command error message

    if (targetCommand.permissions.length != 0 && !event.member)
      return event.reply({
        embeds: [
          generateErrorEmbedWithTitle(
            "You need to run this command in a guild!"
          ),
        ],
      });

    if (
      targetCommand.permissions.length != 0 &&
      !checkMemberPermissions(
        event.member as GuildMember,
        targetCommand.permissions
      )
    ) {
      return event.reply({
        embeds: [generateErrorEmbedWithTitle("Missing permissions!")],
      });
    }

    // const jokeChance = new Chance();

    if (targetCommand.isSlashCommand() && event.isChatInputCommand()) {
      try {
        if (event.options.getSubcommand() || event.options.getSubcommandGroup())
          return targetCommand.runSubcommand(event, {
            name: event.options.getSubcommand(),
            group: event.options.getSubcommandGroup(),
          });
      } catch (e) {
        void {};
      }

      targetCommand.run(event);
    }
  }
}
