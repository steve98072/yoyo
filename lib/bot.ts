import { TurnContext } from "botbuilder";

export class EchoBot {
  async onTurn(context: TurnContext) {
    if (context.activity.type === "message") {
      await context.sendActivity(`You really did say ${context.activity.text}`);
    } else {
      await context.sendActivity(`${context.activity.type} event detected`);
    }
  }
}
