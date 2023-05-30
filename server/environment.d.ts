declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production";
      PORT?: string;
      OSU_CALLBACK_URL: string;
      OSU_CLIENT_SECRET: string;
      OSU_CLIENT_ID: string;
      MONGO_CONNECTION: string;
      DISCORD_TOKEN: string;
      DISCORD_GUILD: string;
      DISCORD_CHANNEL: string;
      OSU_TOKEN: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
