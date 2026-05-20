#!/usr/bin/env node

const { spawn } = require("node:child_process");
const path = require("node:path");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const concurrentlyCommand =
  process.platform === "win32"
    ? path.join(__dirname, "..", "node_modules", ".bin", "concurrently.cmd")
    : path.join(__dirname, "..", "node_modules", ".bin", "concurrently");
const availableTargets = new Set(["backend", "frontend"]);
const requestedTargets = process.argv.slice(2).filter((arg) => arg !== "--");
const targets = requestedTargets.length ? [...new Set(requestedTargets)] : [...availableTargets];
const invalidTargets = targets.filter((target) => !availableTargets.has(target));

if (invalidTargets.length) {
  console.error(`Unknown dev target: ${invalidTargets.join(", ")}`);
  console.error("Usage: npm run dev [backend|frontend]");
  process.exit(1);
}

const runSingleTarget = (target) =>
  spawn(npmCommand, ["run", "dev", "--prefix", target], {
    detached: process.platform !== "win32",
    stdio: "inherit"
  });

const runAllTargets = () => {
  return spawn(
    concurrentlyCommand,
    [
      "--kill-others-on-fail",
      "--names",
      targets.join(","),
      ...targets.map((target) => `npm run dev --prefix ${target}`)
    ],
    {
      detached: process.platform !== "win32",
      stdio: "inherit"
    }
  );
};

const child = targets.length === 1 ? runSingleTarget(targets[0]) : runAllTargets();
let isStopping = false;

const stopChildGroup = (signal) => {
  if (child.killed) {
    return;
  }

  if (process.platform !== "win32") {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch (error) {
      if (error.code !== "ESRCH") {
        console.error(`Failed to forward ${signal}: ${error.message}`);
      }
    }
  }

  child.kill(signal);
};

const forwardSignal = (signal) => {
  if (isStopping) {
    return;
  }

  isStopping = true;
  stopChildGroup(signal === "SIGINT" ? "SIGTERM" : signal);

  setTimeout(() => {
    stopChildGroup("SIGKILL");
    process.exit(signal === "SIGINT" ? 130 : 143);
  }, 1500);
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

child.on("exit", (code, signal) => {
  if (isStopping) {
    return;
  }

  if (signal) {
    process.exitCode = 1;
    return;
  }

  process.exitCode = code || 0;
});
