client.on("guildMemberAdd", async (member) => {
  if (!activeWelcomeChannelId) return;
  const channel = member.guild.channels.cache.get(activeWelcomeChannelId);
  
  if (channel && channel.isTextBased()) {
    const avatarUrl = member.user.displayAvatarURL({ size: 512, extension: "png" });
    
    const embed = new EmbedBuilder()
      .setTitle(`Welcome to ${member.guild.name}! 🎉`)
      .setDescription(`Hey ${member}, glad you're here!\nYou are our **member #${member.guild.memberCount}**. We're thrilled to have you!`)
      .setThumbnail(avatarUrl) // دي الصورة الصغيرة اللي في الجنب
      .setImage(avatarUrl)      // دي الصورة الكبيرة اللي تحت (ممكن تغيرها لو عايز)
      .setColor(0x5865f2)
      .setTimestamp()
      .setFooter({ text: "Member joined" });

    await channel.send({
      content: `Welcome, ${member}! 👋`, // ده المنشن اللي فوق الـ Embed
      embeds: [embed],
    });
  }
});
