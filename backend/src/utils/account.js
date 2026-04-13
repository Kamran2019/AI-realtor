function getAccountOwnerId(user) {
  return String(user.ownerUserId || user._id);
}

module.exports = {
  getAccountOwnerId,
};

