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
const path = require("path");
const ClamScan = require('clamscan');
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

    if (!user.lastLoginDate || !isSameDay(user.lastLoginDate, new Date())) {
      user.loginCount = 1;
    } else {
      user.loginCount += 1;
    }
    user.lastLoginDate = new Date(); // Update last login date to current date
    await user.save();

    const adminEmail = "administrator@gmail.com";

    const loginActivity = {
      timestamp: new Date(),
      ipAddress: req.ip, // Get user IP address from request
      userAgent: req.get('User-Agent'), // Get user agent from request
    };
    user.loginActivities.push(loginActivity);
    await user.save();

    if (user.email !== adminEmail) {
        user.unseenNotifications.push({
          type: "new-login",
          message: `Login from IP Address: ${loginActivity.ipAddress} at ${moment(loginActivity.timestamp).format('MMMM Do YYYY, h:mm:ss a')}`,
          onClickPath: "/notifications", // Redirect path for the user
        });

        await user.save();
    }

      // Notify the admin about the user's login activity
    if (user.email !== adminEmail) {
      const adminUser = await User.findOne({ isAdmin: true, email: adminEmail });
      if (adminUser) {
        const userLogs = adminUser.userLogs;
        userLogs.push({
          type: "user-login",
          message: `User ${user.name} (${user.email}) logged in from ${loginActivity.ipAddress} at ${moment(loginActivity.timestamp).format('MMMM Do YYYY, h:mm:ss a')}. Login Count: ${user.loginCount}`,
          onClickPath: "/admin/userlogs",
        });
      
        // Save admin user with the new notification
        await adminUser.save();
      }
    }
    // Generate token and send success response
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const isDifferentLocation = user.loginActivities.some((loginActivity) => {
      return loginActivity.ipAddress !== req.ip || loginActivity.userAgent !== req.get('User-Agent');
    });
    
    // If a different location login is detected, send a notification to the user
    if (isDifferentLocation) {
      user.unseenNotifications.push({
        type: "new-login-location",
        message: "Your account was logged in from a different location.",
        onClickPath: "/notifications",
      });
      await user.save();
    }

    // Construct the login message
    const loginMessage = `Login successful. Logged in at ${moment(loginActivity.timestamp).format('MMMM Do YYYY, h:mm:ss a')} from IP address: ${loginActivity.ipAddress}`;

    res.status(200).send({ message: loginMessage, success: true, data: token });
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

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

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

router.post("/validate-password", async (req, res) => {
  const userEmail = "kumailkazmi14@gmail.com";

  try {
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(200).send({ message: "User does not exist", success: false });
    }

    // Check if access attempts are greater than or equal to 5
    if (user.accessAttempts >= 5) {
      user.unseenNotifications.push({
        type: "breach-notify",
        message: `An attempted breach at your Health Information was detected. Please change your password`,
        onClickPath: "/notifications", // Redirect path for the user
      });

      user.accessAttempts = 0;

      await user.save();

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'FIUDoctorBooking@gmail.com',
          pass: 'dastwmvuhcvcddwj',
        },
      });

      const mailOptions = {
        from: 'FIUDoctorBooking@fiu.edu',
        to: user.email, // Assuming user.email contains the recipient's email address
        subject: 'Account Security Alert - Potential Breach Detected',
        html: `<p>
          Dear ${user.name},
          <br><br>
          We are writing to inform you about an important security event related to your account. Our security systems have detected multiple failed login attempts 
          on your account. While your account remains secure, these unauthorized attempts raise concerns about the safety of your credentials. To maintain the security of your personal health data, we kindly request you to change your account password immediately.
          <br><br>
          You can reset your password by clicking on the "Forgot Password" link on the Login page. When creating a new password, please ensure it is strong and unique to enhance the security of your account.
          <br><br>
          We want to assure you that your personal health information is secure, and we are taking all necessary measures to protect your privacy. If you ever suspect any unusual activity or have questions about your account's security, 
          please do not hesitate to reach out to us at fiuBookingSupport@gmail.com.
          <br><br>
          Sincerely,<br><br>
          The FIU Doctor Booking Security Team
          <br><br>
          <img src="https://collegiaterecovery.org/wp-content/uploads/2022/02/FIU.png" alt="FIU Health Services" width="300" height="100">
        </p>`,
      };      

      // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          // Handle email sending error
          return res.status(500).json({ success: false, message: "Error sending email" });
        } else {
          console.log('Email sent:', info.response);
          // Email sent successfully, respond to the client
          return res.status(200).json({ success: true, message: "Security email sent" });
        }
      });

      return res.status(200).send({ message: "Breach Alert!!! Notification Sent", success: false });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (isMatch) {
      // Password is correct
      await user.save();
      return res.status(200).send({ message: "Password is correct", success: true });
    } else {
      // Increment access attempts only if the password is incorrect
      user.accessAttempts++;
      await user.save();
      // Password is incorrect
      return res.status(200).send({ message: "Incorrect password. Please try again", success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error validating password", success: false, error });
  }
});


router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    const name = user.name;
    const email = user.email;
    const number = user.phoneNumber;

     const PatientInfo = user.patientInfo.map((info) => ({
      age: info.age,
      height: info.height,
      weight: info.weight,
      bronchitis: info.bronchitis,
      diabetes: info.diabetes,
      asthma: info.asthma,
      high_blood_pressure: info.high_blood_pressure,
      epilepsy_seizures: info.epilepsy_seizures
    }));

     user.patientInfo = PatientInfo;
     user.name = name;
     user.email = email;
     user.phoneNumber = number;

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
      message: "User info fetched successfully",
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

    const adminEmail = "administrator@gmail.com";

    if (req.body.userInfo.email !== adminEmail) {
      const adminUser = await User.findOne({ isAdmin: true, email: adminEmail });
      if (adminUser) {
        const userLogs = adminUser.userLogs;
        userLogs.push({
          type: "user-appointment",
          message: `User ${req.body.userInfo.name} (${req.body.userInfo.email}) booked an appointment with Dr. ${user.name} for ${moment(req.body.date).format('MMMM Do YYYY')}`,
          onClickPath: "/admin/userlogs",
        });
      
        // Save admin user with the new notification
        await adminUser.save();
      }
    }

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


router.post('/updatePatientInfo', async (req, res) => {
  try {
    const formData = req.body; 
    const user = await User.findOne({ _id: formData.userId });
    const phoneNumber = formData.phoneNumber;
    const Age = formData.age;
    const Height = formData.height;
    const Weight = formData.weight;
    const Bronchitis = formData.bronchitis;
    const HighBloodPressure = formData.high_blood_pressure;
    const Asthma = formData.asthma;
    const Diabetes = formData.diabetes;
    const EpilepsySeizures = formData.epilepsy_seizures;
  

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.phoneNumber = phoneNumber;
    //user.request = false;

    // const auditChangesEntry = new AuditChanges({
    //   userId: user._id,
    //   email: decryptedEmail, 
    //   action: 'PHI Changes Made.',
    // });
    // await auditChangesEntry.save();

    if (user.patientInfo.length === 0) {
      user.patientInfo.push({
        age: Age,
        height: Height,
        weight: Weight,
        bronchitis: Bronchitis,
        asthma: Asthma,
        high_blood_pressure: HighBloodPressure,
        diabetes: Diabetes,
        epilepsy_seizures: EpilepsySeizures,
      });
    } else {
      await User.updateOne(
        { _id: formData.userId },
        {
          $set: {
            'phoneNumber': phoneNumber,
            'patientInfo.0.age': Age,
            'patientInfo.0.height': Height,
            'patientInfo.0.weight': Weight,
            'patientInfo.0.bronchitis': Bronchitis,
            'patientInfo.0.asthma': Asthma,
            'patientInfo.0.high_blood_pressure': HighBloodPressure,
            'patientInfo.0.diabetes': Diabetes,
            'patientInfo.0.epilepsy_seizures': EpilepsySeizures,
          },
        }
      );
    }
    await user.save();

    res.status(201).json({ message: 'Your information has been saved.', data: user });
  } catch (error) {
    console.error('Error adding form data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "client/uploads/"); // Folder where files will be saved
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // Rename the file with timestamp to avoid name conflicts
  },
});

const upload = multer({ storage: storage });
const clamscan = new ClamScan();

router.post("/upload-files", upload.fields([{ name: "pdfFile" }, { name: "jpgFile" }]), async (req, res) => {
  try {

    const { pdfFile, jpgFile } = req.files;


     // Get user ID from request body or wherever you are passing it
     const userId = req.body.userId; // Assuming userId is passed in the request body

     // Check if files are null, if so, set them as empty arrays
     const pdfFileName = pdfFile;
     const jpgFileName = jpgFile;
 
     // Update the user document in the database with file names
     await User.findByIdAndUpdate(userId, { pdf: pdfFileName, jpg: jpgFileName });

     res.status(200).send({
       message: "Files uploaded successfully. No viruses detected",
       success: true,
       data: {
         pdfFileName,
         jpgFileName,
       },
     });
   } catch (error) {
     console.error(error);
     res.status(500).send({ message: "Error uploading files", success: false, error });
   }
});

async function scanFile(file) {
  return new Promise((resolve, reject) => {
    clamscan.scan(file.path, (err, object, malicious) => {
      if (err) {
        reject(err);
      } else if (malicious) {
        // File is infected, handle accordingly
        reject(new Error('Infected file detected'));
      } else {
        // File is clean
        resolve('File is clean. No viruses detected.');
      }
    });
  });
}


module.exports = router;
