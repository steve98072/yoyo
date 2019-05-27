import { SpeakerSession } from "./types";
import {
  MessageFactory,
  Activity,
  CardFactory,
  Attachment,
  ActionTypes
} from "botbuilder";

export function createCarousel(
  data: SpeakerSession[],
  topIntent: string
): Partial<Activity> {
  const heroCards = [];
  for (let i = 0; i < data.length; i++) {
    heroCards.push(createHeroCard(data[i], topIntent));
  }
  return MessageFactory.carousel(heroCards);
}

export function createHeroCard(
  data: SpeakerSession,
  topIntent: string
): Attachment {
  const images: string[] = [];
  if (data.images != null && data.images.length > 0) {
    for (let i = 0; i < data.images.length; i++) {
      images.push(data.images[i].link);
    }
  }

  let title: string;
  let subtitle: string;
  const text: string = data.description;
  switch (topIntent) {
    case "Speaker":
      title = data.speakers;
      subtitle = data.location;
      break;
    case "Location":
      title = data.location;
      subtitle = `${data.speakers}, ${data.title}`;
      break;
    case "Topic":
      title = data.title;
      subtitle = data.speakers;
      break;
    default:
      throw new Error(`No way to handle ${topIntent}`);
  }

  return CardFactory.heroCard(
    title,
    CardFactory.images(images),
    CardFactory.actions([
      {
        type: ActionTypes.PostBack,
        title: "Save",
        value: `SAVE:${data.title}`
      },
      {
        type: ActionTypes.OpenUrl,
        title: "Read more...",
        value: data.link
      }
    ]),
    {
      subtitle: subtitle,
      text: text
    }
  );
}
