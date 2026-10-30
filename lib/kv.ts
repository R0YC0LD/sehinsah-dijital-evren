import "server-only";
import { Redis } from "@upstash/redis";

/** Upstash KV (Vercel Storage → KV_REST_API_*). Yoksa null: bağımlı özellikler sessizce devre dışı kalır. */
const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;
export const kv = url && token ? new Redis({ url, token }) : null;
