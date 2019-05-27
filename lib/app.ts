import { BotFrameworkAdapter } from "botbuilder";
import { QnAMaker, LuisRecognizer } from "botbuilder-ai";
import {
  IQnAService,
  ILuisService,
  BotConfiguration
} from "botframework-config";
import * as restify from "restify";
import { ConfBot } from "./bot";
import { config } from "dotenv";

config(); // read .env file

const botConfig = BotConfiguration.loadSync(
  "./bots/conf-edui2018.bot",
  process.env.BOT_FILE_SECRET
);

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`Server is listening on ${server.url}`);
});

const adapter = new BotFrameworkAdapter({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});

const qnaMaker = new QnAMaker({
  knowledgeBaseId: (<IQnAService>botConfig.findServiceByNameOrId("qna")).kbId,
  endpointKey: (<IQnAService>botConfig.findServiceByNameOrId("qna"))
    .endpointKey,
  host: (<IQnAService>botConfig.findServiceByNameOrId("qna")).hostname
});

const luis = new LuisRecognizer({
  applicationId: (<ILuisService>(
    botConfig.findServiceByNameOrId("edui2018-test")
  )).appId,
  endpointKey: (<ILuisService>botConfig.findServiceByNameOrId("edui2018-test"))
    .subscriptionKey,
  endpoint: (<ILuisService>(
    botConfig.findServiceByNameOrId("edui2018-test")
  )).getEndpoint()
});

const echo: ConfBot = new ConfBot(qnaMaker, luis);

server.post("/api/messages", (req, res) => {
  adapter.processActivity(req, res, async context => {
    await echo.onTurn(context);
  });
});
