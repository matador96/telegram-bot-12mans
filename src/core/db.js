const fs = require("fs");
const { normalizeUserListWithRating } = require("./../helpers/rating");

const matchesFileName = `matches.json`;

const readFile = async (fileName) => {
  try {
    let data = fs.readFileSync(fileName, "utf8");
    data = JSON.parse(data);
    return data;
  } catch (e) {
    throw Error(e.message);
  }
};

const writeFile = async (data, fileName) => {
  await fs.writeFileSync(fileName, JSON.stringify(data));
};

module.exports.addPlayerToMatch = async (obj, matchId) => {
  let data = await readFile(matchesFileName);
  let currentMatch = data[matchId];

  if (!currentMatch) {
    return "Матч не найден";
  }

  const isHaveInMatch = data[matchId].players.find(
    (e) => e.telegramId === obj.telegramId
  );

  if (isHaveInMatch) {
    return "Вы уже в матче";
  }

  if (data[matchId].players.length >= data[matchId].playerCount) {
    return "Мест нет";
  }

  if (data[matchId].status === "pending") {
    return "Матч уже идет";
  }

  if (data[matchId].status === "finished") {
    return "Матч завершился";
  }

  data[matchId].players.push({ ...obj });

  await writeFile(data, matchesFileName);
  return "Вы присоединились к матчу";
};

module.exports.deletePlayerToMatch = async (obj, matchId) => {
  let data = await readFile(matchesFileName);
  let currentMatch = data[matchId];

  if (!currentMatch) {
    return "Матч не найден";
  }

  if (data[matchId].status === "pending") {
    return "Матч уже идет";
  }

  if (data[matchId].status === "finished") {
    return "Матч завершился";
  }

  const isHaveInMatch = data[matchId].players.find(
    (e) => e.telegramId === obj.telegramId
  );

  if (!isHaveInMatch) {
    return "Вы не в матче итак";
  }

  data[matchId].players = data[matchId].players.filter(
    (e) => e.telegramId !== obj.telegramId
  );

  await writeFile(data, matchesFileName);
  return "Вы покинули матч";
};

module.exports.getCountOfFinishedMatches = async () => {
  const data = await readFile(matchesFileName);

  const matchCount =
    Object.values(data).filter((match) => match.status === "finished")
      ?.length || 0;

  return matchCount;
};

module.exports.getCurrentMatch = async () => {
  const data = await readFile(matchesFileName);
  const match = Object.values(data).find((e) => e.status === "active");
  return match;
};

module.exports.getLastFinishedMatch = async () => {
  const data = await readFile(matchesFileName);
  const matches = Object.values(data);

  const lastMatch = matches
    .filter((match) => match.status === "finished")
    .sort((a, b) => b.id - a.id)[0];

  return lastMatch || null;
};

module.exports.updateMatch = async (id, obj) => {
  const data = await readFile(matchesFileName);

  const res = data?.[id] || null;

  if (!res) {
    return null;
  }

  data[id] = { ...data[id], ...obj };

  await writeFile(data, matchesFileName);
  return data;
};

module.exports.getMatchById = async (id) => {
  const data = await readFile(matchesFileName);

  const res = data?.[id] || null;
  return res;
};

module.exports.getActiveMatch = async (id) => {
  const data = await readFile(matchesFileName);

  const res = data?.[id] || null;
  return res;
};

module.exports.deleteMatchById = async (matchId) => {
  const data = await readFile(matchesFileName);

  if (data[matchId]) {
    delete data[matchId];

    await writeFile({ ...data }, matchesFileName);
  }
};

module.exports.updateMatch = async (matchId, obj) => {
  const data = await readFile(matchesFileName);
  data[matchId] = { ...data[matchId], ...obj };

  await writeFile({ ...data }, matchesFileName);
};

module.exports.getActiveMatch = async (obj) => {
  let data = await readFile(matchesFileName);

  const activeMatch = Object.values(data).find((e) => e.status === "active");

  return activeMatch;
};

module.exports.getAllPlayers = async (obj) => {
  let data = await readFile(matchesFileName);

  const list = normalizeUserListWithRating(data);
  return list;
};

module.exports.getAllPlayersInfoByMatchId = async (matchId) => {
  let data = await readFile(matchesFileName);

  const listWithRating = normalizeUserListWithRating(data);
  const currentMatch = data?.[matchId] || null;

  if (!currentMatch) {
    return [];
  }

  const players = currentMatch.players;

  players.forEach((player) => {
    const user = listWithRating.find((e) => e.telegramId === player.telegramId);

    if (user) {
      player.rating = user.rating;
    }
  });

  return players;
};

module.exports.addMatch = async (obj) => {
  let data = await readFile(matchesFileName);

  data[obj.id] = { ...obj };

  await writeFile(data, matchesFileName);
};

module.exports.initializeDB = async () => {
  if (!fs.existsSync(matchesFileName)) {
    await writeFile({}, matchesFileName);
  }
};
