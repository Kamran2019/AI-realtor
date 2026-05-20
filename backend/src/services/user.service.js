const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { hashPassword } = require("./password.service");

const DUPLICATE_EMAIL_MESSAGE = "An account with this email already exists.";
const NOT_FOUND_MESSAGE = "User not found.";
const LAST_ADMIN_MESSAGE = "Cannot disable or downgrade the only active admin.";

const toSafeUser = (user) => user.toJSON();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getUserById = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, NOT_FOUND_MESSAGE);
  }

  return toSafeUser(user);
};

const buildListFilter = ({ search, role, status }) => {
  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (status) {
    filter.status = status;
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");

    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  return filter;
};

const listUsers = async ({ page, limit, search, role, status }) => {
  const filter = buildListFilter({ search, role, status });
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  return {
    users: users.map(toSafeUser),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

const ensureUniqueEmail = async (email, excludedUserId = null) => {
  const query = excludedUserId ? { email, _id: { $ne: excludedUserId } } : { email };
  const existingUser = await User.exists(query).collation({
    locale: "en",
    strength: 2
  });

  if (existingUser) {
    throw new ApiError(409, DUPLICATE_EMAIL_MESSAGE);
  }
};

const createUser = async ({ name, email, password, role }) => {
  await ensureUniqueEmail(email);

  try {
    const user = await User.create({
      name,
      email,
      role,
      passwordHash: await hashPassword(password),
      emailVerification: {
        isVerified: true,
        tokenHash: null,
        expiresAt: null,
        verifiedAt: new Date()
      }
    });

    return toSafeUser(user);
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, DUPLICATE_EMAIL_MESSAGE);
    }

    throw error;
  }
};

const countActiveAdminsExcluding = (userId) =>
  User.countDocuments({
    _id: { $ne: userId },
    role: "admin",
    status: "active"
  });

const ensureCanChangeAdminAvailability = async (user, updates) => {
  const isAdmin = user.role === "admin";
  const downgradesAdmin = updates.role && updates.role !== "admin";
  const disablesAdmin = updates.status && updates.status !== "active";

  if (!isAdmin || (!downgradesAdmin && !disablesAdmin)) {
    return;
  }

  const remainingActiveAdmins = await countActiveAdminsExcluding(user._id);

  if (remainingActiveAdmins === 0) {
    throw new ApiError(400, LAST_ADMIN_MESSAGE);
  }
};

const updateUser = async (id, updates, actorId) => {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, NOT_FOUND_MESSAGE);
  }

  if (user._id.equals(actorId) && updates.status && updates.status !== "active") {
    throw new ApiError(400, "You cannot disable your own account.");
  }

  await ensureCanChangeAdminAvailability(user, updates);

  if (updates.name !== undefined) {
    user.name = updates.name;
  }

  if (updates.role !== undefined) {
    user.role = updates.role;
  }

  if (updates.status !== undefined) {
    user.status = updates.status;
  }

  await user.save();

  return toSafeUser(user);
};

const updateUserStatus = async (id, status, actorId) => {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, NOT_FOUND_MESSAGE);
  }

  if (user._id.equals(actorId) && status !== "active") {
    throw new ApiError(400, "You cannot disable your own account.");
  }

  await ensureCanChangeAdminAvailability(user, { status });

  user.status = status;
  await user.save();

  return toSafeUser(user);
};

module.exports = {
  createUser,
  getUserById,
  listUsers,
  updateUser,
  updateUserStatus
};
