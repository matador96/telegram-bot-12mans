const cron = require("node-cron");
const {
  getActiveMatch,
  updateMatch,
  getAllPlayersInfoByMatchId,
} = require("./db");
const { isWithinOneHour } = require("../helpers/time");
const { bot } = require("./bot");
const { refreshMessagePending } = require("../handles/admin");
const CHAT_ID = process.env.CHANNEL_ID;

const getRandomTeam = () => {
  // Сгенерировать случайное число: 0 или 1
  const randomChoice = Math.random() < 0.5 ? "a" : "b";
  return randomChoice;
};

function dividePlayers(players) {
  // Сортируем игроков по силе в порядке убывания
  players.sort((a, b) => b.rating - a.rating);

  // Инициализация команд
  const teamA = [];
  const teamB = [];
  let totalRatingA = 0;
  let totalRatingB = 0;

  // Распределение игроков
  players.forEach((player) => {
    if (totalRatingA <= totalRatingB) {
      teamA.push(player.telegramId);
      totalRatingA += player.rating;
    } else {
      teamB.push(player.telegramId);
      totalRatingB += player.rating;
    }
  });

  return { teamA, teamB };
}

cron.schedule("*/5 * * * * *", async () => {
  const activeMatch = await getActiveMatch();

  if (!activeMatch) return;

  if (activeMatch.players.length !== activeMatch.playerCount) return;

  if (!isWithinOneHour(activeMatch.date, activeMatch.time)) return;

  const matchId = activeMatch.id;
  const messageId = activeMatch?.messageId;

  if (!messageId) return;

  await bot.telegram.sendMessage(
    CHAT_ID,
    "Братья до матча остался часик, составы поделены",
    {
      parse_mode: "html",
      reply_to_message_id: messageId,
    }
  );

  const manishki = getRandomTeam();

  const playersOfMatchWithRatings = await getAllPlayersInfoByMatchId(
    activeMatch.id
  );

  const { teamA, teamB } = dividePlayers(playersOfMatchWithRatings);

  const activeMatchPlayersWithTeams = activeMatch.players.map((player) => {
    return {
      ...player,
      team: teamA.includes(player.telegramId) ? "a" : "b",
    };
  });

  const updatedMatch = {
    status: "pending",
    manishki,
    players: activeMatchPlayersWithTeams,
  };

  await updateMatch(matchId, updatedMatch);
  await refreshMessagePending(bot, matchId);
});
