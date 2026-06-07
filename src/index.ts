import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  type GuildMember,
  type ChatInputCommandInteraction,
  type GuildTextBasedChannel,
} from "discord.js";
import { logger } from "./lib/logger";

let activeWelcomeChannelId: string | null = null;

async function sendWelcome(
  member: GuildMember,
  channel: GuildTextBasedChannel,
): Promise<void> {
  const memberCount = member.guild.memberCount;
  const avatarUrl = member.user.displayAvatarURL({ size: 512, extension: "png" });

  const embed = new EmbedBuilder()
    .setTitle(`Welcome to ${member.guild.name}! 🎉`)
    .setDescription(
      `Hey ${member}, glad you're here!\nYou are our **member #${memberCount}**. We're thrilled to have you!`,
    )
    .setThumbnail(avatarUrl)
    .setImage(avatarUrl)
    .setColor(0x5865f2)
    .setTimestamp()
    .setFooter({ text: "Member joined" });

  await channel.send({
    content: `Welcome, ${member}! 👋`,
    embeds: [embed],
  });
}

const commands = [
  new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Welcome bot commands")
    .addSubcommand((sub) =>
      sub
        .setName("test")
        .setDescription("Send a test welcome message for yourself or another user")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("User to test welcome for (defaults to you)")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("setchannel")
        .setDescription("Set the channel where welcome messages are sent")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("The text channel to use for welcomes")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("info")
        .setDescription("Show current welcome bot configuration"),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
];

async function handleInteraction(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (interaction.commandName !== "welcome") return;

  const sub = interaction.options.getSubcommand();

  if (sub === "test") {
    const targetUser = interaction.options.getUser("user") ?? interaction.user;
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({ content: "This command must be used in a server.", ephemeral: true });
      return;
    }

    const member = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      await interaction.reply({ content: "Could not find that member.", ephemeral: true });
      return;
    }

    const channelId = activeWelcomeChannelId ?? interaction.channelId;
    const rawChannel = guild.channels.cache.get(channelId ?? "");
    const targetChannel =
      rawChannel && rawChannel.isTextBased()
        ? (rawChannel as GuildTextBasedChannel)
        : null;

    if (!targetChannel) {
      await interaction.reply({
        content: "No valid welcome channel set. Use `/welcome setchannel` first.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({ content: `Sending test welcome for ${targetUser}…`, ephemeral: true });
    await sendWelcome(member, targetChannel);

    logger.info({ userId: member.user.id }, "Test welcome sent");
    return;
  }

  if (sub === "setchannel") {
    const channel = interaction.options.getChannel("channel", true);
    activeWelcomeChannelId = channel.id;
    await interaction.reply({
      content: `✅ Welcome channel set to <#${channel.id}>. New members will be greeted there.`,
      ephemeral: true,
    });
    logger.info({ channelId: channel.id }, "Welcome channel updated via command");
    return;
  }

  if (sub === "info") {
    const channelId = activeWelcomeChannelId;
    await interaction.reply({
      content: channelId
        ? `**Welcome channel:** <#${channelId}>`
        : `**Welcome channel:** not set (using default from config)`,
      ephemeral: true,
    });
    return;
  }
}

export function startBot(): void {
  const token = process.env["DISCORD_BOT_TOKEN"];
  const defaultChannelId = process.env["DISCORD_WELCOME_CHANNEL_ID"] ?? null;

  if (!token) {
    logger.warn("DISCORD_BOT_TOKEN not set — Discord bot will not start");
    return;
  }

  activeWelcomeChannelId = defaultChannelId;

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
    ],
  });

  client.once("clientReady", async (c) => {
    logger.info({ tag: c.user.tag }, "Discord bot ready");

    const rest = new REST().setToken(token);
    try {
      await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
      logger.info("Slash commands registered globally");
    } catch (err) {
      logger.error({ err }, "Failed to register slash commands");
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    try {
      await handleInteraction(interaction);
    } catch (err) {
      logger.error({ err }, "Error handling interaction");
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "Something went wrong.", ephemeral: true }).catch(() => null);
      }
    }
  });

  client.on("guildMemberAdd", async (member: GuildMember) => {
    try {
      const channelId = activeWelcomeChannelId;
      if (!channelId) {
        logger.warn("No welcome channel configured");
        return;
      }

      const channel = member.guild.channels.cache.get(channelId);
      if (!channel || !channel.isTextBased()) {
        logger.warn({ channelId }, "Welcome channel not found or is not a text channel");
        return;
      }

      await sendWelcome(member, channel);
      logger.info({ userId: member.user.id, memberCount: member.guild.memberCount }, "Welcome message sent");
    } catch (err) {
      logger.error({ err }, "Failed to send welcome message");
    }
  });

  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to log in to Discord");
  });
}
