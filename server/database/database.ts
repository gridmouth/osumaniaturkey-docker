import mongoose from "mongoose";
import { LoggerService } from "../helpers/LoggerService";
import Verification from "./schemas/Verification";
import GroupRoles from "./schemas/GroupRoles";
import RankRoles from "./schemas/RankRoles";
import User from "./schemas/User";
import VerifiedRole from "./schemas/VerifiedRole";
import UnverifiedRole from "./schemas/UnverifiedRole";

const logger = new LoggerService("Database");

export function connectToDatabase() {
  mongoose
    .connect(process.env.MONGO_CONNECTION)
    .then(() => {
      logger.printSuccess("Database connected!");
    })
    .catch((e) => {
      logger.printError("An error has occurred:\n".concat(e.message));
      console.error(e);
    });
}

export const verifications = mongoose.model("Verifications", Verification);
export const grouproles = mongoose.model("GroupRoles", GroupRoles);
export const rankroles = mongoose.model("RankRoles", RankRoles);
export const users = mongoose.model("Users", User);
export const verifiedroles = mongoose.model("VerifiedRoles", VerifiedRole);
export const unverifiedroles = mongoose.model(
  "UnverifiedRoles",
  UnverifiedRole
);
