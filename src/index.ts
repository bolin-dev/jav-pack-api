import { Hono } from "hono";
import { cache } from "hono/cache";

import { getAVWikiDBTrailer, getJAVDatabaseTrailer } from "./services/trailer";
import { codeValidator } from "./validators/code";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (c) => c.text("Hello, World!"));

app.use("/trailers/*", cache({ cacheName: "trailers" }));

app.get("/trailers/:code", codeValidator("param", "code"), async (c) => {
  const { code } = c.req.valid("param");

  const cacheKey = `trailer:${code}`;
  let trailer = await c.env.KV.get(cacheKey);

  if (trailer === "") {
    c.header("Cache-Control", "public, max-age=300");
    return c.json({ error: "Not Found" }, 404);
  }

  if (trailer) {
    c.header("Cache-Control", "public, max-age=86400");
    return c.json({ trailer });
  }

  trailer = await c.env.DB.prepare("SELECT trailer FROM trailers WHERE code = ? LIMIT 1").bind(code).first("trailer");

  if (trailer) {
    c.executionCtx.waitUntil(c.env.KV.put(cacheKey, trailer, { expirationTtl: 86400 }));
    c.header("Cache-Control", "public, max-age=86400");
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
    c.executionCtx.waitUntil(c.env.KV.put(cacheKey, "", { expirationTtl: 300 }));
    c.header("Cache-Control", "public, max-age=300");
    return c.json({ error: "Not Found" }, 404);
  }

  c.executionCtx.waitUntil(
    Promise.allSettled([
      c.env.DB.prepare("INSERT OR IGNORE INTO trailers (code, trailer) VALUES (?, ?)").bind(code, trailer).run(),
      c.env.KV.put(cacheKey, trailer, { expirationTtl: 86400 }),
    ]),
  );

  c.header("Cache-Control", "public, max-age=86400");
  return c.json({ trailer });
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError((_, c) => c.json({ error: "Internal Server Error" }, 500));

export default app;
