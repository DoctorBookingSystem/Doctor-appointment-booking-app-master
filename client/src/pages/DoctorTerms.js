// DoctorTerms.js

import React from "react";
import { Link } from "react-router-dom";
import "../index.css"; // Import your CSS file

function DoctorTerms() {
  return (
    <div className="authentication">
      <div className="authentication-form card p-3">
        <h1 className="card-title">Doctor Terms and Conditions</h1>
        <div className="terms-content">
          <p>Welcome to the FIU Doctor Booking app! As a doctor using our platform, we prioritize the privacy and security of both you and your patients' health information.</p><br />
          <p>By registering as a doctor, you acknowledge and agree that your medical license information will be used for verification purposes and background checks. This ensures the legitimacy of healthcare providers on our platform.</p><br />
          <p>You, as a doctor, are responsible for handling and securing the privacy of your patients' health information. Any access to patient data should strictly adhere to professional and ethical standards. Unauthorized sharing or use of patient information is strictly prohibited.</p><br />
          <p>Additionally, you must obtain explicit consent from patients before using their health information for research purposes. Respecting patient privacy and confidentiality is paramount, and any research activities should comply with relevant laws and ethical guidelines.</p><br />
          <p>By using this app as a doctor, you agree to these terms and conditions, demonstrating your commitment to maintaining the highest standards of medical ethics and patient privacy.</p>
        </div>
        <Link to="/register" className="anchor mt-2">
           ← Back to Registration
        </Link>
      </div>
    </div>
  );
}

export default DoctorTerms;
