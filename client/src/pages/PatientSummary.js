import React, { useEffect,useState } from "react";
import Layout from "../components/Layout";
import { toast } from "react-hot-toast";
import axios from "axios";
import PatientForm from "../components/PatientForm"; // Adjust the import path

const PatientSummary = () => {
  const [patientInfo, setPatientInfo] = useState({});
 

 
  const handleFormUpdate = async (updatedData) => {
    try {
      // You might want to include the user ID in the updated data
      updatedData.userId = '64f529537365e9337d74db88'; // Replace with the actual user ID

      const response = await axios.post('/api/doctor/update-patient-info', updatedData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        // Update the local state with the new data
        setPatientInfo(response.data.data);
        toast.log('Patient information updated successfully');
      } else {
        toast.error('Error updating patient information');
      }
    } catch (error) {
      toast.error('Error updating patient information.', error);
    }
  };

  return (
    <Layout>
    <div>
      <h1>Patient Summary</h1>
      <p>Patient Name: {patientInfo.patientName}</p>
      <p>Phone Number: {patientInfo.patientNumber}</p>
      <p>Email: {patientInfo.patientEmail}</p>
      <p>Date of Birth: {patientInfo.patientDOB}</p>
      <p>Gender: {patientInfo.patientGender}</p>
      {/* Add more patient fields as needed */}

      <h2>Medical Information</h2>
      <p>Reason for Visit: {patientInfo.reasonForVisit}</p>
      <p>Date of Visit: {patientInfo.dateofVisit}</p>
      <p>Medical Conditions: {patientInfo.medicalCondition}</p>
      <p>Allergies: {patientInfo.allergies}</p>
      <p>Prescribed Medications: {patientInfo.medications}</p>
      {/* Add more medical fields as needed */}

      <h2>Doctor's Information</h2>
      <p>Doctor Name: {patientInfo.doctorName}</p>
      <p>Doctor Phone Number: {patientInfo.doctorNumber}</p>
      <p>Doctor Website: {patientInfo.doctorWebsite}</p>
      <p>Electronic Signature: {patientInfo.electronicSignature}</p>
      <p>Date Signed: {patientInfo.dateSigned}</p>
      {/* Add more doctor fields as needed */}

      <PatientForm initialValues={patientInfo} onSubmit={handleFormUpdate} />
    </div>
    </Layout>
  );
};
export default PatientSummary;
