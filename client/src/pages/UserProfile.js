// UserProfile.js

import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useDispatch, useSelector } from "react-redux";
import { showLoading, hideLoading } from "../redux/alertsSlice";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import UserForm from "../components/UserForm";



function UserProfile() {
  const { user, setUser } = useSelector((state) => state.user);
  const params = useParams();
  //const [user, setUser] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const onFinish = async (values) => {
    try {
      dispatch(showLoading());
      const response = await axios.post(
        "/api/user/update-user-profile",
        {
          ...values,
          userId: user._id,
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
        navigate("/");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      toast.error("Something went wrong");
    }
  };

  const getUserData = async () => {
    try {
      dispatch(showLoading());
      const response = await axios.post(
        "/api/user/get-user-info-by-user-id",
        {
          userId: params.user._Id,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      dispatch(hideLoading());
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.log(error);
      dispatch(hideLoading());
    }
  };

  useEffect(() => {
    getUserData();
  }, []);
  return (
    <Layout>
      <h1 className="page-title">User Profile</h1>
      <hr />
      {user && <UserForm onFinish={onFinish} initivalValues={user} />}
    </Layout>
  );
}

export default UserProfile;

//   const user = useSelector((state) => state.user);
//   const [users, setUserData] = useState({});
//   const [editableUserData, setEditableUserData] = useState({});
//   const [message, setMessage] = useState("");
//   const [isEditing, setIsEditing] = useState(false);

//   useEffect(() => {
//     const fetchUserData = async (userId) => {
//       try {
//         // Fetch user details from the backend when the component mounts
//         const response = await axios.get(`/api/user/get-profile/{userId}`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         });
  
//         if (response.data.success) {
//           setUserData(response.data.data);
//         } else {
//           // Handle unsuccessful response here, e.g., show an error message
//           console.error("Failed to fetch user data:", response.data.message);
//         }
//       } catch (error) {
//         // Handle other errors, e.g., network errors
//         console.error("Error fetching user data:", error.message);
//       }
//     };
  
//     fetchUserData();
//   }, [user]);
  

//   const columns = [
//     {
//       title: "Name",
//       dataIndex: "name",
//     },
//     {
//       title: "Phone Number",
//       dataIndex: "phoneNumber",
//     },
//     {
//       title: "Email",
//       dataIndex: "email",
//     },
//   ];

//   const handleUpdateProfile = (userId) => {
//     // Send a request to update user details
//     axios
//       .post(`/api/user/update-profile/${userId}`, editableUserData, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       })
//       .then((response) => {
//         setMessage("Profile updated successfully");
//         setUserData(editableUserData); // Update the displayed data
//         setIsEditing(false); // Exit editing mode
//       })
//       .catch((error) => {
//         setMessage("Error updating profile");
//       });
//   };

//   const handleEditProfile = () => {
//     setIsEditing(true); // Enter editing mode
//   };

//   const handleCancelEdit = () => {
//     setEditableUserData(users); // Reset editable data
//     setIsEditing(false); // Exit editing mode
//   };

//   return (
//     <Layout>
//       <h2>User Profile</h2>
//       {message && <p>{message}</p>}
//       {isEditing ? (
//         <div>
//           <EditUserProfile
//             userData={editableUserData}
//             onSave={handleUpdateProfile}
//             onCancel={handleCancelEdit}
//           />
//         </div>
//       ) : (
//         <div>
//           <Table columns={columns} dataSource={[users]} />
//           <Button onClick={handleEditProfile}>Edit Profile</Button>
//         </div>
//       )}
//     </Layout>
//   );

