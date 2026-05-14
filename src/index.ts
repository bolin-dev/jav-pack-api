import { Hono } from "hono";
import { cors } from "hono/cors";

import { helmet } from "./middlewares/helmet";
import trailers from "./routes/trailers";

const app = new Hono();

app.use(helmet());
app.use(cors());

app.get("/", (c) => c.json({ status: "ok" }));
app.route("/trailers", trailers);

app.notFound((c) => c.json({ error: "Not Found" }, 404));
app.onError((_, c) => c.json({ error: "Internal Server Error" }, 500));

export default app;
