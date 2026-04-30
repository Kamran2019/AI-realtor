const sourceOne = require("./adapters/sourceOne.adapter");
const sourceTwo = require("./adapters/sourceTwo.adapter");
const sourceThree = require("./adapters/sourceThree.adapter");

const adapters = {
  "source-one": sourceOne,
  source_one: sourceOne,
  sourceone: sourceOne,
  "source-two": sourceTwo,
  source_two: sourceTwo,
  sourcetwo: sourceTwo,
  "source-three": sourceThree,
  source_three: sourceThree,
  sourcethree: sourceThree
};

const getAdapter = (sourceKey) => {
  const normalizedKey = String(sourceKey || "").trim().toLowerCase();

  if (adapters[normalizedKey]) {
    return adapters[normalizedKey];
  }

  if (normalizedKey.includes("two")) {
    return sourceTwo;
  }

  if (normalizedKey.includes("three")) {
    return sourceThree;
  }

  return sourceOne;
};

module.exports = {
  adapters,
  getAdapter
};
