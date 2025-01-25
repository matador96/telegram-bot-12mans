const app = require("express")();
const bodyParser = require("body-parser");
const compression = require("compression");
const scenes = require("./src/scenes");
const { bot } = require("./src/core/bot");
const { initializeDB } = require("./src/core/db");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(compression());

require("./src/core/cron");

const server = app.listen(process.env.PORT, () =>
  console.log(`Listening on port ${process.env.PORT}`)
);

(async function () {
  await initializeDB();
})();

scenes(bot);

console.log(`Bot is launched`);
