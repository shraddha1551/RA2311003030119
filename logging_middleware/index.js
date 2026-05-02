const LOG_API_URL = "http://20.207.122.201/evaluation-service/logs";

const validStacks = new Set(["backend", "frontend"]);
const validLevels = new Set(["debug", "info", "warn", "error", "fatal"]);
const validPackages = new Set([
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
  "auth",
  "config",
  "middleware",
  "utils",
]);

const Log = async (stack, level, packageName, message) => {
  if (
    !validStacks.has(stack) ||
    !validLevels.has(level) ||
    !validPackages.has(packageName)
  ) {
    return null;
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (process.env.LOG_AUTH_TOKEN) {
    headers.Authorization = `Bearer ${process.env.LOG_AUTH_TOKEN}`;
  }

  try {
    const response = await fetch(LOG_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        stack,
        level,
        package: packageName,
        message,
      }),
    });

    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
};

module.exports = { Log };
