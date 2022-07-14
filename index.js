require("dotenv").config();
const { Telegraf } = require("telegraf");

const helpMessage = `
This is the help message
/start to start the bot
/help to show how to use the bot
`;

let message = "";

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command("quit", (ctx) => {
  // Explicit usage
  ctx.telegram.leaveChat(ctx.message.chat.id);

  // Using context shortcut
  ctx.leaveChat();
});

bot.start((ctx) => {
  ctx.reply("Hi I am Sudanese Speech To Text Bot");
  ctx.reply(helpMessage);
});

bot.help((ctx) => {
  ctx.reply(helpMessage);
});

bot.on("text", (ctx) => {
  // Explicit usage
  //   ctx.telegram.sendMessage(ctx.message.chat.id, `Hello ${ctx.state.role}`);

  // Using context shortcut
  message = ctx.message.text;
  bot.telegram.sendMessage("-721517271", ctx.message.text);
  ctx.reply(`Hello @${ctx.message.from.username}.`);
});

bot.on("voice", (ctx) => {
  if (message) bot.telegram.sendMessage("-721517271", message); // suppose to be the labels
  bot.telegram.sendVoice("-721517271", ctx.message.voice.file_id);
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
