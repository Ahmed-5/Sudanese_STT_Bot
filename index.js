require("dotenv").config();
const { Telegraf } = require("telegraf");
const { google } = require("googleapis");
const express = require('express')
const expressApp = express()

const port = process.env.PORT || 5000
expressApp.get('/', (req, res) => {
  res.send('Hello World!')
})
expressApp.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

const spreadsheetId = "1TzEeyni-DrH2gjiXZtgpDJR18-oCm2vnQloNtc4cBE8";

const helpMessage = `
/start to start the bot
/help to show how to use the bot
`;

const creds = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
};

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const initGoogle = async () => {
  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });
  return { client, googleSheets };
};

const bot = new Telegraf(process.env.BOT_TOKEN);

initGoogle()
  .then(async ({ client, googleSheets }) => {
    let message = "";
    let index = 0;
    let length = 0;

    let getRows = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "Sheet1!A:A",
    });

    // console.log("ready");
    // console.log(getRows.data);

    bot.start((ctx) => {
      ctx.reply("Hi I am Sudanese Speech To Text Bot");
      ctx.reply(helpMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Start Recording", callback_data: "record" }],
          ],
        },
      });
    });

    bot.help((ctx) => {
      ctx.reply(helpMessage);
    });

    bot.on("text", (ctx) => {
      ctx.reply(`Hello @${ctx.message.from.username}.`);
    });

    bot.on("voice", (ctx) => {
      if (message) bot.telegram.sendMessage("-721517271", message); // suppose to be the labels
      bot.telegram.sendVoice("-721517271", ctx.message.voice.file_id);
    });

    bot.action("record", async (ctx) => {
      getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: "Sheet1!A:A",
      });
      length = getRows.data.values.length;
      index = 0;
      if (getRows.data.values[0] !== undefined) {
        ctx.deleteMessage();
        message = getRows.data.values[0][0];
        ctx.reply(message, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "prev", callback_data: "prev" },
                { text: "next", callback_data: "next" },
              ],
              [{ text: "refresh", callback_data: "record" }],
            ],
          },
        });
      }
    });

    bot.action("next", async (ctx) => {
      ctx.deleteMessage();
      index = (index - 1 + length) % length;
      message = getRows.data.values[index][0];
      ctx.reply(message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "prev", callback_data: "prev" },
              { text: "next", callback_data: "next" },
            ],
            [{ text: "refresh", callback_data: "refresh" }],
          ],
        },
      });
    });

    bot.action("prev", async (ctx) => {
      ctx.deleteMessage();
      index = (index - 1 + length) % length;
      message = getRows.data.values[index][0];
      ctx.reply(message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "prev", callback_data: "prev" },
              { text: "next", callback_data: "next" },
            ],
            [{ text: "refresh", callback_data: "record" }],
          ],
        },
      });
    });

    bot.launch();

    // Enable graceful stop
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  })
  .catch((e) => {
    console.log(e);
    console.log(e.validateStatus);
  });
