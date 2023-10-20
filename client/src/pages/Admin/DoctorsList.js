import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Layout from "../../components/Layout";
import { showLoading, hideLoading } from "../../redux/alertsSlice";
import {toast} from 'react-hot-toast'
import axios from "axios";
import { Table } from "antd";
import { Popconfirm, Button } from "antd";
import moment from "moment";

function DoctorsList() {
  const [doctors, setDoctors] = useState([]);
  const dispatch = useDispatch();
  const getDoctorsData = async () => {
    try {
      dispatch(showLoading());
      const resposne = await axios.get("/api/admin/get-all-doctors", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      dispatch(hideLoading());
      if (resposne.data.success) {
        setDoctors(resposne.data.data);
      }
    } catch (error) {
      dispatch(hideLoading());
    }
  };

  const changeDoctorStatus = async (record, status) => {
    try {
      dispatch(showLoading());
      const resposne = await axios.post(
        "/api/admin/change-doctor-account-status",
        { doctorId: record._id, userId: record.userId, status: status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      dispatch(hideLoading());
      if (resposne.data.success) {
        toast.success(resposne.data.message);
        getDoctorsData();
      }
    } catch (error) {
      toast.error('Error changing doctor account status');
      dispatch(hideLoading());
    }
  };
  useEffect(() => {
    getDoctorsData();
  }, []);

  const handleDeleteDoctor = async (doctorId) => {
    try {
      dispatch(showLoading());
      const response = await axios.delete(`/api/admin/delete-doctor/${doctorId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      dispatch(hideLoading());
      if (response.data.success) {
        // Update the doctors list by filtering out the deleted doctor
        const updatedDoctors = doctors.filter((doctor) => doctor._id !== doctorId);
        setDoctors(updatedDoctors);
        toast.success("Doctor deleted successfully");
      } 
    } catch (error) {
      toast.error("Error deleting doctor");
      dispatch(hideLoading());
    }
  };
  
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (text, record) => (
        <span>
          {record.firstName} {record.lastName}
        </span>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      render: (record , text) => moment(record.createdAt).format("DD-MM-YYYY"),
    },
    {
      title: "status",
      dataIndex: "status",
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (text, record) => (
        <div className="d-flex">
          {record.status === "pending" && (
            <Popconfirm
              title="Are you sure you want to approve this doctor?"
              onConfirm={() => changeDoctorStatus(record, "approved")}
              okText="Yes"
              cancelText="No"
            >
              <Button type="primary">Approve</Button>
            </Popconfirm>
          )}
          {record.status === "approved" && (
            <Popconfirm
              title="Are you sure you want to block this doctor?"
              onConfirm={() => changeDoctorStatus(record, "blocked")}
              okText="Yes"
              cancelText="No"
            >
              <Button type="danger">Block</Button>
            </Popconfirm>
          )}
        </div>
      ),
    },

    {
      title: "Delete",
      dataIndex: "delete",
      render: (text, record) => (
        <div className="d-flex">
          <Popconfirm
            title="Are you sure you want to delete this doctor?"
            onConfirm={() => handleDeleteDoctor(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="danger">Delete</Button>
          </Popconfirm>
        </div>
      ),
    }      
  ];
  return (
    <Layout>
      <h1 className="page-header">Doctors List</h1>
      <hr />
      <Table columns={columns} dataSource={doctors} />
    </Layout>
  );
}

export default DoctorsList;
