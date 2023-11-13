import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";

function Certification() {
  const [jpgFile, setJpgFile] = useState(null);

  const handleJpgFileChange = (event) => {
    setJpgFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    try {
      const formData = new FormData();
      formData.append("jpgFile", jpgFile);

      const response = await axios.post(
        "/api/doctor/upload-file",
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
      toast.success("File uploaded successfully!");
    } catch (error) {
      // Handle error
      console.error(error);
      toast.error("Error Uploading File");
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await axios.get(`/api/doctor/download/${filename}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Error downloading file:", error);
    }
  };

  return (
    <Layout>
      <h1 className="page-title">Certification</h1>
      <p className="upload-message">
        Please upload your license or certification document below. Your documents are secure and will be used only for verification purposes.
      </p>
      <hr />

      <div>
        <h3>Upload Certification or Medical License</h3>
        <input type="file" accept=".jpg, .jpeg" onChange={handleJpgFileChange} />
      </div>
      <button className="upload-button" onClick={handleFileUpload}>
        Upload File
      </button>
   
      {jpgFile && (
        <div className="download-section">
          <h2>Uploaded File</h2>
          <p>{jpgFile.name}</p>
          <button className="download-button" onClick={() => handleDownload(jpgFile.name)}>
            Download File
          </button>
        </div>
      )}
    </Layout>
  );
}

export default Certification;


