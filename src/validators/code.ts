import { ValidationTargets } from "hono";
import { validator } from "hono/validator";

const codeValidator = (target: keyof ValidationTargets, field: string) => {
  return validator(target, (value, c) => {
    const normalized = value?.[field]?.toString().trim().toUpperCase() ?? "";
    return /^[A-Z0-9-_]{4,}$/.test(normalized) ? { [field]: normalized } : c.json({ error: `${field} is invalid` }, 400);
  });
};

export default codeValidator;
