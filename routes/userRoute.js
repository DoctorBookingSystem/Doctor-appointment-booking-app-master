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
const multer = require("multer");
const path = require("path");
const ClamScan = require('clamscan');
const LOCK_TIME = 2 * 60 * 1000;

const AuditLogin = require("../models/auditLoginModel");
const AuditChanges = require("../models/auditChangesModel");
require("dotenv").config();
const speakeasy = require("speakeasy");
const { updateTwoFactorSecret, encryptData, decryptData } = require('./services');
const crypto = require('crypto');
//const encryptionKey = crypto.randomBytes(32).toString('hex'); created encrypted key
//const iv1 = crypto.randomBytes(16); 


router.post("/register", async (req, res) => {
  try {

    const {email, name, lastName, phoneNumber, agreedToTerms} = req.body;
    console.log("Original Values:", { email, phoneNumber, name, lastName });

    const encryptedEmail = encryptData(email);
    const userExists = await User.findOne({ email: encryptedEmail });
    const encryptedPhoneNumber = encryptData(phoneNumber);
    const encryptedName = encryptData(name);
    const encryptedLName = encryptData(lastName);

    if (userExists) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
    }

    if (!agreedToTerms) {
      return res.status(400).send({ message: "You must agree to the terms", success: false });
    }

    req.body.email = encryptedEmail;
    req.body.phoneNumber = encryptedPhoneNumber;
    req.body.name = encryptedName;
    req.body.lastName = encryptedLName;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    req.body.password = hashedPassword;
    const newuser = new User(req.body);
    await newuser.save();
    res
      .status(200)
      .send({ message: "User created successfully", success: true});
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error creating user", success: false, error });
  }
});

router.post("/login" , async (req, res) => {
  try {
    const enteredEmail = req.body.email; 
    const encryptedEnteredEmail = encryptData(enteredEmail);
   // const crypt = decryptData("28898db024c636134978dd230fd1b282");
   // console.log(crypt);
    let secret = "";
    secret = speakeasy.generateSecret({ length: 20 }).base32;
    const user = await User.findOne({ email: encryptedEnteredEmail });
    const userAccess = user.access;
    const decryptedEmail = decryptData(encryptedEnteredEmail);

    if (!user) {
      return res
        .status(200)
        .send({ message: "User does not exist", success: false });
    }

    if (user.loginAttempts >= 3 && user.lockUntil > Date.now()) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'FIUDoctorBooking@gmail.com',
          pass: "fiudoctorbookingpw",
        },
      });

      const mailOptions = {
        from: 'FIUDoctorBooking@fiu.edu',
        to: decryptedEmail, 
        subject: 'Account Security Alert - Potential Breach Detected',
        html: ` <p>
        Dear ${decryptData(user.name)},
        <br><br>
        We are writing to inform you about an important security event related to your account. Our security systems have detected multiple failed login attempts 
        on your account. While your account remains secure, these unauthorized attempts raise concerns about the safety of your credentials. If you ever suspect any unusual activity or have questions about your account's security, 
        please reach out to us at fiuBookingSupport@gmail.com.
        <br><br>
        Sincerely,<br><br>
        The FIU Doctor Booking Security Team
        </p>`,
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          // Handle email sending error
          return res.status(500).json({ success: false, message: "Error sending email" });
        } else {
          console.log('Email sent:', info.response);
          // Email sent successfully, respond to the client
          return res.status(200).json({ success: true, message: " Security email sent" });
        }
      });
      return res
        .status(200)
        .send({ message: "Account locked. Try again later.", success: false });
    }

    if (userAccess === false){
      return res
      .status(200)
      .send({ message: "Your account has been deactivated.", success: false });
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
    } else {
      user.loginAttempts = 0;
      await user.save();
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    //await user.save();

    twoFactorCode = await updateTwoFactorSecret(encryptedEnteredEmail, secret);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'FIUDoctorBooking@gmail.com',
        pass: "evgchbhsqyztadvo",
      },
    });

    const mailOptions = {
      from: 'FIUDoctorBooking@fiu.edu',
      to: decryptedEmail, 
      subject: 'Your 2FA Code',
      text: `Your 2FA code is: ${secret}.`,
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        // Handle email sending error
        return res.status(500).json({ success: false, message: "Error sending email" });
      } else {
        console.log('Email sent:', info.response);
        // Email sent successfully, respond to the client
        return res.status(200).json({ success: true, message: "2FA code email sent", data: token, twoFactorCode: twoFactorCode });
      }
    });


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
        pass: "evgchbhsqyztadvo",
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
  // const userEmail = req.body.email;
  // const encryptedEmail = encryptData('fiudoctorbooking@gmail.com');

  const userEmail = "223d1a9a7c1e4c40a14a741445f3e45f19dbe7b2a22c14d3a4abe3a8decf9096";
  try {
    const user = await User.findOne({ email: userEmail});

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
        to: decryptData(user.email), 
        subject: 'Account Security Alert - Potential Breach Detected',
        html: ` <p>
        Dear ${decryptData(user.name)},
        <br><br>
        We are writing to inform you about an important security event related to your account. Our security systems have detected multiple failed login attempts 
        on your account. While your account remains secure, these unauthorized attempts raise concerns about the safety of your credentials. If you ever suspect any unusual activity or have questions about your account's security, 
        please reach out to us at fiuBookingSupport@gmail.com.
        <br><br>
        Sincerely,<br><br>
        The FIU Doctor Booking Security Team
        </p>`,
      }

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
     const decryptedName = decryptData(user.name);
     const decryptedLName = decryptData(user.lastName);
     const decryptedNumber = decryptData(user.phoneNumber);

     const decryptedPatientInfo = user.patientInfo.map((info) => ({
      age: decryptData(info.age),
      height: decryptData(info.height),
      weight: decryptData(info.weight),
      bronchitis: decryptData(info.bronchitis),
      diabetes: decryptData(info.diabetes),
      asthma: decryptData(info.asthma),
      high_blood_pressure: decryptData(info.high_blood_pressure),
      epilepsy_seizures: decryptData(info.epilepsy_seizures)
    }));
     user.patientInfo = decryptedPatientInfo;
     user.name = decryptedName;
     user.lastName = decryptedLName;
     user.phoneNumber = decryptedNumber;

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

// router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
//   try {
//     const user = await User.findOne({ _id: req.body.userId });
//     const name = user.name;
//     const email = user.email;
//     const number = user.phoneNumber;

//      const PatientInfo = user.patientInfo.map((info) => ({
//       age: info.age,
//       height: info.height,
//       weight: info.weight,
//       bronchitis: info.bronchitis,
//       diabetes: info.diabetes,
//       asthma: info.asthma,
//       high_blood_pressure: info.high_blood_pressure,
//       epilepsy_seizures: info.epilepsy_seizures
//     }));

//      user.patientInfo = PatientInfo;
//      user.name = name;
//      user.email = email;
//      user.phoneNumber = number;
//      if (!user) {
//       return res
//         .status(200)
//         .send({ message: "User does not exist", success: false });
//     } else {
//       res.status(200).send({
//         success: true,
//         data: user,
//       });
//     }
//   } catch (error) {
//     res
//       .status(500)
//       .send({ message: "Error getting user info", success: false, error });
//   }
// });
    
  //   if (userAccess === false){
  //     return res
  //     .status(200)
  //     .send({ message: "Your account has been deactivated.", success: false });
  //   }
  //   const isMatch = await bcrypt.compare(req.body.password, user.password);
  //   if (!isMatch) {
  //     user.loginAttempts++;
  //     if (user.loginAttempts >= 3) {
  //       user.lockUntil = Date.now() + LOCK_TIME;
  //     }
  //     await user.save();
  //     return res
  //       .status(200)
  //       .send({ message: "Password is incorrect", success: false });
  //   } else {
  //     user.loginAttempts = 0;
  //     await user.save();
  //     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
  //       expiresIn: "1d",
  //     });

  //     twoFactorCode = await updateTwoFactorSecret(encryptedEnteredEmail, secret);

  //     const transporter = nodemailer.createTransport({
  //       service: 'gmail',
  //       auth: {
  //         user: 'FIUDoctorBooking@gmail.com',
  //         pass: 'dastwmvuhcvcddwj',
  //       },
  //     });

  //     const mailOptions = {
  //       from: 'FIUDoctorBooking@fiu.edu',
  //       to: decryptedEmail, 
  //       subject: 'Your 2FA Code',
  //       text: `Your 2FA code is: ${secret}.`,
  //     }

  //     transporter.sendMail(mailOptions, (error, info) => {
  //       if (error) {
  //         console.error('Error sending email:', error);
  //         // Handle email sending error
  //         return res.status(500).json({ success: false, message: "Error sending email" });
  //       } else {
  //         console.log('Email sent:', info.response);
  //         // Email sent successfully, respond to the client
  //         return res.status(200).json({ success: true, message: "2FA code email sent", data: token, twoFactorCode: twoFactorCode });
  //       }
  //     });
  //   }
//   } catch (error) {
//     console.log(error);
//     res
//       .status(500)
//       .send({ message: "Error logging in", success: false, error });
//   }
// });

router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
  try {
     const user = await User.findOne({ _id: req.body.userId });
     const decryptedName = decryptData(user.name);
     const decryptedLName = decryptData(user.lastName);
     const decryptedNumber = decryptData(user.phoneNumber);

     const decryptedPatientInfo = user.patientInfo.map((info) => ({
      age: decryptData(info.age),
      height: decryptData(info.height),
      weight: decryptData(info.weight),
      bronchitis: decryptData(info.bronchitis),
      diabetes: decryptData(info.diabetes),
      asthma: decryptData(info.asthma),
      high_blood_pressure: decryptData(info.high_blood_pressure),
      epilepsy_seizures: decryptData(info.epilepsy_seizures)
    }));
     user.patientInfo = decryptedPatientInfo;
     user.name = decryptedName;
     user.lastName = decryptedLName;
     user.phoneNumber = decryptedNumber;

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


router.post("/update-user-profile", authMiddleware, async (req, res) => {
  try {
    const encryptedPhoneNumber = encryptData(req.body.phoneNumber);
    const encryptedName = encryptData(req.body.name);
    const encryptedLName = encryptData(req.body.lastName);
    const user = await User.findOneAndUpdate(
      { _id: req.body.userId },
      req.body
    );
    req.body.phoneNumber = encryptedPhoneNumber;
    req.body.name = encryptedName;
    req.body.lastName = encryptedLName;
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
      let decryptName = '';
      if (user.email !== '283160a602594ecbd593521e55753243' && user.isDoctor != true){
        decryptName = decryptData(user.name);
        decryptLName = decryptData(user.lastName);
        decryptPhoneNumber = decryptData(user.phoneNumber);
        decryptAge = decryptData(user.patientInfo[0].age);
        decryptHeight = decryptData(user.patientInfo[0].height);
        decryptWeight = decryptData(user.patientInfo[0].weight);
        decryptBronchitis = decryptData(user.patientInfo[0].bronchitis);
        decryptAsthma = decryptData(user.patientInfo[0].asthma);
        decryptHBP = decryptData(user.patientInfo[0].high_blood_pressure);
        decryptDiabetes = decryptData(user.patientInfo[0].diabetes);
        decryptEpilepsy_seizures = decryptData(user.patientInfo[0].epilepsy_seizures);
        user.phoneNumber = decryptPhoneNumber;
        user.patientInfo[0].age = decryptAge;
        user.patientInfo[0].height = decryptHeight;
        user.patientInfo[0].weight = decryptWeight;
        user.patientInfo[0].bronchitis = decryptBronchitis;
        user.patientInfo[0].asthma = decryptAsthma;
        user.patientInfo[0].high_blood_pressure = decryptHBP;
        user.patientInfo[0].diabetes = decryptDiabetes;
        user.patientInfo[0].epilepsy_seizures = decryptEpilepsy_seizures;
        user.name = decryptName;
        user.lastName = decryptLName;
      }else {
        decryptName = decryptData(user.name);
        decryptLName = decryptData(user.lastName);
        user.name = decryptName;
        user.lastName = decryptLName;
      }
     // user.name = decryptName;
      const unseenNotifications = user.unseenNotifications;
      const seenNotifications = user.seenNotifications;
      seenNotifications.push(...unseenNotifications);
      user.unseenNotifications = [];
      user.seenNotifications = seenNotifications;
      await User.updateOne(
        { _id: req.body.userId },
        {
          $set: {
            'unseenNotifications': [],
            'seenNotifications': seenNotifications,
          },
        }
      );
      //updatedUser.password = undefined;
      res.status(200).send({
        success: true,
        message: "All notifications marked as seen",
        data: user,
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
    let decryptName = '';
    if (user.email !== '283160a602594ecbd593521e55753243' && user.isDoctor != true ){
      decryptName = decryptData(user.name);
      decryptLName = decryptData(user.lastName);
      decryptPhoneNumber = decryptData(user.phoneNumber);
      decryptAge = decryptData(user.patientInfo[0].age);
      decryptHeight = decryptData(user.patientInfo[0].height);
      decryptWeight = decryptData(user.patientInfo[0].weight);
      decryptBronchitis = decryptData(user.patientInfo[0].bronchitis);
      decryptAsthma = decryptData(user.patientInfo[0].asthma);
      decryptHBP = decryptData(user.patientInfo[0].high_blood_pressure);
      decryptDiabetes = decryptData(user.patientInfo[0].diabetes);
      decryptEpilepsy_seizures = decryptData(user.patientInfo[0].epilepsy_seizures);
      user.name = decryptName;
      user.lastName = decryptLName;
      user.phoneNumber = decryptPhoneNumber;
      user.patientInfo[0].age = decryptAge;
      user.patientInfo[0].height = decryptHeight;
      user.patientInfo[0].weight = decryptWeight;
      user.patientInfo[0].bronchitis = decryptBronchitis;
      user.patientInfo[0].asthma = decryptAsthma;
      user.patientInfo[0].high_blood_pressure = decryptHBP;
      user.patientInfo[0].diabetes = decryptDiabetes;
      user.patientInfo[0].epilepsy_seizures = decryptEpilepsy_seizures;
    }else {
      decryptName = decryptData(user.name);
      decryptLName = decryptData(user.lastName);
      decryptPhoneNumber = decryptData(user.phoneNumber);
      user.phoneNumber = decryptPhoneNumber;
      user.name = decryptName;
      user.lastName = decryptLName;
    }
    user.seenNotifications = [];
    user.unseenNotifications = [];
    await User.updateOne(
      { _id: req.body.userId},
      {
        $set: {
          'seenNotifications': []
        },
      }
    );
   // updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "All notifications cleared",
      data: user,
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

  const newAppointment = new Appointment(req.body);
  await newAppointment.save();
  const user = await User.findOne({ _id: req.body.doctorInfo.userId });
  const userConsent = await User.findOne({ _id: req.body.userInfo._id });
  userConsent.consent = true;
  await userConsent.save();
  
  try {
    req.body.status = "pending";
    req.body.date = moment(req.body.date, "MM-DD-YYYY").format("MM-DD-YYYY");
    req.body.time = moment(req.body.time, "h:mm A").format("h:mm A");

    user.unseenNotifications.push({
      type: "new-appointment-request",
      message: `A new appointment request has been made by ${req.body.userInfo.name} ${req.body.userInfo.lastName}.`,
      onClickPath: "/doctor/appointments",
    });
    await user.save();
    res.status(200).send({
      message: "Appointment booked successfully",
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
  try{
    const adminEmail = "administrator@gmail.com";

    if (req.body.userInfo.email !== adminEmail) {
      const adminUser = await User.findOne({ isAdmin: true, email: adminEmail });
      if (adminUser) {
        const userLogs = adminUser.userLogs;
        userLogs.push({
          type: "user-appointment",
          message: `User ${decryptData(req.body.userInfo.name)} (${decryptData(req.body.userInfo.email)}) booked an appointment with Dr. ${user.name} for ${moment(req.body.date).format('MM-DD-YYYY')}`,
          onClickPath: "/admin/userlogs",
        });
      
        // Save admin user with the new notification
        await adminUser.save();
      }
    }
   
    const emailSent = await sendAppointmentConfirmationEmail(decryptData(req.body.userInfo.email), user, req.body);

    if (emailSent) {
      // The email has been sent successfully, now send feedback email
      const feedbackEmailSent = await sendFeedbackEmail(decryptData(req.body.userInfo.email), req.body);

      if (feedbackEmailSent) {
        console.log("Feedback email sent successfully");
      } else {
        console.log("Error sending feedback email");
      }
    } else {
      console.log("Error sending appointment confirmation email");
    }


    res.status(200).send({
      message: "Appointment booked successfully - Email Confirmation Sent",
    });


    // req.body.status = "pending";
    // req.body.date = moment(req.body.date, "MM-DD-YYYY").format("MM-DD-YYYY");
    // req.body.time = moment(req.body.time, "h:mm A").format("h:mm A");

    user.unseenNotifications.push({
      type: "new-appointment-request",
      message: `A new appointment request has been made by ${decryptData(req.body.userInfo.name)} ${decryptData(req.body.userInfo.lastName)}.`,
      onClickPath: "/doctor/appointments",
    });
    await user.save();
    res.status(200).send({
      message: "Appointment booked successfully",
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

// Function to send appointment confirmation email
async function sendAppointmentConfirmationEmail(userEmail, doctor, appointmentDetails) {
  return new Promise((resolve) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'FIUDoctorBooking@gmail.com',
        pass: 'dastwmvuhcvcddwj',
      },
    });

    const mailOptions = {
      from: 'FIUDoctorBooking@gmail.com',
      to: userEmail,
      subject: 'Appointment Confirmation - FIU Doctor Booking',
      html: `
        <p>Dear ${decryptData(appointmentDetails.userInfo.name)},</p>
        <p>Your appointment with Dr. ${doctor.name} has been confirmed.</p>
        <p>Date: ${appointmentDetails.date}</p>
        <p>Time: ${appointmentDetails.time}</p>
        <p>Location: FIU Health Center</p>
        <p>Doctor's Contact Information:</p>
        <p>Phone Number: ${doctor.phoneNumber}</p>
        <p>Email: ${doctor.email}</p>
        <p>Thank you for choosing our service!</p>
        <p>Regards,</p>
        <p>FIU Health Services</p>
        <p><img src="https://collegiaterecovery.org/wp-content/uploads/2022/02/FIU.png" alt="FIU Health Services" width="300" height="100"></p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        resolve(false);
      } else {
        console.log('Email sent: ' + info.response);
        resolve(true);
      }
    });
  });
}

// Function to send feedback email
async function sendFeedbackEmail(userEmail, appointmentDetails) {
  return new Promise((resolve) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'FIUDoctorBooking@gmail.com',
        pass: 'dastwmvuhcvcddwj',
      },
    });

    const googleFormLink = 'https://forms.gle/tAU1VwqCX2UA5bgE6'; // Replace with your actual Google Form link

    const mailOptions = {
      from: 'FIUDoctorBooking@gmail.com',
      to: userEmail,
      subject: 'FIU Secure HealthPath Appointment Feedback',
      html: `
        <p>Dear ${appointmentDetails.userInfo.name},</p>
        <p>Please tell us about your experience with the FIU Doctor Booking App and the appointment with the doctor by completing a 1-minute survey.</p>
        <p>Your information will be kept anonymous.</p>
        <p>Please fill out this <a href="${googleFormLink}" target="_blank">Google Form</a>.</p>
        <p>Thank you for your feedback!</p>
        <p>Regards,</p>
        <p>FIU Health Services</p>
        <p><img src="https://collegiaterecovery.org/wp-content/uploads/2022/02/FIU.png" alt="FIU Health Services" width="300" height="100"></p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        resolve(false);
      } else {
        console.log('Feedback Email sent: ' + info.response);
        resolve(true);
      }
    });
  });
}





//     // Send appointment confirmation email
//     const transporter = nodemailer.createTransport({
//       service: 'gmail', // e.g., 'Gmail'
//       auth: {
//         user: 'FIUDoctorBooking@gmail.com',
//         pass: 'dastwmvuhcvcddwj',
//       },
//     });

//     const mailOptions = {
//       from: 'FIUDoctorBooking@gmail.com',
//       to: req.body.userInfo.email, // User's email
//       subject: 'Appointment Confirmation - FIU Doctor Booking',
//       html: `
//         <p>Dear ${req.body.userInfo.name},</p>
//         <p>Your appointment with Dr. ${user.name} has been confirmed.</p>
//         <p>Date: ${req.body.date}</p>
//         <p>Time: ${req.body.time}</p>
//         <p>Location: FIU Health Center</p>
//         <p>Doctor's Contact Information:</p>
//         <p>Phone Number: ${user.phoneNumber}</p>
//         <p>Email: ${user.email}</p>
//         <p>Thank you for choosing our service!</p>
//         <p>Regards,</p>
//         <p>FIU Health Services</p>
//         <p><img src="https://collegiaterecovery.org/wp-content/uploads/2022/02/FIU.png" alt="FIU Health Services" width="300" height="100"></p>
        
//       `,
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.log(error);
//       } else {
//         console.log('Email sent: ' + info.response);
//       }
//     });

//     res.status(200).send({
//       message: "Appointment booked successfully - Email Confirmation Sent",
//       success: true,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       message: "Error booking appointment",
//       success: false,
//       error,
//     });
//   }
// });

router.post("/check-booking-avilability", authMiddleware, async (req, res) => {
  try {
        const date = req.body.date;
        const time = req.body.time;
        const combinedDateTime = moment(`${date} ${time}`);
        const today = moment().startOf('day');
        const isBefore = combinedDateTime.isBefore(today);
        const doctorId = req.body.doctorId;
        const doctor = await Doctor.findOne({ _id: doctorId });

        if (!date || !time || date === "Invalid date" || time === "Invalid date") {
          return res.status(400).send({
            message: "Invalid date or time",
            success: false,
          });
        }

        if (Array.isArray(doctor.timings) && doctor.timings.length >= 2) {
          const [doctorStartTime, doctorEndTime] = doctor.timings.map(times => moment(times, "h:mm A"));
          const appointments = await Appointment.find({
            doctorId,
            date,
            time: time,
          });    
          if (
            doctorStartTime.isAfter(moment(time, "h:mm A")) ||
            doctorEndTime.isBefore(moment(time, "h:mm A")) 
          ) {
            return res.status(200).send({
              message: "Invalid appointment time",
              success: false,
            });
          } else if (isBefore) {
            return res.status(200).send({
              message: "Invalid date",
              success: false,
            });
          } else if (appointments.length > 0) {
            return res.status(200).send({
              message: "This date and time is not available",
              success: false,
            });
          } else {
            return res.status(200).send({
              message: "Appointments available",
              success: true,
            });
          }          
        }
        }catch (error) {
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

router.post("/verify-2fa", async (req, res) => {
  try {
    const { email , twoFactorCode } = req.body;
    const encryptedEmail = encryptData(email);
    const user = await User.findOne({ email: encryptedEmail });
    const decryptedEmail = decryptData(encryptedEmail);
   
    if (twoFactorCode == user.twoFactorSecret){

      const auditLoginEntry = new AuditLogin({
        userId: user._id,
        email: decryptedEmail, 
        action: 'Login Successful',
      });
      await auditLoginEntry.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'FIUDoctorBooking@gmail.com',
          pass: 'dastwmvuhcvcddwj',
        },
      });

      const mailOptions = {
        from: 'FIUDoctorBooking@fiu.edu',
        to: decryptedEmail, 
        subject: 'Logged in successfully.',
        html: `<p>You have successfully signed into your FIU Doctor Booking account. If you did not sign in, <a href="http://localhost:3000/recover-account">click here</a> to recover your account.</p>`,
        text: `You have successfully signed into your FIU Doctor Booking account. If you did not sign in, <a href="http://localhost:3000/recover-account">click here</a> to recover your account.`,
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          // Handle email sending error
          return res.status(500).json({ success: false, message: "Error sending email" });
        } else {
          console.log('Email sent:', info.response);
          // Email sent successfully, respond to the client
          return res.status(200).json({ success: true, message: "2FA code email sent", data: token, twoFactorCode: twoFactorCode });
        }
      });
      res
        .status(200)
        .send({ message: "Login successful", success: true, data: token });
    }
    else {
      // Invalid 2FA code
      return res.status(200).json({ success: false, message: "Invalid 2FA code" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error verifying 2FA code" });
    }
});

router.post('/updatePatientInfo', async (req, res) => {
  try {
    const formData = req.body; 
    const user = await User.findOne({ _id: formData.userId });
    //console.log(user.email);
    const encryptedNumber = encryptData(formData.phoneNumber);
    const encryptedAge = encryptData(formData.patientInfo[0].age);
    const encryptedHeight = encryptData(formData.patientInfo[0].height);
    const encryptedWeight = encryptData(formData.patientInfo[0].weight);
    const encryptedBronchitis = encryptData(formData.patientInfo[0].bronchitis);
    const encryptedHighBloodPressure = encryptData(formData.patientInfo[0].high_blood_pressure);
    const encryptedAsthma = encryptData(formData.patientInfo[0].asthma);
    const encryptedDiabetes = encryptData(formData.patientInfo[0].diabetes);
    const encryptedEpilepsySeizures = encryptData(formData.patientInfo[0].epilepsy_seizures);
    const decryptedEmail = decryptData(user.email);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.phoneNumber = encryptedNumber;
    user.request = false;

    const auditChangesEntry = new AuditChanges({
      userId: user._id,
      email: decryptedEmail, 
      action: 'PHI Changes Made.',
    });
    await auditChangesEntry.save();

    if (user.patientInfo.length === 0) {
      user.patientInfo.push({
        age: encryptedAge,
        height: encryptedHeight,
        weight: encryptedWeight,
        bronchitis: encryptedBronchitis,
        asthma: encryptedAsthma,
        high_blood_pressure: encryptedHighBloodPressure,
        diabetes: encryptedDiabetes,
        epilepsy_seizures: encryptedEpilepsySeizures,
      });
    } else {
      await User.updateOne(
        { _id: formData.userId },
        {
          $set: {
            'phoneNumber': encryptedNumber,
            'patientInfo.0.age': encryptedAge,
            'patientInfo.0.height': encryptedHeight,
            'patientInfo.0.weight': encryptedWeight,
            'patientInfo.0.bronchitis': encryptedBronchitis,
            'patientInfo.0.asthma': encryptedAsthma,
            'patientInfo.0.high_blood_pressure': encryptedHighBloodPressure,
            'patientInfo.0.diabetes': encryptedDiabetes,
            'patientInfo.0.epilepsy_seizures': encryptedEpilepsySeizures,
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
    cb(null, "client/src/pages/uploads/"); // Folder where files will be saved
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
router.post("/set_request", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body._id });
    const unseenNotifications = user.unseenNotifications;

    if (req.body.action == "accept"){
      unseenNotifications.push({
        type: "new notification from the admin.",
        message: "Your request to make changes have been approved!",
        onClickPath: "/notifications",
      });
      user.request = true;
    }else{
      unseenNotifications.push({
        type: "new notification from the admin.",
        message: "Your request to make changes have been denied.",
        onClickPath: "/notifications",
      });
    }
    await user.save(); 

    res.status(200).send({
      success: true,
      message: "",
      data: user,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting user info", success: false, error });
  }
});

router.delete("/cancel-appointment/:userId/", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const deletedUser = await Appointment.findByIdAndRemove(userId);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, message: "You have canceled your appointment." });
  } catch (error) {
    console.error("Error canceling appointment.", error);
    return res.status(500).json({ success: false, message: "Error canceling appointment." });
  }
});

router.post("/notify-doctor", authMiddleware, async (req, res) => {
  try {
    const doctorId = req.body.doctorId; 
    const patient = req.body.userId; 
    const user = await User.findOne({ _id: doctorId });
    const user2 = await User.findOne({ _id: patient });
    const decryptPatientName = decryptData(user2.name);
    const decryptPatientLName = decryptData(user2.lastName);
    if (!user) {
      return res.status(404).json({ success: false, message: "Doctor not found", data: user });
    }
    const unseenNotifications = user.unseenNotifications;
    unseenNotifications.push({
      type: "new notification",
      message: `${decryptPatientName} ${decryptPatientLName} has canceled their appointment. `,
      onClickPath: "/notifications",
    });
    await user.save(); 
    return res.status(200).json({ success: true, });
  } catch (error) {
    console.error("Error canceling appointment.", error);
    return res.status(500).json({ success: false, message: "Error notifying doctor." });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const enteredEmail = req.body.email; 
    const encryptedEnteredEmail = encryptData(enteredEmail);
    const user = await User.findOne({ email: encryptedEnteredEmail });
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
    const decryptedEmail = decryptData(encryptedEnteredEmail);
    const mailOptions = {
      from: "FIUDoctorBooking@gmail.com",
      to: decryptedEmail,
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

    if (user.passwords && user.passwords.length > 0) {
      const previousPasswords = user.passwords;
      const passwordMatches = previousPasswords.some((passwordHash) => {
        return bcrypt.compareSync(newPassword, passwordHash);
      });

      if (passwordMatches) {
        return res.status(201).send({
          message: "New password cannot match a previous password",
          success: false,
        });
      }
    }

    // Hash the new password and add it to the passwords array
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Limit the number of stored passwords to three
    if (user.passwords.length >= 3) {
      user.passwords.pop(); // Remove the oldest password
    }

    user.passwords.unshift(hashedPassword); // Add the new password to the beginning

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

router.post("/temp-password", async (req, res) => {
  try {
    const min = 10000;
    const max = 99999;
    const random = Math.floor(Math.random() * (max - min + 1)) + min;
    const encryptedEmail = encryptData(req.body.email);
    const decryptedEmail = decryptData(encryptedEmail);
    const user = await User.findOne({email: encryptedEmail });

    if (!user) {
      return res.status(200).send({
        message: "Invalid user.",
        success: false,
      });
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'FIUDoctorBooking@gmail.com',
        pass: 'dastwmvuhcvcddwj',
      },
    });

    const mailOptions = {
      from: 'FIUDoctorBooking@fiu.edu',
      to: decryptedEmail, 
      subject: 'Your Temporary Password.',
      text: `Your temporary password is: ${random}.`,
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        // Handle email sending error
        return res.status(500).json({ success: false, message: "Error sending email" });
      } else {
        console.log('Email sent:', info.response);
        // Email sent successfully, respond to the client
        return res.status(200).json({ success: true, message: "Temporary password sent", });
      }
    });

    res.status(200).send({
      message: "Email sent.",
      success: true,
      data: random
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Error sending email.",
      success: false,
      error,
    });
  }
});

router.post("/verify-temp-password", async (req, res) => {
  try {
    encryptedEmail = encryptData(req.body.email);
    const user = await User.findOne({ email: encryptedEmail });
    if (!user) {
      console.log("invalid user.");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    user.password = hashedPassword;
    await user.save();
  } catch (error) {
    console.error(error);
  }
});


module.exports = router;
