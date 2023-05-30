import { Schema } from "mongoose";

export default new Schema({
  _id: String,
  roleId: String,
  min: Number,
  max: Number,
});
