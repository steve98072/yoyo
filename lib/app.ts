import {
  BotFrameworkAdapter,
  ConversationState,
  MemoryStorage
} from "botbuilder";
import { QnAMaker, LuisRecognizer } from "botbuilder-ai";
import {
  IQnAService,
  ILuisService,
  BotConfiguration
} from "botframework-config";
import * as restify from "restify";
import { DialogSet } from "botbuilder-dialogs";
import { BlobStorage } from "botbuilder-azure";
import { ConfBot } from "./bot";
import { config } from "dotenv";

const path = require("path");
config({ path: path.resolve(__dirname, "../.env") }); // read .env file

const botConfig = BotConfiguration.loadSync(
  "./bots/conf-edui2018.bot",
  process.env.BOT_FILE_SECRET
);

const blobStorage = new BlobStorage({
  containerName: process.env.CONTAINER,
  storageAccessKey: process.env.STORAGEKEY,
  storageAccountOrConnectionString: process.env.STORAGENAME
});

const conversationState = new ConversationState(blobStorage);
const dialogs = new DialogSet(conversationState.createProperty("dialogState"));

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

const savedSession: string[] = [];

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

const echo: ConfBot = new ConfBot(
  qnaMaker,
  luis,
  dialogs,
  conversationState,
  blobStorage,
  adapter,
  savedSession
);

server.post("/api/messages", (req, res) => {
  adapter.processActivity(req, res, async context => {
    await echo.onTurn(context);
  });
});
