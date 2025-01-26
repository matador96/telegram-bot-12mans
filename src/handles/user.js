const {
  getCurrentMatch,
  updateMatch,
  getAllPlayers,
  getCountOfMatches,
  addMatch,
  deleteMatchById,
  getMatchById,
} = require("./../core/db");
const { isAdmin } = require("./../consts/admins");
const messages = require("./../consts/messages");
const { refreshMatchMessage, messageForAllGenerate } = require("./main");

const HelpButton = { text: "Помощь", callback_data: "help" };
const StatsButton = { text: "Статистика игроков", callback_data: "stats" };
const CurrentMatchButton = { text: "Текущий матч", callback_data: "current" };

const isPrivate = (bot, ctx, obj) => {
  if (ctx.chat.type === "private") {
    const chatId = ctx.chat.id;

    if (isAdmin(obj.message.from.id)) {
      // bot.telegram.sendMessage(chatId, messages.adminMessage, {
      //   parse_mode: "markdown",
      // });
    } else {
      bot.telegram.sendMessage(
        chatId,
        `${messages.notInPrivate}, а так твой tg id: ${obj.message.from.id}`,
        {
          parse_mode: "html",
        }
      );
    }

    return true;
  } else {
    return false;
  }
};

const handleHelp = (bot) => async (ctx, obj) => {
  if (isPrivate(bot, ctx, obj)) {
    return;
  }

  const chatId = ctx.chat.id;
  const messageId = obj.message.message_id;

  bot.telegram.sendMessage(chatId, messages.help, {
    parse_mode: "html",
    reply_to_message_id: messageId,
  });
};

const handleStats = (bot) => async (ctx, obj) => {
  if (isPrivate(bot, ctx, obj)) {
    return;
  }

  const chatId = ctx.chat.id;
  const messageId = obj.message.message_id;

  const countOfMatches = await getCountOfMatches();
  const players = await getAllPlayers();

  let postText = `🏆 *Рейтинг игроков, всего матчей: ${countOfMatches} *\n\n`;

  players.forEach((user, index) => {
    postText += `${index + 1}. [${user?.fullName}](tg://user?id=${
      user.telegramId
    }) | ${user?.rating || 0} \n`;
  });

  postText += `\n🎮 Спасибо всем за участие! 🕹️`;

  await bot.telegram.sendMessage(chatId, postText, {
    parse_mode: "Markdown",
    reply_to_message_id: messageId,
  });
};

const handleStart = (bot) => async (ctx, obj) => {
  if (isPrivate(bot, ctx, obj)) {
    return;
  }

  const chatId = ctx.chat.id;

  await bot.telegram.sendMessage(
    chatId,
    `${messages.welcomeTelegramBot} ID канала ${chatId}`,
    {
      parse_mode: "html",
      reply_markup: {
        inline_keyboard: [[StatsButton], [CurrentMatchButton], [HelpButton]],
      },
    }
  );
};

const handleCurrentMatch = (bot) => async (ctx, obj) => {
  if (isPrivate(bot, ctx, obj)) {
    return;
  }

  const chatId = ctx.chat.id;
  const currentMatch = await getCurrentMatch();

  if (!currentMatch) {
    await ctx.reply("Сейчас нет активных матчей");
    return;
  }

  if (!currentMatch?.messageId) {
    const message = await ctx.telegram.sendMessage(chatId, "Текущий матч", {
      parse_mode: "Markdown",
    });

    await updateMatch(currentMatch.id, {
      messageId: message.message_id,
    });

    await refreshMatchMessage(ctx, currentMatch.id);
  } else {
    await ctx.telegram.sendMessage(chatId, "Текущий матч", {
      parse_mode: "html",
      reply_to_message_id: currentMatch.messageId,
    });
    await ctx.answerCbQuery();
  }
};

module.exports = {
  handleHelp,
  handleStats,
  handleStart,
  isPrivate,
  handleCurrentMatch,
};
