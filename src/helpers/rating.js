function normalizeUserListWithRating(data) {
  if (Object.keys(data).length === 0) {
    return [];
  }

  const userInfo = {};

  Object.values(data).forEach((game) => {
    const { players, teamScoreA, teamScoreB, status } = game;

    // Определяем рейтинг команды

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
          };
        }

        // Суммируем рейтинг игрока за все игры
        userInfo[telegramId].rating += teamRatings[team];
      });
    }
  });

  // Возвращаем отсортированный список пользователей
  return Object.values(userInfo).sort((a, b) => b.rating - a.rating);
}

module.exports = {
  normalizeUserListWithRating,
};
