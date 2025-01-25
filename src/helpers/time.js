const moment = require("moment-timezone");

function isWithinOneHour(date, time) {
  const currentTime = moment.tz("Asia/Baku"); // Текущее время в Азербайджанском времени
  const targetTime = moment.tz(
    `${date} ${time}`,
    "DD.MM.YYYY HH:mm",
    "Asia/Baku"
  );

  // Разница в минутах между текущим временем и целевым временем
  const diffMinutes = targetTime.diff(currentTime, "minutes");

  // Проверяем, что разница лежит в диапазоне от -60 до 0 минут
  return diffMinutes >= 0 && diffMinutes <= 60;
}

module.exports = {
  isWithinOneHour,
};
