import "dotenv/config";
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
  type GuildTextBasedChannel,
} from "discord.js";

// استخدام المتغيرات من Railway
let activeWelcomeChannelId: string | null = process.env["DISCORD_WELCOME_CHANNEL_ID"] ?? null;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

async function sendWelcome(member: GuildMember, channel: GuildTextBasedChannel): Promise<void> {
  const avatarUrl = member.user.displayAvatarURL({ size: 512, extension: "png" });

  const embed = new EmbedBuilder()
    .setTitle(`Welcome to ${member.guild.name}! 🎉`)
    // التعديل هنا للخط السميك القصير (استخدام رموز الـ Emoji أو الـ Separators)
    .setDescription(`━━━━━━━━━━━━━━\nHey ${member}, glad you're here!\nYou are our **member #${member.guild.memberCount}**.\n━━━━━━━━━━━━━━`)
    .setThumbnail(avatarUrl)
    .setImage(avatarUrl)
    .setColor(0x5865f2)
    .setTimestamp()
    .setFooter({ text: "Member joined" });

  await channel.send({ content: `Welcome, ${member}! 👋`, embeds: [embed] });
}

const commands = [
  new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Welcome bot commands")
    .addSubcommand((sub) => sub.setName("test").setDescription("Send a test welcome").addUserOption((o) => o.setName("user").setDescription("User")))
    .addSubcommand((sub) => sub.setName("setchannel").setDescription("Set channel").addChannelOption((o) => o.setName("channel").addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
];

client.once("ready", async (c) => {
  console.log(`Bot is ready! Logged in as ${c.user.tag}`);
  const rest = new REST().setToken(process.env["DISCORD_BOT_TOKEN"]!);
  await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const sub = interaction.options.getSubcommand();
  
  if (sub === "test") {
    const targetUser = interaction.options.getUser("user") ?? interaction.user;
    const member = await interaction.guild!.members.fetch(targetUser.id);
    const channel = (activeWelcomeChannelId ? interaction.guild!.channels.cache.get(activeWelcomeChannelId) : interaction.channel) as GuildTextBasedChannel;
    
    await sendWelcome(member, channel);
    await interaction.reply({ content: "Test sent!", ephemeral: true });
  }

  if (sub === "setchannel") {
    activeWelcomeChannelId = interaction.options.getChannel("channel", true).id;
    await interaction.reply({ content: `✅ Welcome channel set.`, ephemeral: true });
  }
});

client.on("guildMemberAdd", async (member) => {
  if (!activeWelcomeChannelId) return;
  const channel = member.guild.channels.cache.get(activeWelcomeChannelId) as GuildTextBasedChannel;
  if (channel) await sendWelcome(member, channel);
});

client.login(process.env["DISCORD_BOT_TOKEN"]);