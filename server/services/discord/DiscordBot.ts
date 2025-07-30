import {
  ActionRowBuilder,
  AttachmentBuilder,
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
  TextChannel,
} from "discord.js";

import { LoggerService } from "../../helpers/LoggerService";
import { DiscordCommands } from "./commands";
import generateErrorEmbedWithTitle from "./helpers/generateErrorEmbedWithTitle";
import { VerificationManager } from "../verification/handleVerification";
import { unverifiedroles, users, verifications } from "../../database/database";
import path from "path";
import { readFileSync } from "fs";

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
  public static latestMultiplayerPing = null;
  private Logger = new LoggerService("Discord");
  private static Logger = new LoggerService("Discord");

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

  public static someoneUsedMultiplayerPing() {
    DiscordBot.latestMultiplayerPing = new Date();

    return this;
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

    DiscordBot.sendEmbedIntoDms(member, true);
  }

  static async sendEmbedIntoDms(member: GuildMember, pingWhenError?: boolean) {
    const attachmet = new AttachmentBuilder(
      readFileSync(path.resolve("./public/logosmall.png")),
      { name: "logo.png" }
    );

    const responseEmbed = new EmbedBuilder()
      .setTitle("🇹🇷 osu!mania Türkiye Doğrulama ✅")
      .setDescription(
        `Sunucumuza erişmek için öncelikle osu! hesabınızı bağlamanız gerekli, doğrulama yaptıktan sonra sunucuya erişebileceksiniz.
        Lütfen aşağıdaki tuşa tıklayın ve doğrulama aşamalarını izleyin.`
      )
      .setThumbnail("attachment://logo.png")
      .setColor("#ac0600");

    // const channel = command.options.getChannel(
    //   "channel",
    //   true
    // ) as TextBasedChannel;

    const verifyButtonComponent = new ButtonBuilder()
      .setStyle(ButtonStyle.Secondary)
      .setLabel("Doğrulamayı başlat ✅")
      .setCustomId("generateVerification");

    const verifyButton = new ActionRowBuilder<ButtonBuilder>().setComponents(
      verifyButtonComponent
    );

    member
      .createDM()
      .then((dmchannel) => {
        dmchannel
          .send({
            embeds: [responseEmbed],
            files: [attachmet],
            components: [verifyButton],
          })
          .catch((e) => {
            this.Logger.printError("Cannot create dm for user", e);

            if (pingWhenError) this.sendEphemeralPing(member);
          });
      })
      .catch((e) => {
        this.Logger.printError("Cannot create dm for user", e);

        if (pingWhenError) this.sendEphemeralPing(member);
      });
  }

  private static sendEphemeralPing(member: GuildMember) {
    const channel = member.guild.channels.cache.get(
      process.env.DISCORD_CHANNEL
    );

    if (channel.isTextBased()) {
      channel.send(`<@${member.user.id}>`).then((message) => {
        setTimeout(() => message.delete(), 240);
      });
    }
  }

  async handleVerificationRequest(button: ButtonInteraction) {
    try {
      if (button.customId != "generateVerification") return;

      const guild = await this.guilds.fetch(process.env.DISCORD_GUILD);

      const member = await guild.members.fetch(button.user.id);

      await button.deferReply({ ephemeral: true });

      const newVerification =
        await VerificationManager.createNewVerificationToken(
          member as GuildMember
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
        .setColor("#ac0600")
        .setThumbnail(member.guild.iconURL());

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
