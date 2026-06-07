import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import 'dotenv/config';

// إعدادات البوت (تأكد من تفعيل Privileged Intents في Developer Portal)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Bot is ready! Logged in as ${client.user?.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  const channel = member.guild.systemChannel;
  if (!channel) return;

  const memberCount = member.guild.memberCount;
  
  // حماية ضد الـ undefined في الصورة
  const avatarUrl = member.user.displayAvatarURL() || "https://discord.com/assets/f78426a064b9d2146903.png";

  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(`Welcome to ${member.guild.name}! 🎉`)
    .setDescription(
      `Hey ${member}, glad you're here!\nYou are our **member #${memberCount}**.`
    )
    .setThumbnail(avatarUrl)
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("Error sending welcome message:", error);
  }
});

// الأوامر البسيطة عشان نتفادى خطأ الـ Builder
const welcomeCommand = new SlashCommandBuilder()
  .setName('welcome')
  .setDescription('Welcome system configuration');

// استخدام الاسم الجديد للمتغير (BOT_TOKEN_NEW)
const token = process.env.BOT_TOKEN_NEW;

if (!token) {
  console.error("Error: BOT_TOKEN_NEW is missing in environment variables!");
} else {
  client.login(token);
}
