const { Telegraf } = require("telegraf");
const { Markup } = require("telegraf");
const fetch = require("node-fetch");
const { addPlayerToMatch, deletePlayerToMatch } = require("./../core/db");
const messages = require("./../consts/messages");
const {
  handleHelp,
  handleStats,
  handleStart,
  isPrivate,
  handleCurrentMatch,
} = require("./../handles/user");
const {
  handleNewMatch,
  handleResultMatch,
  handleDeleteMatch,
} = require("./../handles/admin");

const { refreshMatchMessage } = require("./../handles/main");

const { isAdmin } = require("./../consts/admins");
require("dotenv").config();
const AdminCreateButtonButton = {
  text: "Создать новый матч",
  callback_data: "admincreatematchmessage",
};

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command("start", async (ctx) => {
  await handleStart(bot)(ctx, ctx);
});

bot.command("create", async (ctx) => {
  await handleNewMatch(bot)(ctx, ctx);
});

bot.command("result", async (ctx) => {
  await handleResultMatch(bot)(ctx, ctx);
});

bot.command("delete", async (ctx) => {
  await handleDeleteMatch(bot)(ctx, ctx);
});

bot.action("leave", async (ctx) => {
  await ctx.answerCbQuery();
});

bot.action("stats", async (ctx) => {
  await ctx.answerCbQuery();
  await handleStats(bot)(ctx, ctx.update.callback_query);
});

bot.command("stats", async (ctx) => {
  await handleStats(bot)(ctx, ctx);
});

bot.action("help", async (ctx) => {
  await ctx.answerCbQuery();
  await handleHelp(bot)(ctx, ctx.update.callback_query);
});

bot.command("help", async (ctx) => {
  await handleHelp(bot)(ctx, ctx);
});

bot.action("current", async (ctx) => {
  await ctx.answerCbQuery();
  await handleCurrentMatch(bot)(ctx, ctx.update.callback_query);
});

bot.command("current", async (ctx) => {
  await handleCurrentMatch(bot)(ctx, ctx);
});

bot.on("callback_query", async (ctx) => {
  const callbackData = ctx.update.callback_query.data; // Получаем данные callback
  let isUpdated = false;

  if (callbackData.includes(":")) {
    const [prefix, action, matchId] = callbackData.split(":"); // Разделяем строку

    // Проверяем префикс "match"
    if (prefix === "match") {
      const chatId = ctx.update.callback_query.message.chat.id;
      const messageId = ctx.update.callback_query.message.message_id;
      const userName = ctx.update.callback_query?.from?.username || "нет ника";

      if (action === "join") {
        const result = await addPlayerToMatch(
          {
            telegramId: ctx.update.callback_query.from.id,
            fullName: `${ctx.update.callback_query.from?.first_name || ""} ${
              ctx.update.callback_query.from?.last_name || ""
            }`,
          },
          matchId
        );

        if (result === "Вы присоединились к матчу") {
          isUpdated = true;
        } else {
          await bot.telegram.sendMessage(
            chatId,
            `@${userName} ${result} с ID: ${matchId}`,
            {
              parse_mode: "html",
              reply_to_message_id: messageId,
            }
          );
        }
      } else if (action === "leave") {
        const result = await deletePlayerToMatch(
          { telegramId: ctx.update.callback_query.from.id },
          matchId
        );

        if (result === "Вы покинули матч") {
          isUpdated = true;
        } else {
          await bot.telegram.sendMessage(
            chatId,
            `@${userName} ${result} ID: ${matchId}`,
            {
              parse_mode: "html",
              reply_to_message_id: messageId,
            }
          );
        }
      }

      if (isUpdated) {
        await refreshMatchMessage(bot, matchId);
      }
      await ctx.answerCbQuery();
    }
  }
});

bot.on("text", (ctx) => {
  if (ctx.message.chat.type === "private") {
    if (isAdmin(ctx.message.from.id)) {
      bot.telegram.sendMessage(ctx.message.chat.id, messages.adminMessage, {
        parse_mode: "markdown",
      });
    } else {
      if (ctx?.message?.chat?.id) {
        bot.telegram.sendMessage(
          ctx.message.chat.id,
          `${messages.notInPrivate}, а так твой tg id: ${ctx.message.from.id}`,
          {
            parse_mode: "html",
          }
        );
      }
    }
  }
});

bot.request = async function (command, json) {
  return fetch(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/${command}`,
    {
      method: "post",
      body: JSON.stringify(json),
      headers: { "Content-Type": "application/json" },
    }
  );
};

bot.request("setMyName", {
  name: messages.bot.name,
});

bot.request("setMyDescription", {
  description: messages.bot.description,
});

bot.request("setMyShortDescription", {
  short_description: messages.bot.shortDescription,
});

bot.request("setMyCommands", {
  commands: [
    {
      command: "create",
      description: "Создать матч",
    },
    {
      command: "delete",
      description: "Удалить матч",
    },
    {
      command: "result",
      description: "Подтвердить результаты",
    },
    {
      command: "help",
      description: "Помощь",
    },
  ],
  scope: { type: "all_private_chats" },
  language_code: "en",
});

bot
  .launch()
  .then(() => {
    console.log("Бот запущен");
  })
  .catch((err) => console.error("Ошибка запуска бота:", err));

bot.on("new_chat_members", (ctx) => {
  ctx.message.new_chat_members.forEach((member) => {
    const userName = member?.first_name || "новый участник";
    ctx.reply(`Добро пожаловать в группу, ${userName}!`);
  });
});

module.exports = (app) => {
  app.use(bot.webhookCallback("/bot"));
};
