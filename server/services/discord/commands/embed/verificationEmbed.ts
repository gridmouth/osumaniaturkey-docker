import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ColorResolvable,
  EmbedBuilder,
  ModalBuilder,
  PermissionsBitField,
  TextBasedChannel,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { SlashCommand } from "../../models/SlashCommand";
import { randomBytes } from "crypto";

const verificationEmbed = new SlashCommand(
  "embed",
  "Create a new verification embed",
  "Embed",
  false,
  undefined,
  [PermissionsBitField.Flags.Administrator],
  true
);

verificationEmbed.builder.addChannelOption((o) =>
  o
    .setName("channel")
    .setDescription("Channel to send the embed")
    .addChannelTypes(
      ChannelType.GuildAnnouncement,
      ChannelType.GuildForum,
      ChannelType.GuildText
    )
    .setRequired(true)
);

verificationEmbed.setExecuteFunction(async (command) => {
  const handshakeId = randomBytes(10).toString("hex");
  const embedContentModal = new ModalBuilder()
    .setTitle("New Verification Embed")
    .setCustomId(handshakeId);

  const embedTitleInputField = textInputRow(
    new TextInputBuilder()
      .setLabel("Embed Title")
      .setValue("✅ Account Verification")
      .setRequired(true)
      .setCustomId("title")
      .setStyle(TextInputStyle.Short)
  );
  const embedDescriptionInputField = textInputRow(
    new TextInputBuilder()
      .setLabel("Embed Description")
      .setValue(
        "To get full access to the server, click on the button below and verify your account"
      )
      .setRequired(true)
      .setCustomId("description")
      .setStyle(TextInputStyle.Paragraph)
  );
  const embedColorInputField = textInputRow(
    new TextInputBuilder()
      .setLabel("Embed Title")
      .setValue("#4ebc7f")
      .setRequired(true)
      .setCustomId("color")
      .setStyle(TextInputStyle.Short)
  );
  const embedButtonTextInputField = textInputRow(
    new TextInputBuilder()
      .setLabel("Button Text")
      .setRequired(false)
      .setValue("Start verification")
      .setCustomId("button")
      .setMaxLength(25)
      .setStyle(TextInputStyle.Short)
  );
  const embedImageInputField = textInputRow(
    new TextInputBuilder()
      .setLabel("Embed Small Image")
      .setRequired(false)
      .setCustomId("image")
      .setStyle(TextInputStyle.Short)
  );

  embedContentModal.addComponents(
    embedTitleInputField,
    embedDescriptionInputField,
    embedColorInputField,
    embedButtonTextInputField,
    embedImageInputField
  );

  function textInputRow(textInput: TextInputBuilder) {
    return new ActionRowBuilder<TextInputBuilder>().setComponents(textInput);
  }

  await command.showModal(embedContentModal);
  const modalData = await command.awaitModalSubmit({
    filter: (modal) => modal.customId == handshakeId,
    time: 300000,
  });

  await modalData.deferUpdate();

  const modalResponseTitle = modalData.fields.getTextInputValue("title");
  const modalResponseDescription =
    modalData.fields.getTextInputValue("description");
  const modalResponseColor = modalData.fields.getTextInputValue("color");
  const modalResponseImage = modalData.fields.getTextInputValue("image");
  const modalResponseButtonText = modalData.fields.getTextInputValue("button");

  const responseEmbed = new EmbedBuilder()
    .setTitle(modalResponseTitle)
    .setDescription(modalResponseDescription)
    .setColor("#4ebc7f");

  // Check if the input is a valid hex color input
  if (modalResponseColor.trim() != "") {
    const hexValueRegExp = /^#([0-9a-f]{3}){1,2}$/i;

    if (modalResponseColor) {
      if (hexValueRegExp.test(modalResponseColor.toUpperCase()))
        responseEmbed.setColor(
          modalResponseColor.toUpperCase() as ColorResolvable
        );
    }
  }

  if (modalResponseImage) {
    try {
      const url = new URL(modalResponseImage);
      responseEmbed.setThumbnail(url.href);
    } catch (e) {
      void {};
    }
  }

  const channel = command.options.getChannel(
    "channel",
    true
  ) as TextBasedChannel;

  const verifyButtonComponent = new ButtonBuilder()
    .setStyle(ButtonStyle.Secondary)
    .setLabel(modalResponseButtonText)
    .setCustomId("generateVerification");

  const verifyButton = new ActionRowBuilder<ButtonBuilder>().setComponents(
    verifyButtonComponent
  );

  channel.send({
    embeds: [responseEmbed],
    components: [verifyButton],
  });
});

export default verificationEmbed;
