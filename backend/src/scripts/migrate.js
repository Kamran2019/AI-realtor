const connectDb = require("../config/db");
const models = [
  require("../models/User"),
  require("../models/Property"),
  require("../models/PropertyBookmark"),
  require("../models/PropertyNote"),
  require("../models/AlertRule"),
  require("../models/Notification"),
  require("../models/Inspection"),
  require("../models/Report"),
  require("../models/ScrapeSource"),
  require("../models/ScrapeRun"),
  require("../models/ModelArtifact"),
  require("../models/AIFeedback"),
  require("../models/AuditLog"),
];

async function run() {
  await connectDb();
  for (const model of models) {
    await model.syncIndexes();
  }
  console.log("Indexes synced");
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

