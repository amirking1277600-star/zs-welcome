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
  type ChatInputCommandInteraction
} from "discord.js";

let activeWelcomeChannelId: string | null = null;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Welcome bot commands")
    .addSubcommand(sub => sub.setName("test").setDescription("Test welcome message"))
    .addSubcommand(sub => sub.setName("setchannel").setDescription("Set channel").addChannelOption(opt => opt.setName("channel").setDescription("Channel").addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
];

client.once("ready", async (c) => {
  console.log(`Bot is ready! Logged in as ${c.user.tag}`);
  const rest = new REST().setToken(process.env.BOT_TOKEN_NEW!);
  try {
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
    console.log("Slash commands registered.");
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "welcome") return;

  const sub = interaction.options.getSubcommand();
  if (sub === "setchannel") {
    const channel = interaction.options.getChannel("channel", true);
    activeWelcomeChannelId = channel.id;
    await interaction.reply({ content: `✅ Welcome channel set to <#${channel.id}>`, ephemeral: true });
  } else if (sub === "test") {
    const channel = interaction.guild?.channels.cache.get(activeWelcomeChannelId || "");
    if (channel && channel.isTextBased()) {
      await channel.send("Test welcome message works!");
      await interaction.reply({ content: "Test sent!", ephemeral: true });
    } else {
      await interaction.reply({ content: "Set a channel first!", ephemeral: true });
    }
  }
});

client.on("guildMemberAdd", async (member) => {
  if (!activeWelcomeChannelId) return;
  const channel = member.guild.channels.cache.get(activeWelcomeChannelId);
  if (channel && channel.isTextBased()) {
    const embed = new EmbedBuilder()
      .setTitle(`Welcome ${member.user.username}! 🎉`)
      .setDescription(`Glad you're here! You are member #${member.guild.memberCount}`);
    await channel.send({ embeds: [embed] });
  }
});

const token = process.env.BOT_TOKEN_NEW;
if (!token) {
  console.error("BOT_TOKEN_NEW is missing!");
} else {
  client.login(token.trim());
}
