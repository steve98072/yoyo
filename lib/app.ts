import { BotFrameworkAdapter, MemoryStorage, ConversationState } from 'botbuilder';
import * as restify from 'restify';
import { ConfState } from './types';

let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`Server is listening on ${server.url}`);
});

const adapter = new BotFrameworkAdapter({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// let conversationState;
// const memoryStorage = new MemoryStorage();
// conversationState = new ConversationState(memoryStorage);
// adapter.use(conversationState);

server.post("/api/messages", (req, res) => {
    adapter.processActivity(req, res, async(context) => {
        if(context.activity.type === "message"){
            // const state = conversationState.get(context);
            await context.sendActivity(`You said ${context.activity.text}`);
        }else{
            await context.sendActivity(`${context.activity.type}`);
        }
    });
});