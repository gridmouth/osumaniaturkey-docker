import { Schema } from "mongoose";

export default new Schema({
  _id: String,
  roleId: String,
  group: String,
  mode: String,
});
