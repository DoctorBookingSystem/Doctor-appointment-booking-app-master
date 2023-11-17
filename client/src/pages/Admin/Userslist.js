import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Layout from "../../components/Layout";
import { showLoading, hideLoading } from "../../redux/alertsSlice";
import axios from "axios";
import { toast } from 'react-hot-toast';
import { Table } from "antd";
import { Popconfirm, Button } from "antd";
import moment from "moment";

function Userslist() {
  const [users, setUsers] = useState([]);
  const dispatch = useDispatch();
  const getUsersData = async () => {
    try {
      dispatch(showLoading());
      const resposne = await axios.get("/api/admin/get-all-users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      dispatch(hideLoading());
      if (resposne.data.success) {
        setUsers(resposne.data.data);
      }
    } catch (error) {
      dispatch(hideLoading());
    }
  };

  useEffect(() => {
    getUsersData();
  }, []);

  const handleDeleteUser = async (userId) => {
    try {
      dispatch(showLoading());
      const response = await axios.delete(`/api/admin/delete-user/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      dispatch(hideLoading());
      if (response.data.success) {
        // Update the users list after successful deletion
        const updatedUsers = users.filter((user) => user._id !== userId);
        setUsers(updatedUsers);
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error("Error deleting user");
      dispatch(hideLoading());
    }
  };
    
  const changeUserAccess = async (record, access) => {
    try {
      dispatch(showLoading());
      console.log(record._id);
      const response = await axios.post("/api/admin/revokeAccess", { userId: record._id, access : access.access }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      //dispatch(hideLoading());
      if (response.data.success) {
        //toast.success(response.data.message);
        window.location.reload();
      }
    } catch (error) {
      dispatch(hideLoading());
      toast.error(error);
    }
  };

  useEffect(() => {
    getUsersData();
  }, []);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      render: (record , text) => moment(record.createdAt).format("DD-MM-YYYY"),
    },
    {
        title: "Actions",
        dataIndex: "actions",
        render: (text, record) => (
          <div className="d-flex">
            <Popconfirm
              title="Are you sure you want to delete this user?"
              onConfirm={() => handleDeleteUser(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="danger">Delete</Button>
            </Popconfirm>
          </div>
        ),
    },
    // {
    //   title: "Actions",
    //   dataIndex: "actions",
    //   render: (text, record) => (
    //     <div className="d-flex">
    //       <h1 className="anchor">Block</h1>
    //     </div>
    //   ),
    // },
    // {
    //   title: "Actions",
    //   dataIndex: "actions",
    //   render: (text, record) => (
    //     <div className="d-flex">
    //       {record.status === "pending" && (
    //         <h1
    //           className="anchor"
    //           onClick={() => changeUserAccess(record, "approved")}
    //         >
    //           Approve
    //         </h1>
    //       )}
    //       {record.status === "approved" && (
    //         <h1
    //           className="anchor"
    //           onClick={() => changeUserAccess(record, "blocked")}
    //         >
    //           Block
    //         </h1>
    //       )}
    //     </div>
    //   ),
    // },
    {
      title: "Access",
      dataIndex: "access",
      render: (text, record) => (
        <div className="d-flex">
          {record && (
            <h1
              className="anchor"
              onClick={() => changeUserAccess(record, record)}
            >
            {record.access ? "Block" : "Unblock"} 
            </h1>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <h1 className="page-header">Users List</h1>
      <hr />
      <Table columns={columns} dataSource={users}/>
    </Layout>
  );
}

export default Userslist;
