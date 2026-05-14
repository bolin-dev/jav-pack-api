import { Hono } from "hono";
import { cache } from "hono/cache";

import { getAVWikiDBTrailer, getJAVDatabaseTrailer } from "../services/trailer";
import { codeValidator } from "../validators/code";

const ROUTE = "trailers";

const trailers = new Hono<{ Bindings: CloudflareBindings }>();

trailers.use("*", cache({ cacheName: ROUTE }));

trailers.get("/:code", codeValidator("param", "code"), async (c) => {
  const { code } = c.req.valid("param");
  const { TTL_HIT, TTL_MISS } = c.env;

  const cacheKey = `${ROUTE}:${code}`;
  let trailer = await c.env.KV.get(cacheKey, { cacheTtl: TTL_HIT });

  if (trailer === "") {
    c.header("Cache-Control", `public, max-age=${TTL_MISS}`);
    return c.json({ error: "Not Found" }, 404);
  }

  if (trailer) {
    c.header("Cache-Control", `public, max-age=${TTL_HIT}`);
    return c.json({ trailer });
  }

  trailer = await c.env.DB.prepare("SELECT trailer FROM trailers WHERE code = ?").bind(code).first("trailer");

  if (trailer) {
    c.executionCtx.waitUntil(c.env.KV.put(cacheKey, trailer, { expirationTtl: TTL_HIT }));
    c.header("Cache-Control", `public, max-age=${TTL_HIT}`);
    return c.json({ trailer });
  }

  const controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(5_000)]);

  try {
    const result = await Promise.any([getAVWikiDBTrailer(code, signal), getJAVDatabaseTrailer(code, signal)]).finally(() => controller.abort());

    const { protocol, href } = new URL(result);
    if (!protocol.startsWith("http")) throw new Error();

    trailer = href;
  } catch {
    c.executionCtx.waitUntil(c.env.KV.put(cacheKey, "", { expirationTtl: TTL_MISS }));
    c.header("Cache-Control", `public, max-age=${TTL_MISS}`);
    return c.json({ error: "Not Found" }, 404);
  }

  c.executionCtx.waitUntil(
    Promise.allSettled([
      c.env.DB.prepare("INSERT OR IGNORE INTO trailers (code, trailer) VALUES (?, ?)").bind(code, trailer).run(),
      c.env.KV.put(cacheKey, trailer, { expirationTtl: TTL_HIT }),
    ]),
  );

  c.header("Cache-Control", `public, max-age=${TTL_HIT}`);
  return c.json({ trailer });
});

export default trailers;
