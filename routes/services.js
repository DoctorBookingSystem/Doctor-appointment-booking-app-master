const User = require('../models/userModel');
const crypto = require('crypto');
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;
const IV1 = process.env.IV1;

async function updateTwoFactorSecret(userEmail, secret) {
    try {
      const user = await User.findOne({email: userEmail});
      
      if (!user) 
        throw new Error('User not found');
      
      user.twoFactorSecret = secret;
      console.log(user.twoFactorSecret);
      await user.save();
  
      return { success: true, message: '2FA secret updated successfully' };
    } catch (error) {

      console.error(error);
      return { success: false, message: 'Error updating 2FA secret' };
    }
  }

  function encryptData(userData) {
      const cipher1 = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY, 'hex'), Buffer.from(IV1, 'hex'));
      let encryptedData = cipher1.update(userData, 'utf8', 'hex');
      encryptedData += cipher1.final('hex');
      return encryptedData;
  }

  function decryptData(userData) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SECRET_KEY, 'hex'),  Buffer.from(IV1, 'hex'));
      let decryptedData = decipher.update(userData, 'hex', 'utf8');
      decryptedData += decipher.final('utf8');
      return decryptedData;
    } catch (error) {
      // Handle decryption errors
      console.error('Decryption error:', error);
      return null; // Return null or another error indicator as needed
    }
  }
  
module.exports = { updateTwoFactorSecret, encryptData, decryptData };