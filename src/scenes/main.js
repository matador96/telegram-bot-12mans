const { Telegraf } = require("telegraf");
const fetch = require("node-fetch");
const { addPlayerToMatch, deletePlayerToMatch } = require("./../core/db");
const messages = require("./../consts/messages");
const {
  handleHelp,
  handleStats,
  handleStart,
  handleCurrentMatch,
  handleLastMatch,
} = require("./../handles/user");
const {
  handleNewMatch,
  handleResultMatch,
  handleDeleteMatch,
  handleChangeDateMatch,
  handleChangeCostMatch,
  handleChangeMansMatch,
} = require("./../handles/admin");

const { createMatchMessage } = require("./../handles/main");

const { closeCtx } = require("./../helpers/main");

const { isAdmin } = require("./../consts/admins");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

async function processHandle(ctx, type, handle) {
  await handle(bot)(
    ctx,
    type === "action" ? ctx.update.callback_query : ctx.update.message,
    type === "action"
      ? ctx.update.callback_query.from
      : ctx.update.message.from,
    ctx.chat.id,
    type
  );
  if (type === "action") await closeCtx(ctx);
}

const actionsWithCommands = [
  {
    command: "help",
    action: handleHelp,
  },
  {
    command: "current",
    action: handleCurrentMatch,
  },
  {
    command: "last",
    action: handleLastMatch,
  },
  {
    command: "start",
    action: handleStart,
  },
  {
    command: "stats",
    action: handleStats,
  },
];

actionsWithCommands.forEach((e) => {
  bot.action(e.command, async (ctx) => {
    await processHandle(ctx, "action", e.action);
  });
  bot.command(e.command, async (ctx) => {
    await processHandle(ctx, "text", e.action);
  });
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

bot.command("date", async (ctx) => {
  await handleChangeDateMatch(bot)(ctx, ctx);
});

bot.command("cost", async (ctx) => {
  await handleChangeCostMatch(bot)(ctx, ctx);
});

bot.command("mans", async (ctx) => {
  await handleChangeMansMatch(bot)(ctx, ctx);
});

bot.action("leave", async (ctx) => {
  await closeCtx(ctx);
});

bot.on("callback_query", async (ctx) => {
  const callbackData = ctx.update.callback_query.data; // Получаем данные callback
  let result = "";

  if (callbackData.includes(":")) {
    const [prefix, action, matchId] = callbackData.split(":"); // Разделяем строку

    // Проверяем префикс "match"
    if (prefix === "match") {
      const chatId = ctx.update.callback_query.message.chat.id;
      const messageId = ctx.update.callback_query.message.message_id;
      const userName = ctx.update.callback_query?.from?.username || "нет ника";

      if (action === "join") {
        result = await addPlayerToMatch(
          {
            telegramId: ctx.update.callback_query.from.id,
            fullName: `${ctx.update.callback_query.from?.first_name || ""} ${
              ctx.update.callback_query.from?.last_name || ""
            }`,
          },
          matchId
        );
      } else if (action === "leave") {
        result = await deletePlayerToMatch(
          { telegramId: ctx.update.callback_query.from.id },
          matchId
        );
      }

      if (["Вы покинули матч", "Вы присоединились к матчу"].includes(result)) {
        await createMatchMessage(ctx, matchId, null, {
          fromObj: ctx.update.callback_query.from,
          action,
        });
      }
    }
  }
  await closeCtx(ctx, result, false);
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
  description: messages.welcomeTelegramBot,
});

bot.request("setMyShortDescription", {
  short_description: messages.bot.shortDescription,
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

bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
  // Дополнительно можно уведомлять администратора о сбоях
});

module.exports = (app) => {
  app.use(bot.webhookCallback("/bot"));
};
