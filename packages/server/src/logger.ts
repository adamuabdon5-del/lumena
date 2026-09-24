import pino from "pino";
import { pinoHttp } from "pino-http";
import type { IncomingMessage } from "node:http";
import { randomUUID } from "node:crypto";

const VALID_LOG_LEVELS = ["trace", "debug", "info", "warn", "error", "fatal"] as const;
type LogLevel = (typeof VALID_LOG_LEVELS)[number];

function resolveLogLevel(): LogLevel {
  const raw = process.env.LUMEN_LOG_LEVEL;
  if (raw && (VALID_LOG_LEVELS as readonly string[]).includes(raw)) {
    return raw as LogLevel;
  }
  return "info";
}

const logLevel = resolveLogLevel();

export const logger = pino({
  level: logLevel,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.secret",
      "*.privateKey",
      "*.secretSeed",
      "*.authorization",
      "*.token",
      "password",
      "secret",
      "secretSeed",
      "privateKey",
      "authorization",
      "token",
      "cosignerSecret",
      "feePayerSecret",
      "sponsorSecret",
    ],
    censor: "[REDACTED]",
  },
});

export const httpLogger = (pinoHttp as unknown as typeof pinoHttp)({
  logger,
  genReqId: (req: IncomingMessage) => (req.headers["x-request-id"] as string) || randomUUID(),
  customAttributeKeys: {
    req: "req",
    res: "res",
    err: "err",
    responseTime: "responseTime",
  },
});
