const cron = require("node-cron");
const {
  getActiveMatch,
  updateMatch,
  getAllPlayersInfoByMatchId,
} = require("./db");
const { isWithinOneHour } = require("../helpers/time");
const { bot } = require("./bot");
const { createMatchPendingMessage } = require("../handles/main");

const getRandomTeam = () => {
  // Сгенерировать случайное число: 0 или 1
  const randomChoice = Math.random() < 0.5 ? "a" : "b";
  return randomChoice;
};

function dividePlayers(players) {
  // Сортируем игроков по рейтингу в порядке убывания
  players.sort((a, b) => b.rating - a.rating);

  // Если количество игроков нечетное, находим игрока с наименьшим рейтингом
  let extraPlayer = null;
  if (players.length % 2 !== 0) {
    extraPlayer = players.pop();
  }

  // Инициализация команд
  const teamA = [];
  const teamB = [];
  let totalRatingA = 0;
  let totalRatingB = 0;

  // Распределение игроков по принципу "змейки"
  players.forEach((player, index) => {
    if (index % 2 === 0) {
      teamA.push(player.telegramId);
      totalRatingA += player.rating;
    } else {
      teamB.push(player.telegramId);
      totalRatingB += player.rating;
    }
  });

  // Добавляем лишнего игрока в команду с меньшим рейтингом
  if (extraPlayer) {
    if (totalRatingA <= totalRatingB) {
      teamA.push(extraPlayer.telegramId);
      totalRatingA += extraPlayer.rating;
    } else {
      teamB.push(extraPlayer.telegramId);
      totalRatingB += extraPlayer.rating;
    }
  }

  return { teamA, teamB };
}

cron.schedule("*/5 * * * * *", async () => {
  const activeMatch = await getActiveMatch();

  if (!activeMatch) return;

  if (!isWithinOneHour(activeMatch.date, activeMatch.time)) return;

  const matchId = activeMatch.id;

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
  await createMatchPendingMessage(bot, matchId);
});
