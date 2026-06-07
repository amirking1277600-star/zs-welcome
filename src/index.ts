import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import 'dotenv/config';

// إعدادات البوت الأساسية
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

// التعامل مع الـ Slash Command
const welcomeCommand = new SlashCommandBuilder()
  .setName('welcome')
  .setDescription('Welcome system configuration');

// استخدام المتغير اللي حطيناه في Railway
const token = process.env.BOT_TOKEN_NEW;

// كود للتأكد من وصول التوكن للـ Logs
if (!token) {
  console.error("Error: BOT_TOKEN_NEW is missing in environment variables!");
} else {
  console.log("Token length is:", token.length);
  client.login(token).catch(err => console.error("Login failed:", err));
}
