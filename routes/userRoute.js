const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");
const Appointment = require("../models/appointmentModel");
const moment = require("moment");
const nodemailer = require('nodemailer');
const crypto = require("crypto");
const multer = require("multer");
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const conn = mongoose.connection;
// const twilio = require('twilio');
// const client = twilio('ACef9a35e24d6d0899ff7625a179d0345b', 'd8bfe24eb26ceb8e78309decbdea65e6');
const LOCK_TIME = 2 * 60 * 1000;

router.post("/register", async (req, res) => {
  try {
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
    }
    const {name, phoneNumber, email, password, agreedToTerms} = req.body;

    if (!agreedToTerms) {
      return res.status(400).send({ message: "You must agree to the terms", success: false });
    }
  
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newuser = new User({
      name,
      phoneNumber,
      email,
      password: hashedPassword,
      agreedToTerms: true,
    });
    await newuser.save();
    res
      .status(200)
      .send({ message: "User created successfully", success: true });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error creating user", success: false, error });
  }
});


// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(200).send({ message: "User does not exist", success: false });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(200).send({ message: "Incorrect password", success: false });
//     }

//     // Generate a random 6-digit code
//     const authCode = generateRandomCode();
//     user.authCode = authCode;
//     await user.save();

//     // Send the authCode via SMS
    
//     client.messages
//       .create({
//           body: `Your FIU Doctor Booking Account Authentication Code is ${user.authCode}`,
//           from: '+17864756951',
//           to: '+19545360516'
//       }).then(message => console.log('Message sent', message.sid))
//         .catch(error => console.log(error))
    
//     console.log('AuthCode: ', user.authCode);
//     console.log('Message sent successfully to +19545360516');

//     // Create and sign JWT token for the user
//     // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

//     return res.status(200).send({ message: "Authentication code sent", success: true, authCode });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ message: "Error logging in", success: false, error });
//   }
// });

// router.post("/verify-2fa", async (req, res) => {
//   try {
//     const { authCode } = req.body;

//     const user = await User.findOne({ authCode });
//     if (!user || user.authCode !== authCode) {
//       return res.status(200).send({ message: "Invalid authentication code", success: false });
//     }
//     else {
//     // Authentication code is valid, generate JWT token and log in the user
//       const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
//       return res.status(200).send({ message: "Login successful", success: true, data: token });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ message: "Error verifying authentication code", success: false, error });
//   }
// });

// function generateRandomCode() {
//   return Math.floor(100000 + Math.random() * 900000); // Generates a random 6-digit code
// }


router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(200)
        .send({ message: "User does not exist", success: false });
    }

    if (user.loginAttempts >= 3 && user.lockUntil > Date.now()) {
      return res
        .status(200)
        .send({ message: "Account locked. Try again later.", success: false });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (!isMatch) {
      user.loginAttempts++;
      if (user.loginAttempts >= 3) {
        user.lockUntil = Date.now() + LOCK_TIME;
      }
      await user.save();
      return res
        .status(200)
        .send({ message: "Password is incorrect", success: false });
    } 

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    await user.save();

    // Generate token and send success response
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).send({ message: "Login successful", success: true, data: token });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error logging in", success: false, error });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(200).send({ message: "User not found", success: false });
    }

    // Generate a unique reset code and set expiration time (1 hour)
    const resetCode = crypto.randomBytes(10).toString("hex");
    const resetCodeExpiration = Date.now() + 300000;

    // Save reset code and expiration time to the user object
    user.resetCode = resetCode;
    user.resetCodeExpiration = resetCodeExpiration;
    await user.save();

    // Send reset code to user's email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "FIUDoctorBooking@gmail.com",
        pass: "dastwmvuhcvcddwj",
      },
    });

    const mailOptions = {
      from: "FIUDoctorBooking@gmail.com",
      to: user.email,
      subject: "Password Reset Code - FIU Doctor Booking Account",
      text: `Your FIU Doctor Booking Account password reset code is: ${resetCode}. This code will expire in 5 minutes.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).send({ message: "Error sending reset code email", success: false });
      }
      console.log("Reset code email sent: " + info.response);
      return res.status(200).send({ message: "Reset code sent to your email", success: true });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error sending reset code", success: false, error });
  }
});

router.post("/verify-reset-code", async (req, res) => {
  try {
    const user = await User.findOne({
      resetCode: req.body.resetCode,
      resetCodeExpiration: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(200).send({
        message: "Invalid or expired reset code",
        success: false,
      });
    }
    res.status(200).send({
      message: "Reset code verified successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Error verifying reset code",
      success: false,
      error,
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { resetCode, newPassword } = req.body;

    // Verify the reset code
    const user = await User.findOne({
      resetCode: resetCode,
      resetCodeExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset code",
        success: false,
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password and clear reset code fields
    user.password = hashedPassword;
    user.resetCode = undefined;
    user.resetCodeExpiration = undefined;

    // Save the updated user object to the database
    await user.save();

    // Respond with a success message
    res.status(200).json({
      message: "Password reset successful",
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error resetting password",
      success: false,
      error: error.message,
    });
  }
});

router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.password = undefined;
    if (!user) {
      return res
        .status(200)
        .send({ message: "User does not exist", success: false });
    } else {
      res.status(200).send({
        success: true,
        data: user,
      });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting user info", success: false, error });
  }
});

// Get user info by ID endpoint
router.post("/get-user-info-by-user-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    res.status(200).send({
      success: true,
      message: "Doctor info fetched successfully",
      data: user,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting user info", success: false, error });
  }
});

router.post("/update-user-profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.body.userId },
      req.body
    );
    res.status(200).send({
      success: true,
      message: "User profile updated successfully",
      data: user,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting user info", success: false, error });
  }
});

router.post("/apply-doctor-account", authMiddleware, async (req, res) => {
  try {
    const newdoctor = new Doctor({ ...req.body, status: "pending" });
    await newdoctor.save();
    const adminUser = await User.findOne({ isAdmin: true });

    const unseenNotifications = adminUser.unseenNotifications;
    unseenNotifications.push({
      type: "new-doctor-request",
      message: `${newdoctor.firstName} ${newdoctor.lastName} has applied for a doctor account`,
      data: {
        doctorId: newdoctor._id,
        name: newdoctor.firstName + " " + newdoctor.lastName,
      },
      onClickPath: "/admin/doctorslist",
    });
    await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });
    res.status(200).send({
      success: true,
      message: "Doctor account applied successfully",
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
  "/mark-all-notifications-as-seen",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.body.userId });
      const unseenNotifications = user.unseenNotifications;
      const seenNotifications = user.seenNotifications;
      seenNotifications.push(...unseenNotifications);
      user.unseenNotifications = [];
      user.seenNotifications = seenNotifications;
      const updatedUser = await user.save();
      updatedUser.password = undefined;
      res.status(200).send({
        success: true,
        message: "All notifications marked as seen",
        data: updatedUser,
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

router.post("/delete-all-notifications", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.seenNotifications = [];
    user.unseenNotifications = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "All notifications cleared",
      data: updatedUser,
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

router.get("/get-all-approved-doctors", authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "approved" });
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



router.post("/book-appointment", authMiddleware, async (req, res) => {
  try {
    req.body.status = "pending";
    req.body.date = moment(req.body.date, "DD-MM-YYYY").toString();
    req.body.time = moment(req.body.time, "HH:mm").toString();
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    //pushing notification to doctor based on his userid
    const user = await User.findOne({ _id: req.body.doctorInfo.userId });
    user.unseenNotifications.push({
      type: "new-appointment-request",
      message: `A new appointment request has been made by ${req.body.userInfo.name}`,
      onClickPath: "/doctor/appointments",
    });
    await user.save();

    // Send appointment confirmation email
    const transporter = nodemailer.createTransport({
      service: 'gmail', // e.g., 'Gmail'
      auth: {
        user: 'FIUDoctorBooking@gmail.com',
        pass: 'dastwmvuhcvcddwj',
      },
    });

    const mailOptions = {
      from: 'FIUDoctorBooking@gmail.com',
      to: req.body.userInfo.email, // User's email
      subject: 'Appointment Confirmation - FIU Doctor Booking',
      html: `
        <p>Dear ${req.body.userInfo.name},</p>
        <p>Your appointment with Dr. ${user.name} has been confirmed.</p>
        <p>Date: ${req.body.date}</p>
        <p>Time: ${req.body.time}</p>
        <p>Location: FIU Health Center</p>
        <p>Doctor's Contact Information:</p>
        <p>Phone Number: ${user.phoneNumber}</p>
        <p>Email: ${user.email}</p>
        <p>Thank you for choosing our service!</p>
        <p>Regards,</p>
        <p>FIU Health Services</p>
        <p><img src="https://collegiaterecovery.org/wp-content/uploads/2022/02/FIU.png" alt="FIU Health Services" width="300" height="100"></p>
        
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    res.status(200).send({
      message: "Appointment booked successfully - Email Confirmation Sent",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error booking appointment",
      success: false,
      error,
    });
  }
});

router.post("/check-booking-avilability", authMiddleware, async (req, res) => {
  try {
    const date = moment(req.body.date, "DD-MM-YYYY").toString();
    const fromTime = moment(req.body.time, "HH:mm")
      .subtract(1, "hours")
      .toString();
    const toTime = moment(req.body.time, "HH:mm").add(1, "hours").toString();
    const doctorId = req.body.doctorId;
    const appointments = await Appointment.find({
      doctorId,
      date,
      time: { $gte: fromTime, $lte: toTime },
    });
    if (appointments.length > 0) {
      return res.status(200).send({
        message: "Appointments not available",
        success: false,
      });
    } else {
      return res.status(200).send({
        message: "Appointments available",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error booking appointment",
      success: false,
      error,
    });
  }
});

router.get("/get-appointments-by-user-id", authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.body.userId });
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
});

// Initialize GridFS
Grid.mongo = mongoose.mongo;
let gfs;

conn.once("open", () => {
  gfs = Grid(conn.db);
});

// Multer storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// File upload endpoint
router.post("/upload-files", upload.fields([{ name: "pdfFile", maxCount: 1 }, { name: "jpgFile", maxCount: 1 }]), async (req, res) => {
  try {
    const { pdfFile, jpgFile } = req.files;

    // Store PDF file in GridFS
    const pdfWriteStream = gfs.createWriteStream({
      filename: pdfFile[0].originalname,
    });
    pdfWriteStream.write(pdfFile[0].buffer);
    pdfWriteStream.end();

    // Store JPG file in GridFS
    const jpgWriteStream = gfs.createWriteStream({
      filename: jpgFile[0].originalname,
    });
    jpgWriteStream.write(jpgFile[0].buffer);
    jpgWriteStream.end();

    // Save PDF and JPG URLs in user document
    const pdfUrl = `/file/${pdfWriteStream._id}`;
    const jpgUrl = `/file/${jpgWriteStream._id}`;

    // Update user with file URLs
    const user = await User.findByIdAndUpdate(req.body.user._id, {
      pdfUrl: user.pdfUrl,
      jpgUrl: user.jpgUrl,
    });

    res.status(200).send({ message: "Files uploaded successfully", success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error uploading files", success: false, error });
  }
});

// // Serve files from GridFS
// router.get("/file/:fileId", (req, res) => {
//   const fileId = req.params.fileId;
//   const readStream = gfs.createReadStream({ _id: fileId });

//   readStream.on("error", (err) => {
//     res.status(404).send("File not found");
//   });

//   readStream.pipe(res);
// });

module.exports = router;
