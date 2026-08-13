export const DEV = true

type LogLevel = "log" | "info" | "warn" | "error" | "debug"

const NOOP = (..._args: unknown[]) => {}

function getConsole(level: LogLevel): (...args: unknown[]) => void {
  if (!DEV) return NOOP
  return console[level].bind(console)
}

export const logger = {
  log: getConsole("log"),
  info: getConsole("info"),
  warn: getConsole("warn"),
  error: getConsole("error"),
  debug: getConsole("debug"),
}