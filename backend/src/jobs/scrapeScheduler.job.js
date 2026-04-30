const ScrapeSource = require("../models/ScrapeSource");
const scraperRunner = require("../services/scraperRunner.service");
const logger = require("../utils/logger");

const DEFAULT_INTERVAL_MS = 60 * 1000;
const lastScheduledMinutes = new Map();

const expandCronField = (field, min, max) => {
  if (field === "*") {
    return null;
  }

  if (field.startsWith("*/")) {
    const step = Number(field.slice(2));

    if (!Number.isInteger(step) || step <= 0) {
      return new Set();
    }

    const values = [];
    for (let value = min; value <= max; value += 1) {
      if ((value - min) % step === 0) {
        values.push(value);
      }
    }

    return new Set(values);
  }

  return new Set(
    field
      .split(",")
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= min && value <= max)
  );
};

const matchesField = (allowedValues, value) => !allowedValues || allowedValues.has(value);

const cronMatchesDate = (cron, date) => {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = String(cron).trim().split(/\s+/);

  if (!dayOfWeek) {
    return false;
  }

  const dayOfWeekValue = date.getDay();
  const normalizedDayOfWeek = dayOfWeekValue === 0 ? 7 : dayOfWeekValue;

  return (
    matchesField(expandCronField(minute, 0, 59), date.getMinutes()) &&
    matchesField(expandCronField(hour, 0, 23), date.getHours()) &&
    matchesField(expandCronField(dayOfMonth, 1, 31), date.getDate()) &&
    matchesField(expandCronField(month, 1, 12), date.getMonth() + 1) &&
    (matchesField(expandCronField(dayOfWeek, 0, 7), dayOfWeekValue) ||
      matchesField(expandCronField(dayOfWeek, 0, 7), normalizedDayOfWeek))
  );
};

const runDueSources = async (now = new Date()) => {
  const minuteKey = now.toISOString().slice(0, 16);
  const sources = await ScrapeSource.find({ isEnabled: true });

  await Promise.all(
    sources.map(async (source) => {
      const sourceKey = source._id.toString();

      if (!cronMatchesDate(source.cron, now) || lastScheduledMinutes.get(sourceKey) === minuteKey) {
        return;
      }

      lastScheduledMinutes.set(sourceKey, minuteKey);

      try {
        await scraperRunner.runSource({
          ownerUserId: source.ownerUserId,
          sourceId: source._id
        });
      } catch (error) {
        logger.warn(`Scheduled scrape skipped for ${source.key}: ${error.message}`);
      }
    })
  );
};

const startScrapeScheduler = ({ intervalMs = DEFAULT_INTERVAL_MS } = {}) => {
  const timer = setInterval(() => {
    runDueSources().catch((error) => {
      logger.error("Scheduled scrape check failed", error);
    });
  }, intervalMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return {
    stop: () => clearInterval(timer)
  };
};

module.exports = {
  cronMatchesDate,
  runDueSources,
  startScrapeScheduler
};
