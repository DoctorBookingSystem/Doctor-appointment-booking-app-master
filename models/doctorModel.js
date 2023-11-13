const mongoose = require("mongoose");
const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    firstName: {
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
    website: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    feePerCunsultation: {
      type: Number,
      required: true,
    },
    timings : {
      type: Array,
      required: true,
    },
    status: {
      type: String,
      default: "approved",
    },
    jpg: {
      type: String,
      default: null,
    },
    patientName: {
      type: String,
      default: null,
    },
    patientNumber: {
      type: String,
      default: null,
    },
    patientEmail: {
      type: String,
      default: null,
    },
    patientDOB: {
      type: String,
      default: null,
    },
    patientGender: {
      type: String,
      default: null,
    },
    reasonForVisit: {
      type: String,
      default: null,
    },
    dateofVisit: {
      type: String,
      default: null,
    },
    medicalCondition: {
      type: String,
      default: null,
    },
    allergies: {
      type: String,
      default: null,
    },
    medications: {
      type: String,
      default: null,
    },
    doctorName: {
      type: String,
      default: null,
    },
    doctorNumber: {
      type: String,
      default: null,
    },
    doctorWebsite: {
      type: String,
      default: null,
    },
    electronicSignature: {
      type: String,
      default: null,
    },
    dateSigned: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const doctorModel = mongoose.model("doctors", doctorSchema);
module.exports = doctorModel;
