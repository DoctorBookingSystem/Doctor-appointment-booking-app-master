const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const AuditLogin = require("../models/auditLoginModel");
const AuditChanges = require("../models/auditChangesModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const authMiddleware = require("../middlewares/authMiddleware");
const Appointment = require("../models/appointmentModel");
const moment = require("moment");
const speakeasy = require("speakeasy");
const { updateTwoFactorSecret, encryptData, decryptData } = require('./services');
const nodemailer = require("nodemailer");
const crypto = require('crypto');
const LOCK_TIME = 2 * 60 * 1000;
//const encryptionKey = crypto.randomBytes(32).toString('hex'); created encrypted key
//const iv1 = crypto.randomBytes(16); 


router.post("/register", async (req, res) => {
  try {
    const encryptedEmail = encryptData(req.body.email);
    const userExists = await User.findOne({ email: encryptedEmail });
    const encryptedPhoneNumber = encryptData(req.body.phoneNumber);
    const encryptedName = encryptData(req.body.name);
    const encryptedLName = encryptData(req.body.lastName);

    if (userExists) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
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
          pass: 'dastwmvuhcvcddwj',
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

      twoFactorCode = await updateTwoFactorSecret(encryptedEnteredEmail, secret);

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
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Error logging in", success: false, error });
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
  try {
    req.body.status = "pending";
    req.body.date = moment(req.body.date, "MM-DD-YYYY").format("MM-DD-YYYY");
    req.body.time = moment(req.body.time, "h:mm A").format("h:mm A");

    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    const user = await User.findOne({ _id: req.body.doctorInfo.userId });
    const userConsent = await User.findOne({ _id: req.body.userInfo._id });
    userConsent.consent = true;
    await userConsent.save();

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
});

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
