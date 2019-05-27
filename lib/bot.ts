import { TurnContext, ConversationState, BotAdapter } from "botbuilder";
import { QnAMaker, LuisRecognizer } from "botbuilder-ai";
import { SpeakerSession } from "./types";
import { getData } from "./parser";
import { getTime } from "./dialogs";
import { createCarousel, createHeroCard } from "./cards";
import {
  DialogSet,
  WaterfallDialog,
  ChoicePrompt,
  WaterfallStepContext,
  PromptOptions
} from "botbuilder-dialogs";
import { saveRef, subscribe } from "./proactive";
import { BlobStorage } from "botbuilder-azure";

export class ConfBot {
  private _qnaMaker: QnAMaker;
  private _luis: LuisRecognizer;
  private _dialogs: DialogSet;
  private _conversationState: ConversationState;
  private _storage: BlobStorage;
  private _adapter: BotAdapter;
  private _savedSession: string[];

  constructor(
    qnaMaker: QnAMaker,
    luis: LuisRecognizer,
    dialogs: DialogSet,
    conversationState: ConversationState,
    storage: BlobStorage,
    adapter: BotAdapter,
    savedSession: string[]
  ) {
    this._qnaMaker = qnaMaker;
    this._luis = luis;
    this._dialogs = dialogs;
    this._conversationState = conversationState;
    this._storage = storage;
    this._adapter = adapter;
    this._savedSession = savedSession;
    this.addDialogs();
  }

  async onTurn(context: TurnContext) {
    const dc = await this._dialogs.createContext(context);
    await dc.continueDialog();
    if (context.activity.text !== null && context.activity.text === "help") {
      await dc.beginDialog("help");
    }
    if (context.activity.type === "message") {
      const userId: string = await saveRef(
        TurnContext.getConversationReference(context.activity),
        this._storage
      );
      await subscribe(userId, this._storage, this._adapter, this._savedSession);
      const qnaResults = await this._qnaMaker.generateAnswer(
        context.activity.text
      );
      if (qnaResults.length > 0) {
        await context.sendActivity(qnaResults[0].answer);
      } else {
        await this._luis.recognize(context).then(res => {
          const top = LuisRecognizer.topIntent(res);
          const data: SpeakerSession[] = getData(res.entities);
          if (top === "Time") {
            dc.beginDialog("time", data);
          } else if (data.length > 1) {
            context.sendActivity(createCarousel(data, top));
          } else if (data.length === 1) {
            context.sendActivity({
              attachments: [createHeroCard(data[0], top)]
            });
          }
        });
      }
    } else {
      await context.sendActivity(`${context.activity.type} event detected`);
    }
    await this._conversationState.saveChanges(context);
  }

  private addDialogs(): void {
    this._dialogs.add(
      new WaterfallDialog("help", [
        async (step: WaterfallStepContext) => {
          const choices = [
            "I want to know about a topic",
            "I want to know about a speaker",
            "I want to know about a venue"
          ];
          const options: PromptOptions = {
            prompt: "What would you like to know?",
            choices: choices
          };
          return await step.prompt("choicePrompt", options);
        },
        async (step: WaterfallStepContext) => {
          switch (step.result.index) {
            case 0:
              await step.context.sendActivity(`You can ask:
                        * _Is there a chatbot presentation?_
                        * _What is Michael Szul speaking about?_
                        * _Are there any Xamarin talks?_`);
              break;
            case 1:
              await step.context.sendActivity(`You can ask:
                        * _Who is speaking about bots?_
                        * _Where is giving the Bot Framework talk?_
                        * _Who is speaking Rehearsal A?_`);
              break;
            case 2:
              await step.context.sendActivity(`You can ask:
                        * _Where is Michael Szul talking?_
                        * _Where is the Bot Framework talk?_
                        * _What time is the Bot Framework talk?_`);
              break;
            default:
              break;
          }
          return await step.endDialog();
        }
      ])
    );

    this._dialogs.add(new ChoicePrompt("choicePrompt"));

    this._dialogs.add(
      new WaterfallDialog("time", [
        async (step: WaterfallStepContext) => {
          await step.context.sendActivities(
            getTime(step.activeDialog.state.options)
          );
          return await step.endDialog();
        }
      ])
    );
  }
}
