const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isDoctor: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    patientInfo: {
      type: Array,
      default: [],
    },
    consent: {
      type: Boolean,
      default: false,
    },
    request: {
      type: Boolean,
      default: false,
    },
    seenNotifications: {
      type: Array,
      default: [],
    },
    unseenNotifications: {
      type: Array,
      default: [],
    },
    twoFactorSecret: {
      type: String,
      default: null,
    },
    access: {
      type: Boolean,
      default: true,
    },
    access: {
      type: Boolean,
      default: true,
    },
    resetCode: {
      type: String,
      default: null,
    },
    passwords: {
      type: Array,
      default: [],
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
