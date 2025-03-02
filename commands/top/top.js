const {
  SlashCommandBuilder,
  MessageFlags,
  ChannelType,
} = require("discord.js");
const { EmbedBuilder } = require("discord.js");
require("dotenv").config(); // Betöltjük a környezeti változókat

module.exports = {
  data: new SlashCommandBuilder()
    .setName("top")
    .setDescription(
      "Listázza a legtöbb ponttal rendelkező felhasználókat egy adott csatornán"
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription(
          "A csatorna, amelyen a felhasználók pontjait meg szeretnéd jeleníteni"
        )
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),
  execute: async (interaction) => {
    const channel = interaction.options.getChannel("channel");
    const apiUrl = `https://api-echo.pollak.info/discord/top`;

    if (!process.env.API_KEY) {
      await interaction.editReply({
        content: "Hiányzó API kulcs. Ellenőrizd a környezeti változókat!",
      });
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.API_KEY,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Hiba történt: ${response.statusText}`);
      }

      const data = await response.json();
      const embed = new EmbedBuilder()
        .setTitle(
          `${new Date().toLocaleDateString()} - A legtöbb ponttal rendelkező diákok listája`
        )
        .setColor("#9003fc")
        .setTimestamp();

      data.forEach((user, index) => {
        embed.addFields({
          name: `#${index + 1} ${user.name}`,
          value:
            `Pontszám: ${user.point}\n` +
            (user.discordId !== "" ? `<@${user.discordId}>` : ""),
        });
      });

      await interaction.client.channels.cache
        .get(channel.id)
        .send("<@&1343254428698021888>");
      await interaction.client.channels.cache.get(channel.id).send({
        embeds: [embed],
      });

      await interaction.editReply({
        content: "A legtöbb ponttal rendelkező felhasználók listája elküldve.",
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply(
        `Hiba történt a kérés során. \n${error.message || error}`
      );
    }
  },
};
