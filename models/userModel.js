const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
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
    seenNotifications: {
      type: Array,
      default: [],
    },
    unseenNotifications: {
      type: Array,
      default: [],
    },
    resetCode: {
      type: String,
      default: null,
    },
    resetCodeExpiration: {
      type: Date,
      default: null,
    },
    authCode: {
      type: String,
      default:null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Number,
      default: 0,
    },
    agreedToTerms: {
      type: Boolean,
      default: false,
    },
    pdfUrl: { 
      type: String,
    },
    jpgUrl: { 
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
