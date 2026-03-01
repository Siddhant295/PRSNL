import express from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import User from "../models/User.js";

const router = express.Router();

// Helper: generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// ─── Email/Password Signup ───────────────────────────────────────────
router.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "An account with this email already exists." });
        }

        const user = await User.create({ firstName, lastName, email, password });
        const token = generateToken(user);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Email/Password Login ────────────────────────────────────────────
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        if (!user.password) {
            return res
                .status(401)
                .json({ message: "This account uses Google sign-in. Please sign in with Google." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Google OAuth ────────────────────────────────────────────────────
const isGoogleConfigured = () => {
    const id = process.env.GOOGLE_CLIENT_ID;
    const secret = process.env.GOOGLE_CLIENT_SECRET;
    return id && secret && !id.startsWith("YOUR_") && !secret.startsWith("YOUR_");
};

// Helper: promisify passport.authenticate for Express 5 compatibility
const authenticateGoogle = (options) => {
    return (req, res) => {
        return new Promise((resolve, reject) => {
            const next = (err) => {
                if (err) return reject(err);
                resolve();
            };
            passport.authenticate("google", options)(req, res, next);
        });
    };
};

router.get("/google", async (req, res) => {
    if (!isGoogleConfigured()) {
        return res.status(501).json({ message: "Google login is not configured yet." });
    }
    await authenticateGoogle({ scope: ["profile", "email"] })(req, res);
});

router.get("/google/callback", async (req, res) => {
    if (!isGoogleConfigured()) {
        return res.status(501).json({ message: "Google login is not configured yet." });
    }
    console.log("📥 Google callback hit");
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";

    try {
        const code = req.query.code;
        if (!code) {
            console.error("❌ No authorization code received from Google");
            return res.redirect(`${frontendURL}/login?error=no_code`);
        }

        // Manually exchange the authorization code for tokens
        const { OAuth2 } = await import("oauth");
        const oauth2 = new OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "",
            "https://accounts.google.com/o/oauth2/v2/auth",
            "https://oauth2.googleapis.com/token",
            null
        );

        const { accessToken, refreshToken } = await new Promise((resolve, reject) => {
            oauth2.getOAuthAccessToken(
                code,
                {
                    grant_type: "authorization_code",
                    redirect_uri: "http://localhost:5000/auth/google/callback",
                },
                (err, accessToken, refreshToken) => {
                    if (err) return reject(err);
                    resolve({ accessToken, refreshToken });
                }
            );
        });

        // Fetch user profile from Google
        const profileRes = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const profile = await profileRes.json();
        console.log("📧 Google profile:", profile.email);

        // Find or create user
        let user = await User.findOne({ googleId: profile.sub });

        if (!user) {
            // Check if a user exists with the same email
            user = await User.findOne({ email: profile.email });
            if (user) {
                // Link Google account to existing user
                user.googleId = profile.sub;
                user.avatar = profile.picture || "";
                await user.save();
            } else {
                // Create new user
                user = await User.create({
                    googleId: profile.sub,
                    firstName: profile.given_name || profile.name?.split(" ")[0] || "",
                    lastName: profile.family_name || profile.name?.split(" ").slice(1).join(" ") || "",
                    email: profile.email,
                    avatar: profile.picture || "",
                });
            }
        }

        console.log("✅ Google OAuth success for:", user.email);
        const token = generateToken(user);
        res.redirect(`${frontendURL}/auth/callback?token=${token}`);
    } catch (err) {
        console.error("❌ Google OAuth error:", err.message || err);
        console.error("❌ Full stack:", err.stack);
        res.redirect(`${frontendURL}/login?error=oauth_failed&detail=${encodeURIComponent(err.message || "unknown")}`);
    }
});

export default router;
