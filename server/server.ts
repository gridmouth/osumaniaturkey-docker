import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { Handler } from "vite-plugin-mix";
import { LoggerService } from "./helpers/LoggerService";
import { ApiRouter } from "./routes";
import { connectToDatabase } from "./database/database";
import { DiscordBot } from "./services/discord/DiscordBot";
import { syncAllMembers } from "./services/verification/handleVerification";
import { OsuApi } from "./services/osu/OsuApi";
import { resolve } from "path";
const app = express();

const logger = new LoggerService("Server");

connectToDatabase();

export const Discord = new DiscordBot();
Discord.connect();

new OsuApi().startTokenGeneration().then(() => {
  syncAllMembers().catch(console.error);
});

app.use(express.json());
app.use("/api", ApiRouter);

if (process.env.NODE_ENV == "production") {
  app.use("/assets", express.static(resolve("./dist/assets/")));

  // Serve frontend
  app.use("*", (req, res) => {
    res.status(200).sendFile(resolve("./dist/index.html"));
  });

  app.listen(process.env.PORT, () => {
    logger.printSuccess(`Listening on port ${app.settings.port}`);
  });
}

export const handler: Handler = app;
