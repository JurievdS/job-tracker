import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/auth/google/callback";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || "http://localhost:3001/auth/github/callback";

export interface OAuthUser {
  id: number;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
}

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || null;
          const googleId = profile.id;
          const name = profile.displayName || null;
          const avatarUrl = profile.photos?.[0]?.value || null;

          // Check if user exists by google_id
          let existingUser = await db
            .select()
            .from(users)
            .where(eq(users.google_id, googleId));

          if (existingUser.length > 0) {
            const user: OAuthUser = {
              id: existingUser[0].id,
              email: existingUser[0].email,
              name: existingUser[0].name,
              avatar_url: existingUser[0].avatar_url,
            };
            return done(null, user);
          }

          // Check if user exists by email (link accounts)
          if (email) {
            existingUser = await db
              .select()
              .from(users)
              .where(eq(users.email, email));

            if (existingUser.length > 0) {
              // Link Google account to existing user
              await db
                .update(users)
                .set({ google_id: googleId, avatar_url: avatarUrl || existingUser[0].avatar_url })
                .where(eq(users.id, existingUser[0].id));

              const user: OAuthUser = {
                id: existingUser[0].id,
                email: existingUser[0].email,
                name: existingUser[0].name,
                avatar_url: avatarUrl || existingUser[0].avatar_url,
              };
              return done(null, user);
            }
          }

          // Create new user
          const newUser = await db
            .insert(users)
            .values({
              email,
              google_id: googleId,
              name,
              avatar_url: avatarUrl,
            })
            .returning();

          const user: OAuthUser = {
            id: newUser[0].id,
            email: newUser[0].email,
            name: newUser[0].name,
            avatar_url: newUser[0].avatar_url,
          };
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: GITHUB_CALLBACK_URL,
        scope: ["user:email"],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: {
          id: string;
          displayName?: string;
          emails?: Array<{ value: string }>;
          photos?: Array<{ value: string }>;
        },
        done: (error: Error | null, user?: OAuthUser) => void
      ) => {
        try {
          const email = profile.emails?.[0]?.value || null;
          const githubId = profile.id;
          const name = profile.displayName || null;
          const avatarUrl = profile.photos?.[0]?.value || null;

          // Check if user exists by github_id
          let existingUser = await db
            .select()
            .from(users)
            .where(eq(users.github_id, githubId));

          if (existingUser.length > 0) {
            const user: OAuthUser = {
              id: existingUser[0].id,
              email: existingUser[0].email,
              name: existingUser[0].name,
              avatar_url: existingUser[0].avatar_url,
            };
            return done(null, user);
          }

          // Check if user exists by email (link accounts)
          if (email) {
            existingUser = await db
              .select()
              .from(users)
              .where(eq(users.email, email));

            if (existingUser.length > 0) {
              // Link GitHub account to existing user
              await db
                .update(users)
                .set({ github_id: githubId, avatar_url: avatarUrl || existingUser[0].avatar_url })
                .where(eq(users.id, existingUser[0].id));

              const user: OAuthUser = {
                id: existingUser[0].id,
                email: existingUser[0].email,
                name: existingUser[0].name,
                avatar_url: avatarUrl || existingUser[0].avatar_url,
              };
              return done(null, user);
            }
          }

          // Create new user
          const newUser = await db
            .insert(users)
            .values({
              email,
              github_id: githubId,
              name,
              avatar_url: avatarUrl,
            })
            .returning();

          const user: OAuthUser = {
            id: newUser[0].id,
            email: newUser[0].email,
            name: newUser[0].name,
            avatar_url: newUser[0].avatar_url,
          };
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

export default passport;
