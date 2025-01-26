const messages = require("./../consts/messages");
const { isPrivate } = require("./../handles/user");
const {
  parseMatchDetails,
  parseDeleteMatchDetails,
} = require("./../helpers/match");
const { isAdmin } = require("./../consts/admins");
const {
  addMatch,
  deleteMatchById,
  getMatchById,
  updateMatch,
} = require("./../core/db");
const {
  refreshMatchMessage,
  messageForAllGenerate,
  infoMatch,
  generateTeamTable,
  generatePlayerList,
} = require("./main");

const CHAT_ID = process.env.CHANNEL_ID;

const { parseMatchResult } = require("./../helpers/match");
const { getActiveMatch } = require("./../core/db");

const pendingMessageForAllGenerate = (matchInfo) => {
  const text =
    matchInfo.status === "pending"
      ? "👍 _Не меняйте составы! Админы после игры не забудьте внести результаты._"
      : "Матч окончен";

  return {
    text: `
⚽️ *Матч ${matchInfo.status === "pending" ? "играется" : "завершен"}* *ID:* \`${
      matchInfo.id
    }\`

${infoMatch(matchInfo)}

${generateTeamTable(matchInfo)}

${text}`,

    parse_mode: "Markdown",
  };
};

const refreshMessagePending = async (bot, matchId) => {
  const matchInfo = await getMatchById(matchId);

  if (!matchInfo) {
    return;
  }

  // if (matchInfo.status !== "pending") {
  //   return;
  // }

  const messageForAll = pendingMessageForAllGenerate(matchInfo);

  await bot.telegram
    .editMessageText(CHAT_ID, matchInfo.messageId, null, messageForAll, {
      reply_markup: {
        inline_keyboard: [],
      },
      parse_mode: "Markdown",
    })
    .catch((e) => {
      console.log(e);
    });
};

const handleNewMatch = (bot) => async (ctx, obj) => {
  if (!isAdmin(obj.message.from.id)) {
    return isPrivate(bot, ctx, obj);
  }

  const chatId = ctx.chat.id;
  const message = obj.message.text;

  const activeMatch = await getActiveMatch();
  if (activeMatch) {
    bot.telegram.sendMessage(
      chatId,
      `У вас уже есть активный матч ID: ${activeMatch.id}, закончите его или удалите, прежде чем создавать новый`,
      {
        parse_mode: "html",
      }
    );
    return;
  }

  const matchInfo = parseMatchDetails(message);
  if (typeof matchInfo === "string") {
    await bot.telegram.sendMessage(chatId, matchInfo, {
      parse_mode: "html",
    });
    return;
  }

  const generatedUuid = new Date().getTime();

  const successMatchCreated = `Матч создан! ID матча: ${generatedUuid}`;

  await bot.telegram.sendMessage(chatId, successMatchCreated, {
    parse_mode: "html",
  });

  const messageForAll = messageForAllGenerate({
    ...matchInfo,
    id: generatedUuid,
  });

  const messageInGroup = await bot.telegram.sendMessage(
    CHAT_ID,
    messageForAll,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Залететь на матч",
              callback_data: `match:join:${generatedUuid}`,
            },
          ],
          [
            {
              text: "Ливнуть с матча",
              callback_data: `match:leave:${generatedUuid}`,
            },
          ],
        ],
      },
      parse_mode: "Markdown",
    }
  );

  const matchDetails = {
    ...matchInfo,
    id: generatedUuid,
    status: "active",
    messageId: messageInGroup.message_id,
  };

  await bot.telegram.pinChatMessage(CHAT_ID, messageInGroup.message_id);

  await addMatch(matchDetails);
};

const handleResultMatch = (bot) => async (ctx, obj) => {
  if (!isAdmin(obj.message.from.id)) {
    return isPrivate(bot, ctx, obj);
  }

  const chatId = ctx.chat.id;
  const messageId = obj.message.message_id;

  const parsedMatchResult = parseMatchResult(obj.message.text);

  if (typeof parsedMatchResult === "string") {
    await bot.telegram.sendMessage(chatId, parsedMatchResult, {
      parse_mode: "html",

      reply_to_message_id: messageId,
    });
    return;
  }

  const matchId = parsedMatchResult.matchId.toString();
  const matchInfo = await getMatchById(matchId);

  if (!matchInfo) {
    await bot.telegram.sendMessage(chatId, "Матча с таким ID не существует", {
      parse_mode: "html",
    });
    return;
  }

  if (matchInfo?.status !== "pending") {
    await bot.telegram.sendMessage(
      chatId,
      "Матч еще не начался даже броу(, жди, за час будет доступно выставление результатов",
      {
        parse_mode: "html",
      }
    );
    return;
  }

  await bot.telegram.sendMessage(
    chatId,
    `Результат для матча ID: ${matchId} обновлен`,
    {
      parse_mode: "html",
      reply_to_message_id: messageId,
    }
  );

  await updateMatch(matchId, {
    status: "finished",
    teamScoreA: parsedMatchResult.teamScoreA,
    teamScoreB: parsedMatchResult.teamScoreB,
  });
  await refreshMessagePending(ctx, matchId);

  const whosWin =
    parsedMatchResult.teamScoreA !== parsedMatchResult.teamScoreB
      ? parsedMatchResult.teamScoreA > parsedMatchResult.teamScoreB
        ? "выиграла Команда 1 ✅"
        : "выиграла Команда 2 ✅"
      : "Ничья ⚫";

  await bot.telegram.sendMessage(
    CHAT_ID,
    `Результаты матча обновлены, ${whosWin}`,
    {
      parse_mode: "html",
      reply_to_message_id: matchInfo.messageId,
    }
  );
};

const handleDeleteMatch = (bot) => async (ctx, obj) => {
  if (!isAdmin(obj.message.from.id)) {
    return isPrivate(bot, ctx, obj);
  }
  const chatId = ctx.chat.id;
  const parsedMatchObj = parseDeleteMatchDetails(obj.message.text);

  if (typeof parsedMatchObj === "string") {
    bot.telegram.sendMessage(chatId, parsedMatchObj, {
      parse_mode: "html",
    });
    return;
  }

  const matchInfo = await getMatchById(parsedMatchObj.matchId);

  if (!matchInfo) {
    await bot.telegram.sendMessage(chatId, "Матча с таким ID не существует", {
      parse_mode: "html",
    });
    return;
  }

  await deleteMatchById(parsedMatchObj.matchId);

  if (matchInfo?.messageId) {
    await bot.telegram.unpinChatMessage(CHAT_ID, matchInfo.messageId);

    await bot.telegram.editMessageText(
      CHAT_ID,
      matchInfo.messageId,
      0,
      `Матч ${parsedMatchObj.matchId} удален!`
    );
  }

  await bot.telegram.sendMessage(
    chatId,
    `Матч ID: ${parsedMatchObj.matchId} удален`,
    {
      parse_mode: "html",
    }
  );

  const messageId = obj.message.message_id;
};

module.exports = {
  handleNewMatch,
  handleDeleteMatch,
  handleResultMatch,
  refreshMessagePending,
};
