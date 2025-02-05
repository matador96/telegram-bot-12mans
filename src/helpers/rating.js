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
            matchCount: 0,
            winCount: 0, // Счетчик побед
          };
        }

        userInfo[telegramId].rating += teamRatings[team];
        userInfo[telegramId].matchCount += 1;

        if (teamRatings[team] === 3) {
          userInfo[telegramId].winCount += 1;
        }

        userInfo[telegramId].winRate = Math.round(
          (userInfo[telegramId].winCount / userInfo[telegramId].matchCount) *
            100
        );

        // Увеличиваем счетчик побед, если команда игрока выиграла
      });
    }
  });

  return Object.values(userInfo).sort((a, b) => b.rating - a.rating);
}

module.exports = {
  normalizeUserListWithRating,
};
