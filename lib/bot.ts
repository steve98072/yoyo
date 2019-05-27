import { TurnContext } from "botbuilder";
import { QnAMaker, LuisRecognizer } from "botbuilder-ai";
import { SpeakerSession } from "./types";
import { getData } from "./parser";
import { createCarousel, createHeroCard } from "./cards";

export class ConfBot {
  private _qnaMaker: QnAMaker;
  private _luis: LuisRecognizer;

  constructor(qnaMaker: QnAMaker, luis: LuisRecognizer) {
    this._qnaMaker = qnaMaker;
    this._luis = luis;
  }

  async onTurn(context: TurnContext) {
    if (context.activity.type === "message") {
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
  }
}
