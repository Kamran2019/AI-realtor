const app = require("./app");
const connectDb = require("./config/db");
const env = require("./config/env");
const { startSchedulers } = require("./jobs");

async function bootstrap() {
  await connectDb();
  await startSchedulers();

  app.listen(env.port, () => {
    console.log(`Backend listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

