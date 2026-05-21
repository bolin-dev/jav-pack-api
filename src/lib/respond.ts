import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { JSONObject } from "hono/utils/types";

const statusText = (status: number) => new Response(null, { status }).statusText;

export const respondBody = (c: Context, body: JSONObject, ttl?: number): Response => {
  if (ttl && ttl > 0) c.header("Cache-Control", `public, max-age=${ttl}`);
  return c.json(body);
};

export const respondStatus = (c: Context, status: ContentfulStatusCode, ttl?: number): Response => {
  if (ttl && ttl > 0) c.header("Cache-Control", `public, max-age=${ttl}`);
  return c.json({ [status >= 400 ? "error" : "message"]: statusText(status) }, status);
};
