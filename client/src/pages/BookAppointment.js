import { Button, Col, DatePicker, Form, Input, Row, TimePicker } from "antd";
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useDispatch, useSelector } from "react-redux";
import { showLoading, hideLoading } from "../redux/alertsSlice";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import DoctorForm from "../components/DoctorForm";
import moment from "moment";

function BookAppointment() {
  const [isAvailable, setIsAvailable] = useState(false);
  const navigate = useNavigate();
  const [date, setDate] = useState();
  const [time, setTime] = useState();
  const { user } = useSelector((state) => state.user);
  const [doctor, setDoctor] = useState(null);
  const params = useParams();
  const dispatch = useDispatch();
  const [isChecked, setIsChecked] = useState(false);

  const getDoctorData = async () => {
    try {
      dispatch(showLoading());
      const response = await axios.post(
        "/api/doctor/get-doctor-info-by-id",
        {
          doctorId: params.doctorId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      dispatch(hideLoading());
      if (response.data.success) {
        setDoctor(response.data.data);
      }
    } catch (error) {
      console.log(error);
      dispatch(hideLoading());
    }
  };

  const openPopup = () => {
    // Create the content for the popup
    const popupContent = `
      <html>
      <head>
        <title>Healthcare Information Consent Agreement</title>
      </head>
      <body>
        <h1>Healthcare Information Consent Agreement</h1>
        <style>

        .content-container {
          width: 50%; /* Set the width to half of the body's width */
          margin: 0 auto; /* Center the div horizontally */
          text-align: left; /* Reset text alignment to left */
          padding: 20px; /* Add padding inside the container */
        }
      
        body {
          max-width:100%;
          word-wrap: break-word; /* Enable word wrap */
        }
        h1 {
          text-align: center;
        }

      </style>
 
      <div class="content-container">
      <p>I, the patient, hereby provide my informed and voluntary consent for the collection, storage, and use of my healthcare information by FIU Doctor Booking for the purpose of improving my healthcare services.</p>
      <p><b>Purpose of Data Collection and Usage:</b></p>
      <p>I understand that the System will collect and use my healthcare information for the following purposes:</p>
      <ul>
        <li>Treatment: To provide me with personalized healthcare services, including diagnosis, treatment, and follow-up care.</li><br>
        <li>Medical Records: To maintain accurate and up-to-date medical records related to my health condition and treatment.</li><br>
        <li>Quality Improvement: To analyze and improve the quality of healthcare services provided by the System.</li><br>
        <li>Communication: To facilitate communication between healthcare providers involved in my care.</li>
      </ul>
      <p><b>Questions and Contact Information:</b></p>
      <p>If I have any questions or concerns about the use of my healthcare information or wish to withdraw my consent, I can contact:</p>
      <p>fiudoctorbooking@gmail.com</p>
      <p>I have read and understood the contents of this Healthcare Information Consent Agreement and voluntarily consent to the collection, storage, and use of my healthcare information by FIU Doctor Booking.</p>
    </div>
      </body>
      </html>
    `;

    // Create a new window with the content
    const newWindow = window.open('', '_blank');
    newWindow.document.open();
    newWindow.document.write(popupContent);
    newWindow.document.close();
  };

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked); 
  };

  const checkAvailability = async () => {
    
    try {
      dispatch(showLoading());
      const response = await axios.post(
        "/api/user/check-booking-avilability",
        {
          doctorId: params.doctorId,
          date: date,
          time: time,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (response.data.success) {
        toast.success(response.data.message);
        setIsAvailable(true);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Error booking appointment");
      dispatch(hideLoading());
    }
  };
  const bookNow = async () => {
    setIsAvailable(false);

    try {
      dispatch(showLoading());
      const response = await axios.post(
        "/api/user/book-appointment",
        {
          doctorId: params.doctorId,
          userId: user._id,
          doctorInfo: doctor,
          userInfo: user,
          date: date,
          time: time,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      dispatch(hideLoading());
      if (response.data.success) {
        
        toast.success(response.data.message);
        navigate('/appointments')
      }
    } catch (error) {
      toast.error("Error booking appointment");
      dispatch(hideLoading());
    }
  };

  useEffect(() => {
    getDoctorData();
  }, []);
  return (
    <Layout>
      {doctor && (
        <div>
          <h1 className="page-title">
            {doctor.firstName} {doctor.lastName}
          </h1>
          <hr />
          <Row gutter={20} className="mt-5" align="middle">

            <Col span={8} sm={24} xs={24} lg={8}>
              <img
                src="https://thumbs.dreamstime.com/b/finger-press-book-now-button-booking-reservation-icon-online-149789867.jpg"
                alt=""
                width="100%"
                height='400'
              />
            </Col>
            <Col span={8} sm={24} xs={24} lg={8}>
              <h1 className="normal-text">
                <b>Timings :</b> {doctor.timings[0]} - {doctor.timings[1]}
              </h1>
              <p>
                <b>Phone Number : </b>
                {doctor.phoneNumber}
              </p>
              <p>
                <b>Address : </b>
                {doctor.address}
              </p>
              <p>
                <b>Fee per Visit : </b>
                {doctor.feePerCunsultation}
              </p>
              <p>
                <b>Website : </b>
                {doctor.website}
              </p>
              <div className="d-flex flex-column pt-2 mt-2">
              {!isAvailable && (
                <>
                <DatePicker
                  format="MM-DD-YYYY"
                  onChange={(value) => {
                    setDate(moment(new Date(value)).format("MM-DD-YYYY"));
                    setIsAvailable(false);
                  }}
                />
                <TimePicker
                  format="h:mm a"
                  className="mt-3"
                  minuteStep={15} 
                  onChange={(value) => {
                    setIsAvailable(false);
                    setTime(moment(value, "h:mm A").format("h:mm A"));
                  }}
                />  
                <Button
                  className="primary-button mt-3 full-width-button"
                  onClick={checkAvailability}
                >
                  Check Availability
                </Button>
                </>
                )}

                {isAvailable && (
                    <>
                    <p>
                      Your appointment is on {date} at {time}
                      <br></br><br></br>
                      <b>
                        <a href="#" onClick={openPopup}>Please read the health information consent agreement.</a>
                      </b>
                    </p>
                    <div>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={handleCheckboxChange}
                        />
                        <span className="checkbox-text">I agree to share my health information</span>
                      </label>
                    </div>
                  <Button
                    className="primary-button mt-3 full-width-button"
                    onClick={bookNow}
                    disabled={!isChecked}

                  >
                    Book Now
                  </Button>
                  </>
                )}
              </div>
            </Col>
           
          </Row>
        </div>
      )}
    </Layout>
  );
}

export default BookAppointment;
