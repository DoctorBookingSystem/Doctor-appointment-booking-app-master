const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/get-all-doctors", authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({});
    res.status(200).send({
      message: "Doctors fetched successfully",
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying doctor account",
      success: false,
      error,
    });
  }
});

const UPLOADS_DIRECTORY = path.join(__dirname, "client/src/pages/Doctor/uploads/");

router.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  console.log("UPLOADS_DIRECTORY:", UPLOADS_DIRECTORY);
  console.log("filename:", filename);
  const filePath = "client/src/pages/Doctor/uploads/" + filename;

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Set appropriate headers for the response
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/octet-stream");

    // Create a read stream from the file and pipe it to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    // If the file does not exist, return a 404 error
    res.status(404).send("File not found");
  }
});

router.get("/get-all-users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).send({
      message: "Users fetched successfully",
      success: true,
      data: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying doctor account",
      success: false,
      error,
    });
  }
});

router.post(
  "/change-doctor-account-status",
  authMiddleware,
  async (req, res) => {
    try {
      const { doctorId, status } = req.body;
      const doctor = await Doctor.findByIdAndUpdate(doctorId, {
        status,
      });

      const user = await User.findOne({ _id: doctor.userId });
      const unseenNotifications = user.unseenNotifications;
      unseenNotifications.push({
        type: "new-doctor-request-changed",
        message: `Your doctor account has been ${status}`,
        onClickPath: "/notifications",
      });
      user.isDoctor = status === "approved" ? true : false;
      await user.save();

      res.status(200).send({
        message: "Doctor status updated successfully",
        success: true,
        data: doctor,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error applying doctor account",
        success: false,
        error,
      });
    }
  }
);

router.delete("/delete-user/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    // Delete the user by their ID
    await User.findByIdAndDelete(userId);
    res.status(200).send({
      message: "User deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send({
      message: "Error deleting user",
      success: false,
      error,
    });
  }
});

router.delete("/delete-doctor/:doctorId", authMiddleware, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    await Doctor.findByIdAndDelete(doctorId);
    res.status(200).send({
      message: "Doctor deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).send({
      message: "Error deleting doctor",
      success: false,
      error,
    });
  }
});


module.exports = router;
