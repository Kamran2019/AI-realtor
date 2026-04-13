const connectDb = require("../config/db");
const env = require("../config/env");
const User = require("../models/User");
const { hashPassword } = require("../utils/password");
const { bootstrapDefaultScrapeSources } = require("../services/scraper.service");

async function run() {
  await connectDb();

  const existing = await User.findOne({ email: env.adminSeedEmail.toLowerCase() });
  const passwordHash = await hashPassword(env.adminSeedPassword);

  if (existing) {
    existing.name = env.adminSeedName;
    existing.passwordHash = passwordHash;
    existing.role = "admin";
    existing.isEmailVerified = true;
    existing.isActive = true;
    existing.providers = { ...existing.providers, local: { enabled: true } };
    existing.ownerUserId = existing.ownerUserId || existing._id;
    await existing.save();
    await bootstrapDefaultScrapeSources(existing._id);
    console.log(`Updated admin seed user: ${existing.email}`);
  } else {
    const user = await User.create({
      name: env.adminSeedName,
      email: env.adminSeedEmail.toLowerCase(),
      passwordHash,
      role: "admin",
      ownerUserId: undefined,
      isEmailVerified: true,
      providers: { local: { enabled: true } },
      subscription: {
        plan: "free",
        status: "free",
      },
    });
    user.ownerUserId = user._id;
    await user.save();
    await bootstrapDefaultScrapeSources(user._id);
    console.log(`Created admin seed user: ${user.email}`);
  }

  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
