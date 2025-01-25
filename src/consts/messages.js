module.exports = {
  bot: {
    name: "Meetup Footbal Ranking 2",
    description:
      "Бобро пожаловать на площадку сервиса Экориум. В этом чате мы будем отправлять вам предложения о выкупе вторресурсов конкретного вида на конкурентных условиях. Начнем?",
    shortDescription: "Я железный ботик",
  },
  alreadyRegistered: "Вы уже зарегистрированы",
  successRegistered: "Спасибо за регистрацию, горотдел ауе",
  welcomeTelegramBot: "Бобро пожаловать в телеграм-бот Митап футбол.",
  adminMessage: `
🎾 *Управление матчами* 🎾  

📌 *Создание матча*  
Введите:  
\`/create Дата,время,место проведения,количество игроков,стоимость участия,комментарий\`

не нарушайте порядок! время ставьте правильное, иначе матч не состоится!

*Пример:*  
\`/create 25.01.2021,12:00,Азфар горотдел ауе,10,1000 манатов,Игра на два часа,чай после матча\`

📌 *Удаление матча*  
Введите:  
\`/delete ID_матча\`  

*Пример:*  
\`/delete 1737752761739\`  

📌 *Добавление результата матча* 
Введите:  
\`/result ID_матча 1-1\` *(Команда 1 - Команда 2)*

*Пример:*  
\`/result 1737752761739 6-3\`
`,

  help: `
/start - Меню
/current - Текущий матч
/stats - Рейтинг игроков
/help - Помощь

За победу игроку дается 3 очка, за ничью 1, за поражение 0
пока такой простенький рейтинг.
`,
};
