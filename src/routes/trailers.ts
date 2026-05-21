import { Hono } from "hono";
import { cache } from "hono/cache";

import { respondBody, respondStatus } from "@/lib/respond";
import { getAVWikiDBTrailer, getDMMTrailer, getJAVDatabaseTrailer } from "@/services/trailer";
import { codeValidator } from "@/validators/code";

const route = "trailers";
const trailers = new Hono<{ Bindings: CloudflareBindings }>().basePath(`/${route}`);

trailers.use(cache({ cacheName: route }));

trailers.get("/:code", codeValidator("param", "code"), async (c) => {
  const { code } = c.req.valid("param");
  const { TTL_HIT, TTL_MISS } = c.env;

  const key = `${route}:${code}`;
  let trailer = await c.env.KV.get(key, { cacheTtl: TTL_MISS });

  if (trailer === "") return respondStatus(c, 404, TTL_MISS, true);
  if (trailer) return respondBody(c, { trailer }, TTL_HIT, "kv_hit");

  trailer = await c.env.DB.prepare("SELECT trailer FROM trailers WHERE code = ?").bind(code).first("trailer");

  if (trailer) {
    c.executionCtx.waitUntil(c.env.KV.put(key, trailer, { expirationTtl: TTL_HIT }));
    return respondBody(c, { trailer }, TTL_HIT, "db_hit");
  }

  const controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]);

  try {
    const res = await Promise.any([
      getAVWikiDBTrailer(code, signal),
      getDMMTrailer(code, signal),
      getJAVDatabaseTrailer(code, signal),
    ]).finally(() => controller.abort());

    const { protocol, href } = new URL(res);
    if (protocol !== "http:" && protocol !== "https:") throw new Error();

    trailer = href;
  } catch {
    c.executionCtx.waitUntil(c.env.KV.put(key, "", { expirationTtl: TTL_MISS }));
    return respondStatus(c, 404, TTL_MISS, true);
  }

  c.executionCtx.waitUntil(
    Promise.allSettled([
      c.env.DB.prepare("INSERT OR IGNORE INTO trailers (code, trailer) VALUES (?, ?)").bind(code, trailer).run(),
      c.env.KV.put(key, trailer, { expirationTtl: TTL_HIT }),
    ]),
  );

  return respondBody(c, { trailer }, TTL_HIT, "fetch_hit");
});

export default trailers;
