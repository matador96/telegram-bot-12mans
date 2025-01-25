function normalizeUserListWithRating(data) {
  if (Object.values(data).length === 0) {
    return [];
  }

  const game = Object.values(data)[0]; // Предполагаем, что структура содержит только один объект игры
  const players = game.players;
  const teamScoreA = game.teamScoreA;
  const teamScoreB = game.teamScoreB;

  // Определяем рейтинг команды
  const teamRatings = {
    a: teamScoreA > teamScoreB ? 3 : teamScoreA < teamScoreB ? 0 : 1,
    b: teamScoreB > teamScoreA ? 3 : teamScoreB < teamScoreA ? 0 : 1,
  };

  // Создаём объект для хранения информации о пользователях
  const userInfo = {};

  players.forEach((player) => {
    const { telegramId, userName, fullName, team } = player;

    // Если пользователь уже существует, пропускаем добавление
    if (!userInfo[telegramId]) {
      userInfo[telegramId] = {
        telegramId,
        userName,
        fullName,
        rating: 0, // Изначально рейтинг 0
      };
    }

    // Добавляем рейтинг игроку в зависимости от команды
    userInfo[telegramId].rating += teamRatings[team];
  });

  // Возвращаем список пользователей без дублей
  return Object.values(userInfo).sort((a, b) => b.rating - a.rating);
}

module.exports = {
  normalizeUserListWithRating,
};
