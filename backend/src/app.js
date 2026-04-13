const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const passport = require("passport");
const path = require("path");
const env = require("./config/env");
const configurePassport = require("./config/passport");
const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

configurePassport(passport);

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(
  "/api/billing/webhooks",
  express.raw({
    type: "application/json",
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(passport.initialize());
app.use("/uploads", express.static(path.join(process.cwd(), "backend", "uploads")));
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;

