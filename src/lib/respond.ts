import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { JSONObject } from "hono/utils/types";

type LogEvent = "kv_hit" | "db_hit" | "fetch_hit";

const logEntry = ({ req }: Context, status = 200) => ({ message: `${req.method} ${req.url}`, status });

const statusText = (status: number) => new Response(null, { status }).statusText;

export const respondBody = (c: Context, body: JSONObject, ttl?: number, event?: LogEvent): Response => {
  if (event) console.info({ ...logEntry(c), event, ...body });

  if (ttl && ttl > 0) c.header("Cache-Control", `public, max-age=${ttl}`);
  return c.json(body);
};

export const respondStatus = (c: Context, status: ContentfulStatusCode, ttl?: number, needLog?: boolean): Response => {
  if (needLog) console[status >= 400 ? "error" : "info"](logEntry(c, status));

  if (ttl && ttl > 0) c.header("Cache-Control", `public, max-age=${ttl}`);
  return c.json({ [status >= 400 ? "error" : "message"]: statusText(status) }, status);
};
