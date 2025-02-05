const {
  getCurrentMatch,
  getAllPlayers,
  getLastFinishedMatch,
  getCountOfFinishedMatches,
} = require("./../core/db");
const { isAdmin } = require("./../consts/admins");
const messages = require("./../consts/messages");
const { createMatchMessage, createMatchPendingMessage } = require("./main");
const { closeCtx } = require("./../helpers/main");

const HelpButton = { text: "❓ Помощь", callback_data: "help" };
const StatsButton = { text: "📊 Статистика игроков", callback_data: "stats" };
const CurrentMatchButton = {
  text: "⚽️ Текущий матч",
  callback_data: "current",
};

const LastMatchButton = {
  text: "⚽️ Последний матч",
  callback_data: "last",
};

const isPrivate = (bot, ctx, obj) => {
  if (ctx.chat.type === "private") {
    const chatId = obj.chat.id;

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

const handleHelp = (bot) => async (ctx, obj, fromObj, chatId) => {
  if (isPrivate(bot, ctx, obj)) {
    return;
  }

  const userInfo = fromObj;

  const text = `${messages.help} \n 🎮 Запросил: [${
    userInfo?.first_name || userInfo?.last_name || userInfo?.id
  }](tg://user?id=${userInfo.id}) 🕹️`;

  await bot.telegram.sendMessage(chatId, text, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "MENU ☰", callback_data: "start" }]],
    },
  });
};

const handleStats = (bot) => async (ctx, obj, fromObj, chatId) => {
  if (isPrivate(bot, ctx, obj)) {
    return;
  }

  const userInfo = fromObj;

  const countOfMatches = await getCountOfFinishedMatches();
  const players = await getAllPlayers();

  let postText = `🏆 *Рейтинг игроков, всего матчей: ${countOfMatches} *\n
    Игрок | Очков / Побед / Матчей / Винрейт
    ------------------------------------\n`;

  players.forEach((user, index) => {
    let emoji = "";

    if (index === 0) {
      emoji = "🥇";
    }

    if (index === 1) {
      emoji = "🥈";
    }

    if (index === 2) {
      emoji = "🥉";
    }

    postText += `${index + 1}. ${emoji} ${user?.fullName} | ${
      user?.rating || 0
    } / ${user.winCount || 0} / ${user.matchCount || 0} / ${
      user.winRate ? `${user.winRate}%` : `0%`
    } \n`;
  });

  postText += `\n🎮 Статистику запросил: [${
    userInfo?.first_name || userInfo?.last_name || userInfo?.id
  }](tg://user?id=${userInfo.id}) 🕹️`;

  await bot.telegram.sendMessage(chatId, postText, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "MENU ☰", callback_data: "start" }]],
    },
  });
};

const handleStart = (bot) => async (ctx, obj, fromObj, chatId) => {
  if (isPrivate(bot, ctx, obj)) {
    return;
  }

  const userInfo = fromObj;

  await bot.telegram.sendMessage(
    chatId,
    `${messages.welcomeTelegramBot} ID канала ${chatId}
\n🎮 Меню запросил: [${
      userInfo?.first_name || userInfo?.last_name || userInfo?.id
    }](tg://user?id=${userInfo.id}) 🕹️
`,
    {
      parse_mode: "markdown",
      reply_markup: {
        inline_keyboard: [
          [CurrentMatchButton],
          [LastMatchButton],
          [StatsButton],
          [HelpButton],
        ],
      },
    }
  );
};

const handleCurrentMatch =
  (bot) => async (ctx, obj, fromObj, chatId, messageType) => {
    if (isPrivate(bot, ctx, obj)) {
      return;
    }

    const currentMatch = await getCurrentMatch();
    const userInfo = fromObj;

    if (!currentMatch) {
      if (messageType === "text") {
        await bot.telegram.sendMessage(
          chatId,
          `[${
            userInfo?.first_name || userInfo?.last_name || userInfo?.id
          }](tg://user?id=${userInfo.id}), сейчас нет активных матчей`,
          {
            parse_mode: "markdown",
          }
        );
      } else {
        await closeCtx(ctx, "Нет активных матчей", false);
      }

      return;
    }

    await createMatchMessage(ctx, currentMatch.id);
  };

const handleLastMatch =
  (bot) => async (ctx, obj, fromObj, chatId, messageType) => {
    if (isPrivate(bot, ctx, obj)) {
      return;
    }

    const match = await getLastFinishedMatch();
    const userInfo = fromObj;

    if (!match) {
      if (messageType === "text") {
        await bot.telegram.sendMessage(
          chatId,
          `[${
            userInfo?.first_name || userInfo?.last_name || userInfo?.id
          }](tg://user?id=${userInfo.id}), сейчас нет завершенных матчей`,
          {
            parse_mode: "markdown",
          }
        );
      } else {
        await closeCtx(ctx, "Нет завершенных матчей", false);
      }

      return;
    }

    await createMatchPendingMessage(ctx, match.id);
  };

module.exports = {
  handleHelp,
  handleStats,
  handleStart,
  isPrivate,
  handleCurrentMatch,
  handleLastMatch,
};
