import type { ValidationTargets } from "hono";
import { validator } from "hono/validator";

import { respondStatus } from "@/lib/respond";

export const codeValidator = (target: keyof ValidationTargets, field: string) => {
  return validator(target, (value, c) => {
    const normalized = value?.[field]?.toString().trim().toUpperCase() ?? "";
    return /^[A-Z]{2,8}-\d{2,6}$/.test(normalized) ? { [field]: normalized } : respondStatus(c, 400, 86400);
  });
};
