import { Hono } from "hono";

import AVWikiDB from "./services/AVWikiDB";
import JAVDatabase from "./services/JAVDatabase";
import codeValidator from "./validators/code";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (c) => c.text("Hello, World!"));

app.get("/trailers/:code", codeValidator("param", "code"), (c) => {
  const { code } = c.req.valid("param");

  return Promise.any([AVWikiDB.getTrailer(code), JAVDatabase.getTrailer(code)])
    .then((res) => c.json(res))
    .catch(() => c.notFound());
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError((_, c) => c.json({ error: "Internal Server Error" }, 500));

export default app;
