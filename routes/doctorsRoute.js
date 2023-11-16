const express = require("express");
const router = express.Router();
const Doctor = require("../models/doctorModel");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer"); 
const path = require("path");
const fs = require("fs");
const Appointment = require("../models/appointmentModel");
const User = require("../models/userModel");

router.post("/get-doctor-info-by-user-id", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.body.userId });
    res.status(200).send({
      success: true,
      message: "Doctor info fetched successfully",
      data: doctor,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting doctor info", success: false, error });
  }
});

router.post("/get-doctor-info-by-id", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ _id: req.body.doctorId });
    res.status(200).send({
      success: true,
      message: "Doctor info fetched successfully",
      data: doctor,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting doctor info", success: false, error });
  }
});

router.post("/update-doctor-profile", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.body.userId },
      req.body
    );
    res.status(200).send({
      success: true,
      message: "Doctor profile updated successfully",
      data: doctor,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting doctor info", success: false, error });
  }
});

router.get(
  "/get-appointments-by-doctor-id",
  authMiddleware,
  async (req, res) => {
    try {
      const doctor = await Doctor.findOne({ userId: req.body.userId });
      const appointments = await Appointment.find({ doctorId: doctor._id });
      res.status(200).send({
        message: "Appointments fetched successfully",
        success: true,
        data: appointments,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error fetching appointments",
        success: false,
        error,
      });
    }
  }
);

router.post("/change-appointment-status", authMiddleware, async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(appointmentId, {
      status,
    });
    if (status === 'rejected'){
      await Appointment.findByIdAndRemove(appointmentId);
    }
    const user = await User.findOne({ _id: appointment.userId });
    const unseenNotifications = user.unseenNotifications;
    unseenNotifications.push({
      type: "appointment-status-changed",
      message: `Your appointment status has been ${status}`,
      onClickPath: "/appointments",
    });

    await user.save();

    res.status(200).send({
      message: "Appointment status updated successfully",
      success: true
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error changing appointment status",
      success: false,
      error,
    });
  }
});


// Multer configuration for JPEG file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "client/src/pages/Doctor/uploads/"); // Folder where doctor files will be saved
  },
  filename: function (req, file, cb) {
    const originalFileName = file.originalname; 
    cb(null, originalFileName);
  },
});

const upload = multer({ storage: storage });

router.post("/upload-file", upload.single("jpgFile"), async (req, res) => {
  try {
    const { file } = req;
    const userId = "64f529537365e9337d74db88"; 
    const jpgFileName = file ? file.filename : null;

    // Update the doctor document in the database with the JPEG file name
    await Doctor.findOneAndUpdate({ userId }, { jpg: jpgFileName });

    res.status(200).send({
      message: "File uploaded successfully.",
      success: true,
      data: {
        jpgFileName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error uploading file", success: false, error });
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


router.post("/update-patient-info", authMiddleware, async (req, res) => {
  try {

    const userId = "64f529537365e9337d74db88";
    const doctor = await Doctor.findOne({ userId: userId });

    doctor.patientName = req.body.patientName;
    doctor.patientNumber = req.body.patientNumber;
    doctor.patientEmail = req.body.patientEmail;
    doctor.patientDOB = req.body.patientDOB;
    doctor.patientGender = req.body.patientGender;

    doctor.reasonForVisit = req.body.reasonForVisit;
    doctor.dateofVisit = req.body.dateofVisit;
    doctor.medicalCondition = req.body.medicalCondition;
    doctor.allergies = req.body.allergies;
    doctor.medications = req.body.medications;

    doctor.doctorName = req.body.doctorName;
    doctor.doctorNumber = req.body.doctorNumber;
    doctor.doctorWebsite = req.body.doctorWebsite;
    doctor.electronicSignature = req.body.electronicSignature;
    doctor.dateSigned = req.body.dateSigned;

    await doctor.save();

    res.status(200).send({
      success: true,
      message: "Patient information updated successfully",
      data: doctor,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error updating patient information",
      success: false,
      error,
    });
  }

});

router.get('/doctors_specialization', async (req, res) => {
  try {
    const doctors = await Doctor.find({}, 'specialization'); 
    const specializations = doctors.map((doctor) => doctor.specialization);
    res.status(200).json({ success: true, data: specializations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error retrieving Doctors data' });
  }
});

module.exports = router;
