import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import 'dotenv/config';

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

  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(`Welcome to ${member.guild.name}!`)
    .setDescription(`Welcome ${member} to the server!`)
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("Error sending welcome message:", error);
  }
});

const token = process.env.TOKEN;

if (!token) {
  console.error("ERROR: TOKEN variable is not set in Railway!");
} else {
  console.log("Attempting to login with token starting with:", token.substring(0, 5) + "...");
  client.login(token.trim()).catch((err) => {
    console.error("FAILED TO LOGIN:", err.message);
  });
}
