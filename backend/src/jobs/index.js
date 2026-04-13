const cron = require("node-cron");
const { runDailyAlertEvaluation } = require("../services/alert.service");
const { refreshScrapeSchedules } = require("../services/scraper.service");

let alertTask;

async function startSchedulers() {
  await refreshScrapeSchedules();

  if (!alertTask) {
    alertTask = cron.schedule("0 7 * * *", async () => {
      await runDailyAlertEvaluation();
    });
  }
}

module.exports = {
  startSchedulers,
};
