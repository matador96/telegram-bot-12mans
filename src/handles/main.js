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

const HelpButton = { text: "Помощь", callback_data: "help" };
const StatsButton = { text: "Статистика игроков", callback_data: "stats" };
const CurrentMatchButton = { text: "Текущий матч", callback_data: "current" };
const CHAT_ID = process.env.CHANNEL_ID;

const generatePlayerList = (players) => {
  return players
    .map(
      (player, index) =>
        `${index + 1}. [${player?.fullName}](tg://user?id=${player.telegramId})`
    )
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
  const table = `
**${getEmoji(teamScoreA, teamScoreB)} Команда 1 ${
    matchInfo.manishki === "a" ? "(манишки)" : "(начинают с центра)"
  }**
${generatePlayerList(teamA)}

**${getEmoji(teamScoreB, teamScoreA)}  Команда 2 ${
    matchInfo.manishki === "b" ? "(манишки)" : "(начинают с центра)"
  }**
${generatePlayerList(teamB)}

Счет: ${teamScoreA} : ${teamScoreB}
`;

  return table;
};

const messageForAllGenerate = (matchInfo) => {
  const text =
    matchInfo.players.length !== matchInfo.playerCount
      ? "⏳ _Когда соберутся все игроки, и до матча останется час, бот отправит сообщение с балансными составами._ "
      : "👍 _Все игроки собраны, за час до игры будут опубликованы составы._";
  return {
    text: `
⚽️ *Матч ${matchInfo.status === "active" ? "активен" : "завершен"}* *ID:* \`${
      matchInfo.id
    }\`

${infoMatch(matchInfo)}

👤 *Список игроков ${matchInfo?.players?.length}/${matchInfo.playerCount}: *  
${
  matchInfo?.players?.length > 0
    ? generatePlayerList(matchInfo?.players || [])
    : "🚫 Пусто"
}

${text}  
`,
    parse_mode: "Markdown",
  };
};

async function refreshMatchMessage(bot, matchId) {
  // Скопировал времени нет из admin,.js
  const matchInfo = await getMatchById(matchId);

  if (!matchInfo) {
    return;
  }
  const messageForAll = messageForAllGenerate(matchInfo);

  let keyboardActions = [];

  if (matchInfo.status === "active") {
    keyboardActions = [
      [
        {
          text: "Залететь на матч",
          callback_data: `match:join:${matchInfo.id}`,
        },
      ],
      [
        {
          text: "Ливнуть с матча",
          callback_data: `match:leave:${matchInfo.id}`,
        },
      ],
    ];
  }

  await bot.telegram.editMessageText(
    CHAT_ID,
    matchInfo.messageId,
    null,
    messageForAll,
    {
      reply_markup: {
        inline_keyboard: keyboardActions,
      },
      parse_mode: "Markdown",
    }
  );
}

module.exports = {
  messageForAllGenerate,
  refreshMatchMessage,
  infoMatch,
  generateTeamTable,
  generatePlayerList,
};
