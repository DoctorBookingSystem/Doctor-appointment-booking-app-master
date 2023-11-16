const mongoose = require("mongoose");
const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    doctorId: {
      type: String,
      required: true,
    },
    doctorInfo: {
      type: Object,
      required: true,
    },
    userInfo: {
      type: Object,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
<<<<<<< HEAD
      default: "approved",
=======
      default: "pending",
>>>>>>> jk_code
    },
  },
  {
    timestamps: true,
  }
);

<<<<<<< HEAD
const appointmentModel = mongoose.model("appointmenst", appointmentSchema);
=======
const appointmentModel = mongoose.model("appointments", appointmentSchema);
>>>>>>> jk_code
module.exports = appointmentModel;
