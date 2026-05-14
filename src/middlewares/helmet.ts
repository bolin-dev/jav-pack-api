import { createMiddleware } from "hono/factory";

export const helmet = () => {
  return createMiddleware(async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
  });
};
