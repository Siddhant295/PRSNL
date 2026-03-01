import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Only register Google strategy if real credentials are provided
const googleClientID = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (
    googleClientID &&
    googleClientSecret &&
    !googleClientID.startsWith("YOUR_") &&
    !googleClientSecret.startsWith("YOUR_")
) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: googleClientID,
                clientSecret: googleClientSecret,
                callbackURL: "http://localhost:5000/auth/google/callback",
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user already exists with this Google ID
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        return done(null, user);
                    }

                    // Check if a user exists with the same email
                    user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        // Link Google account to existing user
                        user.googleId = profile.id;
                        user.avatar = profile.photos[0]?.value || "";
                        await user.save();
                        return done(null, user);
                    }

                    // Create a new user
                    user = await User.create({
                        googleId: profile.id,
                        firstName: profile.name.givenName || profile.displayName.split(" ")[0],
                        lastName: profile.name.familyName || profile.displayName.split(" ").slice(1).join(" ") || "",
                        email: profile.emails[0].value,
                        avatar: profile.photos[0]?.value || "",
                    });

                    return done(null, user);
                } catch (err) {
                    return done(err, null);
                }
            }
        )
    );
    console.log("✅ Google OAuth strategy registered");
} else {
    console.log("⚠️  Google OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable.");
}

export default passport;
