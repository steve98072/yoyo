import {
  BotFrameworkAdapter,
  MemoryStorage,
  ConversationState
} from "botbuilder";
import * as restify from "restify";
import { EchoBot } from "./bot";

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`Server is listening on ${server.url}`);
});

const adapter = new BotFrameworkAdapter({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});

const echo: EchoBot = new EchoBot();

server.post("/api/messages", (req, res) => {
  adapter.processActivity(req, res, async context => {
    await echo.onTurn(context);
  });
});
