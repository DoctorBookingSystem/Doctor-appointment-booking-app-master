const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const authMiddleware = require("../middlewares/authMiddleware");
const { updateTwoFactorSecret, encryptData, decryptData } = require('./services');
const Risk = require("../models/riskAssessmentModel");


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

router.get("/get-all-users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({});

      const decryptedUsers = users.map(user => {
        const decryptedName = decryptData(user.name);
        const decryptedEmail = decryptData(user.email);
        
          return {
            ...user._doc, 
            name: decryptedName,
            email: decryptedEmail,
          };
      });

    res.status(200).send({
      message: "Users fetched successfully",
      success: true,
      data: decryptedUsers,
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

router.post("/request_changes", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: '283160a602594ecbd593521e55753243' });
    const notificationMessage = `${req.body.name} ${req.body.lastName} has requested to change their medical information.`        
    const unseenNotifications = user.unseenNotifications;

    unseenNotifications.push({
      type: "new-request change",
      message: notificationMessage,
      onClickPath: "/notifications",
      user: req.body.userId,
      request: true
    });
    await user.save();
    res.status(200).send({
      message: "Your request has been sent to the admin.",
      success: true,
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error sending the request.",
      success: false,
      error,
    });
  }
});

router.post("/revokeAccess", async (req, res) => {
    try {
      const { userId, access } = req.body;
      const user = await User.findOne({_id: userId });

      if (access == false)
        user.access = true;
      else 
        user.access = false;

      await user.save();

      res.status(200).send({
        message: `Access revoked successfully.`,
        success: true,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "There was an error revoking access for this user",
        success: false,
        error,
      });
    }
  }
);

router.post("/add_risk", async (req, res) => {
  try {
    const { risk_id, description, impact_level, probability_level, resolve, completed } = req.body;
    const riskAssessmentEntry = new Risk({
      risk_id: risk_id,
      description: description, 
      impact_level: impact_level, 
      probability_level: probability_level, 
      resolve: resolve, 
      completed: completed, 
      action: 'New Risk Added.',
    });
    await riskAssessmentEntry.save();
    res.status(200).send({
      message: `Risk saved.`,
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "There was an error adding a risk.",
      success: false,
      error,
    });
  }
}
);

router.get('/get_risks', async (req, res) => {
  try {
    const risks = await Risk.find();
    res.status(200).json({
      success: true,
      data: risks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error fetching risks from the database.',
    });
  }
});

module.exports = router;
