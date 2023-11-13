import React from "react";
import { Link } from "react-router-dom";
import "../index.css"; // Import your CSS file

function TermsAndConditions() {
  return (
    <div className="authentication">
      <div className="authentication-form card p-3">
        <h1 className="card-title">Terms and Conditions</h1>
        <div className="terms-content">
          <p>Welcome to the FIU Doctor Booking app! We are committed to safeguarding your privacy and ensuring the security of your medical health information.</p><br />
          <p>Rest assured that all the data you provide, whether you're a user seeking medical advice or a doctor offering it, is protected with the utmost care. However, please be aware that in certain situations, your information may be accessed if required by verified medical personnel or mandated by the law. This access will only occur under strict protocols to protect your privacy.</p><br />
          <p>We strictly prohibit any illegal activities on our app. Users and doctors alike are expected to refrain from engaging in any activities that violate the law. By using this app, you agree to these terms and conditions and understand the importance of upholding the privacy and legality of our community.</p>
        </div>
        <Link to="/register" className="anchor mt-2">
           ← Back to Registration
        </Link>
      </div>
    </div>
  );
}

export default TermsAndConditions;


