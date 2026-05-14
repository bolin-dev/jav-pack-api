import { createMiddleware } from "hono/factory";

export const helmet = () => {
  return createMiddleware(async (c, next) => {
    await next();
    c.res.headers.set("X-Content-Type-Options", "nosniff");
  });
};
