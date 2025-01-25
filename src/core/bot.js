const { Telegraf, session } = require("telegraf");

require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

module.exports = {
  bot,
};
