const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

module.exports = { hashPassword, SALT_ROUNDS };
