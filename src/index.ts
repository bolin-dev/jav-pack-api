import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";

import trailers from "./routes/trailers";

const app = new Hono();

app.use(secureHeaders({ crossOriginResourcePolicy: "cross-origin" }));
app.use(cors({ allowMethods: ["GET"] }));
app.use(timeout(10000));

app.get("/", (c) => c.json({ message: "OK" }));
app.route("/", trailers);

app.notFound((c) => c.json({ error: "Not Found" }, 404));
app.onError((_, c) => c.json({ error: "Internal Server Error" }, 500));

export default app;
