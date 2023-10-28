import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Layout from "../components/Layout";
import { showLoading, hideLoading } from "../redux/alertsSlice";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Table } from "antd";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const params = useParams();
  const dispatch = useDispatch();
  const getAppointmentsData = async () => {
    try {
      dispatch(showLoading());
      const resposne = await axios.get("/api/user/get-appointments-by-user-id", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      dispatch(hideLoading());
      if (resposne.data.success) {
        setAppointments(resposne.data.data);
      }
    } catch (error) {
      dispatch(hideLoading());
    }
  };

  const handleCancelAppointment = async (userId, doctorId) => {
    try {
      const response2 = await axios.post(
        "/api/user/notify-doctor",
        {
          doctorId: doctorId,
          userId: userId
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response2.data.success) {
        //toast.success(response2.data.message);
      }
    }catch (error) {
      console.log(error);
    }

    try {
      dispatch(showLoading());
      const response = await axios.delete(
        `/api/user/cancel-appointment/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      //dispatch(hideLoading());
      if (response.data.success) {
        toast.success(response.data.message);
        window.location.reload();
      }
    } catch (error) {
      console.log(error);
      dispatch(hideLoading());
    }
  };

  const columns = [
    {
        title: "Id",
        dataIndex: "_id",
    },
    {
      title: "Doctor",
      dataIndex: "name",
      render: (text, record) => (
        <span>
          {record.doctorInfo.firstName} {record.doctorInfo.lastName}
        </span>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      render: (text, record) => (
        <span>
          {record.doctorInfo.phoneNumber} 
        </span>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      render: (text, record) => (
        <span>
          {moment(record.date).format("DD-MM-YYYY")} {moment(record.time).format("h:mm a")}
        </span>
      ),
    },
    {
        title: "Status",
        dataIndex: "status",
    },
    {
      title: "Actions",
      dataIndex: "_id",
      render: (text, record) => (
        <span className="clickable-text" onClick={() => handleCancelAppointment(record._id, record.doctorInfo.userId)}>Cancel</span>
      ),
    }
  ];
  useEffect(() => {
    getAppointmentsData();
  }, []);
  return  <Layout>
  <h1 className="page-title">Appointments</h1>
  <hr />
  <Table columns={columns} dataSource={appointments} />
</Layout>
}

export default Appointments;
