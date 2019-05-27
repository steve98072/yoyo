import { ConversationReference, BotAdapter, TurnContext } from "botbuilder";
import { BlobStorage } from "botbuilder-azure";

export async function saveRef(
  ref: Partial<ConversationReference>,
  storage: BlobStorage
): Promise<string> {
  const changes = {};
  changes[`reference/${ref.activityId}`] = ref;
  await storage.write(changes);
  return await ref.activityId;
}

export async function subscribe(
  userId: string,
  storage: BlobStorage,
  adapter: BotAdapter,
  savedSessions: string[]
): Promise<any> {
  setTimeout(async () => {
    const ref = await getRef(userId, storage);
    if (ref) {
      await adapter.continueConversation(ref, async (context: TurnContext) => {
        await context.sendActivity("Proactive message sent");
      });
    }
  }, 3000);
}

async function getRef(
  userId: string,
  storage: BlobStorage,
  savedSessions?: string[]
): Promise<any> {
  const key = `reference/${userId}`;
  var r = await storage.read([key]);
  // if (
  //   r[key]["speakersessions"] !== undefined &&
  //   savedSessions != null &&
  //   savedSessions.length === 0
  // ) {
  //   savedSessions = JSON.parse(r[key]["speakersessions"]);
  // }
  return Promise.resolve(r[key]);
}
