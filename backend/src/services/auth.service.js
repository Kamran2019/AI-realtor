const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { hashPassword } = require("./password.service");

const DUPLICATE_EMAIL_MESSAGE = "An account with this email already exists.";

const toSafeUser = (user) => user.toJSON();

const signup = async ({ name, email, password }) => {
  const existingUser = await User.exists({ email }).collation({
    locale: "en",
    strength: 2
  });

  if (existingUser) {
    throw new ApiError(409, DUPLICATE_EMAIL_MESSAGE);
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await User.create({
      name,
      email,
      passwordHash
    });

    return toSafeUser(user);
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, DUPLICATE_EMAIL_MESSAGE);
    }

    throw error;
  }
};

module.exports = { signup };
