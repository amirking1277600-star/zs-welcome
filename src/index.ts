import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  ChannelType, 
  PermissionFlagsBits 
} from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

// متغير ثابت عشان الترحيب يشتغل
let activeWelcomeChannelId: string | null = process.env.DISCORD_WELCOME_CHANNEL_ID || null;

const commands = [
  new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("إعدادات الترحيب")
    .addSubcommand(sub => sub.setName("test").setDescription("إرسال ترحيب تجريبي"))
    .addSubcommand(sub => sub.setName("setchannel")
      .setDescription("تحديد قناة الترحيب")
      .addChannelOption(opt => opt.setName("channel").setDescription("اختر القناة").addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
];

client.once("ready", async (c) => {
  console.log(`✅ البوت اشتغل باسم: ${c.user.tag}`);
  try {
    const rest = new REST().setToken(process.env.BOT_TOKEN_NEW!);
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
    console.log("✅ تم تسجيل الأوامر (Slash Commands) بنجاح!");
  } catch (err) {
    console.error("❌ خطأ في تسجيل الأوامر:", err);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "welcome") return;

  const sub = interaction.options.getSubcommand();
  if (sub === "setchannel") {
    const channel = interaction.options.getChannel("channel", true);
    activeWelcomeChannelId = channel.id;
    await interaction.reply({ content: `✅ تم ضبط قناة الترحيب إلى <#${channel.id}>`, ephemeral: true });
  } else if (sub === "test") {
    if (!activeWelcomeChannelId) return await interaction.reply({ content: "❌ حدد قناة الترحيب أولاً بـ /welcome setchannel", ephemeral: true });
    client.emit("guildMemberAdd", interaction.member as any);
    await interaction.reply({ content: "✅ تم إرسال رسالة تجريبية!", ephemeral: true });
  }
});

client.on("guildMemberAdd", async (member) => {
  if (!activeWelcomeChannelId) return;
  const channel = member.guild.channels.cache.get(activeWelcomeChannelId);
  
  if (channel && channel.isTextBased()) {
    const avatarUrl = member.user.displayAvatarURL({ size: 512 });
    const embed = new EmbedBuilder()
      .setTitle(`Welcome to ${member.guild.name}! 🎉`)
      .setDescription(`Hey ${member}, glad you're here!\nYou are our **member #${member.guild.memberCount}**. We're thrilled to have you!`)
      .setThumbnail(avatarUrl)
      .setImage(avatarUrl)
      .setColor(0x5865f2)
      .setTimestamp();

    await channel.send({
      content: `Welcome, ${member}! 👋`,
      embeds: [embed],
    });
  }
});

// التشغيل
const token = process.env.BOT_TOKEN_NEW;
if (!token) {
  console.error("❌ خطأ: BOT_TOKEN_NEW غير موجود في المتغيرات!");
} else {
  client.login(token.trim());
}
