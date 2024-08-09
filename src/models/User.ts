import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    client_id: { type: String, required: true },
    email: { type: String },
    access_level: {type: String}
  },
  { timestamps: true }
);

const UserModel = mongoose.model("users", userSchema);

export { UserModel };
