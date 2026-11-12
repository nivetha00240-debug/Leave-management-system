
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  department: {
    type: String,
    default: "General"
  },
  role: {
    type: String,
    enum: ["admin", "employee"],
    default: "employee"
  },
  leaveBalance: {
    CL: { type: Number, default: 12 },
    SL: { type: Number, default: 12 },
    EL: { type: Number, default: 15 }
  }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
