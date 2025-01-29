const { getMatchById } = require("./../core/db");

const CHAT_ID = process.env.CHANNEL_ID;

const generatePlayerList = (players, count = 0) => {
  let list = [...players];

  if (count > 0) {
    if (players.length < count) {
      let addMass = count - players.length;

      for (let i = 0; i < addMass; i++) {
        list.push([]);
      }
    }
  }

  return list
    .map((player, index) => `${index + 1}. ${player?.fullName || ""}`)
    .join("\n");
};

const infoMatch = (matchInfo) => `*📅 Дата:* \`${matchInfo.date}\`  
⏰ *Начало:* \`${matchInfo.time}\`  
📍 *Место:* \`${matchInfo.location}\`  
👥 *Количество игроков:* \`${matchInfo.playerCount} (${
  matchInfo.playerCount / 2
}x${matchInfo.playerCount / 2})\`  
💵 *Цена участия:* \`${matchInfo.cost}\`  
📝 *Детали:* \`${matchInfo.additionalDetails}\``;

const getEmoji = (a, b) => {
  if (a > b) {
    return "✅ Выиграла 🏅 |";
  } else if (a < b) {
    return "❌ Проиграла |";
  } else {
    return "⚫";
  }
};

const generateTeamTable = (matchInfo) => {
  // Разделяем игроков на две команды: team 'a' и team 'b'

  const players = matchInfo.players;
  const teamScoreA = matchInfo?.teamScoreA || 0;
  const teamScoreB = matchInfo?.teamScoreB || 0;

  const teamA = players.filter((player) => player.team === "a");
  const teamB = players.filter((player) => player.team === "b");

  const isFinished = matchInfo.status === "finished";

  // Заполняем команды данными игроков

  // Формируем итоговый текст в виде таблицы с добавлением пробела после текста
  const table = `**${getEmoji(teamScoreA, teamScoreB)} Команда 1 ${
    matchInfo.manishki === "a" ? "(манишки)" : "(начинают с центра)"
  }**
${generatePlayerList(teamA)}

**${getEmoji(teamScoreB, teamScoreA)}  Команда 2 ${
    matchInfo.manishki === "b" ? "(манишки)" : "(начинают с центра)"
  }**
${generatePlayerList(teamB)}

Счет: ${teamScoreA} : ${teamScoreB}`;

  return table;
};

const messageForAllGenerate = (matchInfo, userAction = {}) => {
  const userInfo = userAction?.fromObj;
  const userActionText =
    userAction?.action === "join" ? "записался на матч" : "вышел из матча";
  const userText = userAction?.fromObj?.id
    ? `
    
👤 [${
        userInfo?.first_name || userInfo?.last_name || userInfo?.id
      }](tg://user?id=${userInfo.id}) ${userActionText}`
    : "";

  const text =
    matchInfo.players.length !== matchInfo.playerCount
      ? "⏳ _Когда соберутся все игроки, и до матча останется час, бот отправит сообщение с балансными составами._ "
      : "👍 _Все игроки собраны, за час до игры будут опубликованы составы._";
  return {
    text: `
⚽️ *Матч ${matchInfo.status === "active" ? "активен" : "завершен"}* *ID:* \`${
      matchInfo.id
    }\` ${userText}

${infoMatch(matchInfo)}

👤 *Список игроков ${matchInfo?.players?.length}/${matchInfo.playerCount}: *  
${
  matchInfo?.players?.length > 0
    ? generatePlayerList(matchInfo?.players || [], matchInfo.playerCount)
    : "🚫 Пусто"
}

${text}  
`,
    parse_mode: "Markdown",
  };
};

const pendingMessageForAllGenerate = (matchInfo) => {
  const text =
    matchInfo.status === "pending"
      ? "👍 _Не меняйте составы! Админы после игры не забудьте внести результаты._"
      : "🏁 Матч окончен";

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

async function createMatchPendingMessage(bot, matchId) {
  const matchInfo = await getMatchById(matchId);

  if (!matchInfo) {
    return;
  }
  const messageForAll = pendingMessageForAllGenerate(matchInfo);

  await bot.telegram.sendMessage(CHAT_ID, messageForAll, {
    parse_mode: "Markdown",
  });
}

async function createMatchMessage(
  bot,
  matchId,
  messageId = null,
  userAction = {}
) {
  // Скопировал времени нет из admin,.js
  const matchInfo = await getMatchById(matchId);

  if (!matchInfo) {
    return;
  }

  const messageForAll = messageForAllGenerate(matchInfo, userAction);

  let keyboardActions = [];

  if (matchInfo.status === "active") {
    keyboardActions = [
      [
        {
          text: "✅️ Записаться на матч",
          callback_data: `match:join:${matchInfo.id}`,
        },
      ],
      [
        {
          text: "❌ Выйти из матча",
          callback_data: `match:leave:${matchInfo.id}`,
        },
      ],
      [{ text: "MENU ☰", callback_data: "start" }],
    ];
  }

  await bot.telegram.sendMessage(CHAT_ID, messageForAll, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: keyboardActions,
    },
  });
}

module.exports = {
  messageForAllGenerate,
  infoMatch,
  generateTeamTable,
  generatePlayerList,
  createMatchMessage,
  createMatchPendingMessage,
};
