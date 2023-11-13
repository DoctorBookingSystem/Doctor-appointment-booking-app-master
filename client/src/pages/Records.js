import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout";



function Records() {
  const [pdfFile, setPdfFile] = useState(null);
  const [jpgFile, setJpgFile] = useState(null);



  const handlePdfFileChange = (event) => {
    setPdfFile(event.target.files[0]);
  };

  const handleJpgFileChange = (event) => {
    setJpgFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    try {
      const formData = new FormData();
      formData.append("pdfFile", pdfFile);
      formData.append("jpgFile", jpgFile);
  
      const response = await axios.post(
        "/api/user/upload-files",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      // Handle success response
      console.log(response.data);
      toast.success("File uploaded successfully! No viruses detected");
    } catch (error) {
      // Handle error
      console.error(error);
      toast.error("Error Uploading File");
    }
  };
  return (
    <Layout>
      <h1 className="page-title">Medical Records</h1>
      <hr />

      <div>
        <h2>Upload PDF File</h2>
        <input type="file" accept=".pdf" onChange={handlePdfFileChange} />
      </div>
      <div>
        <h2>Upload JPG File</h2>
        <input type="file" accept=".jpg, .jpeg" onChange={handleJpgFileChange} />
      </div>
      <button className="upload-button" onClick={handleFileUpload}>
        Upload Files
      </button>
    </Layout>
  );
}

export default Records;
