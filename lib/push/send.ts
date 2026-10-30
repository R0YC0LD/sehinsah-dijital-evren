import "server-only";
import webpush from "web-push";
import { configureWebPush } from "@/lib/push/vapid";
import {
  listSubscriptions,
  removeSubscription,
  type PushTopics,
  type StoredSubscription,
} from "@/lib/push/store";

export type PushPayload = {
  title: string;
  body: string;
  /** Tıklayınca açılacak site içi yol (ör. /muzik/70lik-2026, /#takvim). */
  url: string;
  tag?: string;
  image?: string;
};

export type SendResult = { sent: number; removed: number; failed: number };

const CONCURRENCY = 25;
const TTL_SECONDS = 60 * 60 * 12;

type Outcome = "sent" | "removed" | "failed";

async function sendOne(subscription: StoredSubscription["sub"], payload: PushPayload): Promise<Outcome> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      TTL: TTL_SECONDS,
      urgency: "normal",
      timeout: 8000,
    });
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    // 404/410: abonelik artık geçerli değil (kullanıcı izni kaldırdı / tarayıcı sildi) → listeden çıkar.
    if (status === 404 || status === 410) {
      await removeSubscription(subscription.endpoint);
      return "removed";
    }
    return "failed";
  }
}

export async function sendToSubscription(
  subscription: StoredSubscription["sub"],
  payload: PushPayload,
): Promise<Outcome> {
  if (!(await configureWebPush())) throw new Error("push_not_configured");
  return sendOne(subscription, payload);
}

/** Konuya (releases/concerts) abone olan herkese gönderir; ölü abonelikleri temizler. */
export async function sendToTopic(topic: keyof PushTopics, payload: PushPayload): Promise<SendResult> {
  if (!(await configureWebPush())) throw new Error("push_not_configured");

  const targets = (await listSubscriptions()).filter((s) => s.topics?.[topic]);
  const result: SendResult = { sent: 0, removed: 0, failed: 0 };

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const outcomes = await Promise.all(targets.slice(i, i + CONCURRENCY).map((s) => sendOne(s.sub, payload)));
    for (const outcome of outcomes) result[outcome] += 1;
  }
  return result;
}
