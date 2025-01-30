function normalizeUserListWithRating(data) {
  if (Object.keys(data).length === 0) {
    return [];
  }

  const userInfo = {};

  Object.values(data).forEach((game) => {
    const { players, teamScoreA, teamScoreB, status } = game;

    if (status === "finished") {
      const teamRatings = {
        a: teamScoreA > teamScoreB ? 3 : teamScoreA < teamScoreB ? 0 : 1,
        b: teamScoreB > teamScoreA ? 3 : teamScoreB < teamScoreA ? 0 : 1,
      };

      players.forEach((player) => {
        const { telegramId, fullName, team } = player;

        if (!userInfo[telegramId]) {
          userInfo[telegramId] = {
            telegramId,
            fullName,
            rating: 0,
            winCount: 0, // Счетчик побед
          };
        }

        userInfo[telegramId].rating += teamRatings[team];

        // Увеличиваем счетчик побед, если команда игрока выиграла
        if (teamRatings[team] === 3) {
          userInfo[telegramId].winCount += 1;
        }
      });
    }
  });

  return Object.values(userInfo).sort((a, b) => b.rating - a.rating);
}

module.exports = {
  normalizeUserListWithRating,
};
