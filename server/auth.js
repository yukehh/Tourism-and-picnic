import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

// MONGODB_URI should be added to .env
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/warmhut";

const client = new MongoClient(mongoUri);

// The connection is handled implicitly by the adapter, 
// but it's good practice to connect during server startup if you need to access it elsewhere.
export const db = client.db();

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || (process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/auth` : "http://localhost:5000/api/auth"),
    database: mongodbAdapter(db, {
        usePlural: true
    }),
    logger: {
        level: "debug"
    },
    trustedOrigins: [
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:5175", 
        process.env.FRONTEND_URL || "http://localhost:5173"
    ],
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }
    },
    user: {
        additionalFields: {
            phone: {
                type: "string",
                required: false
            },
            address: {
                type: "string",
                required: false
            },
            role: {
                type: "string",
                required: false,
                defaultValue: "user"
            }
        }
    },
    advanced: {
        crossSubDomainCookies: {
            enabled: true
        },
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true
        }
    }
});
