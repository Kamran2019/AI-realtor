const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const env = require("./env");
const User = require("../models/User");

function configurePassport(passport) {
  if (!env.googleClientId || !env.googleClientSecret) {
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: env.googleCallbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(new Error("Google account email is required"));
          }

          let user = await User.findOne({ email });

          if (!user) {
            user = await User.create({
              name: profile.displayName || email,
              email,
              role: "admin",
              ownerUserId: undefined,
              isEmailVerified: true,
              providers: {
                local: { enabled: false },
                google: { id: profile.id, email },
              },
            });
            user.ownerUserId = user._id;
            await user.save();
          } else {
            user.providers = {
              ...user.providers,
              google: { id: profile.id, email },
            };
            user.isEmailVerified = true;
            await user.save();
          }

          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );
}

module.exports = configurePassport;

