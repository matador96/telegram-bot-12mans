function parseMatchDetails(input) {
  const regex =
    /^\/create (\d{2}\.\d{2}\.\d{4}),(\d{2}:\d{2}),([^,]+),(\d+),([^,]+),(.+)$/;
  const match = input.match(regex);

  if (!match) {
    return "Неверный формат строки";
  }

  const [_, date, time, location, playerCount, prize, additionalDetails] =
    match;

  // Валидация данных
  const isDateValid = /\d{2}\.\d{2}\.\d{4}/.test(date);
  const isTimeValid = /\d{2}:\d{2}/.test(time);
  const isLocationValid = typeof location === "string" && location.length > 0;
  const isPlayerCountValid = !isNaN(playerCount) && playerCount > 0;
  const isPrizeValid = typeof prize === "string" && prize.length > 0;
  const isAdditionalDetailsValid = typeof additionalDetails === "string";

  if (
    !isDateValid ||
    !isTimeValid ||
    !isLocationValid ||
    !isPlayerCountValid ||
    !isPrizeValid ||
    !isAdditionalDetailsValid
  ) {
    return "Некорректные данные";
  }

  const isCan = playerCount % 2 === 0 && playerCount > 5;
  if (!isCan) {
    return "Только четное количество игроков и больше 4";
  }

  return {
    date: date,
    time: time,
    location: location,
    manishki: "a",
    status: "active",
    teamScoreA: 0,
    teamScoreB: 0,
    players: [],
    playerCount: parseInt(playerCount, 10),
    cost: prize,
    additionalDetails: additionalDetails.trim(),
  };
}

function parseDeleteMatchDetails(input) {
  const regex = /^\/delete (\d+)$/;
  const match = input.match(regex);

  if (!match) {
    return "Неверный формат строки";
  }

  const [_, matchId] = match;

  // Валидация данных
  const isMatchIdValid = !isNaN(matchId) && matchId.length >= 10;

  if (!isMatchIdValid) {
    return "Некорректный ID матча";
  }

  return {
    matchId: matchId,
  };
}

function parseMatchResult(command) {
  // Регулярное выражение для проверки и разбора команды
  const regex = /^\/result\s+(\w+)\s+(\d+)-(\d+)$/;
  const match = command.match(regex);

  if (!match) {
    return "Неверный формат команды. Используйте: /result ID_матча 1-1";
  }

  // Извлечение данных
  const matchId = match[1]; // ID матча
  const teamScoreA = parseInt(match[2], 10); // Счёт команды 1
  const teamScoreB = parseInt(match[3], 10); // Счёт команды 2

  // Формируем JSON с результатами
  return {
    matchId,
    teamScoreA,
    teamScoreB,
  };
}

function parseMatchDate(command) {
  // Регулярное выражение для проверки и разбора команды
  const regex = /^\/date\s+(\d+)\s+(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2})$/;
  const match = command.match(regex);

  if (!match) {
    return "Неверный формат команды. Используйте: /date ID_матча ДД.ММ.ГГГГ ЧЧ:ММ";
  }

  // Извлечение данных
  const matchId = match[1]; // ID матча
  const date = match[2]; // Дата матча
  const time = match[3]; // Время матча

  // Возвращаем объект с результатами
  return {
    date,
    time,
    matchId,
  };
}

function parseMatchCost(command) {
  // Регулярное выражение для разбора команды /cost
  const regex = /^\/cost\s+(\d+)\s+(.+)$/;
  const match = command.match(regex);

  if (!match) {
    return "Неверный формат команды. Используйте: /cost ID_матча Любой_Текст";
  }

  // Извлечение данных
  const matchId = match[1];
  const cost = match[2];

  return {
    matchId,
    cost,
  };
}

function parseMatchMans(command) {
  // Регулярное выражение для разбора команды /mans
  const regex = /^\/mans\s+(\d+)\s+(\d+)$/;
  const match = command.match(regex);

  if (!match) {
    return "Неверный формат команды. Используйте: /mans ID_матча Число";
  }

  // Извлечение данных
  const matchId = match[1];
  const mans = match[2];

  return {
    matchId,
    mans,
  };
}

module.exports = {
  parseMatchDetails,
  parseMatchDate,
  parseMatchCost,
  parseDeleteMatchDetails,
  parseMatchResult,
  parseMatchMans,
};
