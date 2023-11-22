import React, { useState } from "react";
import "../layout.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Badge } from "antd";
import { clearUser } from "../redux/userSlice"
//import UserProfile from "../pages/UserProfile";

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const userMenu = [
    {
      name: "Home",
      path: "/",
      icon: "ri-home-line",
    },
    {
      name: "Appointments",
      path: "/appointments",
      icon: "ri-file-list-line",
    },
    {
      name: "Records",
      path: "/records",
      icon: "ri-file-list-line",
    },
    {
      name: "Apply Doctor",
      path: "/apply-doctor",
      icon: "ri-hospital-line",
    },
    {
      name: "Profile",
      path: `/user/profile/${user?._id}`,
      icon: "ri-user-line",
    },
    {
      name: "My Health Information",
      path: "/secure-health-info",
      icon: "ri-file-list-line",
    },
    {
      name: "Health Tips",
      path: "https://www.healthline.com/nutrition/27-health-and-nutrition-tips#bright-lights",
      icon: "ri-hospital-line",
    },
  ];

  const doctorMenu = [
    {
      name: "Home",
      path: "/",
      icon: "ri-home-line",
    },
    {
      name: "Appointments",
      path: "/doctor/appointments",
      icon: "ri-file-list-line",
    },
    {
      name: "Profile",
      path: `/doctor/profile/${user?._id}`,
      icon: "ri-user-line",
    },
    {
      name: "Forms",
      path: `/doctor/patientform/${user?._id}`,
      icon: "ri-file-list-line",
    },
    {
      name: "Documents",
      path: `/doctor/certification/${user?._id}`,
      icon: "ri-file-list-line",
    }
  ];

  const adminMenu = [
    {
      name: "Home",
      path: "/",
      icon: "ri-home-line",
    },
    {
      name: "Users",
      path: "/admin/userslist",
      icon: "ri-user-line",
    },
    {
      name: "User Logs",
      path: "/admin/userlogs",
      icon: "ri-user-line",
    },
    {
      name: "Doctors",
      path: "/admin/doctorslist",
      icon: "ri-user-star-line",
    },
    {
      name: "Profile",
      path: "/profile",
      icon: "ri-user-line",
    },
  ];

  const menuToBeRendered = user?.isAdmin ? adminMenu : user?.isDoctor ? doctorMenu : userMenu;
  const role = user?.isAdmin ? "Admin" : user?.isDoctor ? "Doctor" : "User";
  return (
    <div className="main">
      <div className="d-flex layout">
        <div className="sidebar">
          <div className="sidebar-header">
            <h1 className="logo">FIU Health</h1>
            <h1 className="role">Account Role: {role}</h1>
          </div>

          <div className="menu">
            {menuToBeRendered.map((menu) => {
              const isActive = location.pathname === menu.path;
              return (
                <div
                  className={`d-flex menu-item ${
                    isActive && "active-menu-item"
                  }`}
                >
                  <i className={menu.icon}></i>
                  {!collapsed && <Link to={menu.path}>{menu.name}</Link>}
                </div>
              );
            })}
            <div
              className={`d-flex menu-item `}
              onClick={() => {
                localStorage.clear();
                dispatch(clearUser());  // This will clear the user state in Redux
                navigate("/login");
              }}
            >
              <i className="ri-logout-circle-line"></i>
              {!collapsed && <Link to="/login">Logout</Link>}
            </div>
          </div>
        </div>

        <div className="content">
          <div className="header">
            {collapsed ? (
              <i
                className="ri-menu-2-fill header-action-icon"
                onClick={() => setCollapsed(false)}
              ></i>
            ) : (
              <i
                className="ri-close-fill header-action-icon"
                onClick={() => setCollapsed(true)}
              ></i>
            )}

            <div className="d-flex align-items-center px-4">
              <Badge
                count={user?.unseenNotifications.length}
                onClick={() => navigate("/notifications")}
              >
                <i className="ri-notification-line header-action-icon px-3"></i>
              </Badge>

              <div className="anchor mx-2">
                {user?.name}
              </div>
            </div>
          </div>

          <div className="body">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Layout;
// import React, { useState, useEffect } from "react";
// import "../layout.css";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useSelector, useDispatch } from "react-redux";
// import { Badge } from "antd";
// import { clearUser } from "../redux/userSlice";
// import toast from "react-hot-toast";

// function Layout({ children }) {
//   const [collapsed, setCollapsed] = useState(false);
//   const { user } = useSelector((state) => state.user);
//   const navigate = useNavigate();
//   const location = useLocation();
//   const dispatch = useDispatch();
//   const userMenu = [
//     {
//       name: "Home",
//       path: "/",
//       icon: "ri-home-line",
//     },
//     {
//       name: "Appointments",
//       path: "/appointments",
//       icon: "ri-file-list-line",
//     },
//     {
//       name: "Records",
//       path: "/records",
//       icon: "ri-file-list-line",
//     },
//     {
//       name: "Apply Doctor",
//       path: "/apply-doctor",
//       icon: "ri-hospital-line",
//     },
//     {
//       name: "Profile",
//       path: `/user/profile/${user?._id}`,
//       icon: "ri-user-line",
//     },
//     // {
//     //   name: "Feedback",
//     //   path: "/feedback",
//     //   //name: "Health Tips",
//     //   //path: "https://www.healthline.com/nutrition/27-health-and-nutrition-tips#bright-lights",
//     //   icon: "ri-hospital-line",
//     // },
//     {
//       name: "My Health Information",
//       path: "/secure-health-info",
//       path: "/healthinformation",
//       icon: "ri-file-list-line",
//     },
//     {
//       name: "Health Tips",
//       path: "https://www.healthline.com/nutrition/27-health-and-nutrition-tips#bright-lights",
//       icon: "ri-hospital-line",
//     },
    
//   ];

//   const doctorMenu = [
//     {
//       name: "Home",
//       path: "/",
//       icon: "ri-home-line",
//     },
//     {
//       name: "Appointments",
//       path: "/doctor/appointments",
//       icon: "ri-file-list-line",
//     },
//     {
//       name: "Profile",
//       path: `/doctor/profile/${user?._id}`,
//       icon: "ri-user-line",
//     },
//     {
//       name: "Forms",
//       path: `/doctor/patientform/${user?._id}`,
//       icon: "ri-file-list-line",
//     },
//     {
//       name: "Documents",
//       path: `/doctor/certification/${user?._id}`,
//       icon: "ri-file-list-line",
//       name: "Apply Doctor",
//       path: "/apply-doctor",
//       icon: "ri-hospital-line",
//     }
//   ];

//   const adminMenu = [
//     {
//       name: "Home",
//       path: "/",
//       icon: "ri-home-line",
//     },
//     {
//       name: "Users",
//       path: "/admin/userslist",
//       icon: "ri-user-line",
//     },
//     {
//       name: "User Logs",
//       path: "/admin/userlogs",
//       icon: "ri-user-line",
//     },
//     {
//       name: "Doctors",
//       path: "/admin/doctorslist",
//       icon: "ri-user-star-line",
//     },
//     {
//       name: "Risk Assessment",
//       path: "/admin/RiskAssessment",
//       icon: "ri-user-star-line",
//     },
//     // {
//     //   name: "Profile",
//     //   path: "/profile",
//     //   icon: "ri-user-line",
//     // },
//   ];

//   const menuToBeRendered = user?.isAdmin ? adminMenu : user?.isDoctor ? doctorMenu : userMenu;
//   const role = user?.isAdmin ? "Admin" : user?.isDoctor ? "Doctor" : "User";
//   const token = localStorage.getItem("token");

//   const checkForActivity = () => {
//     const expireTime = localStorage.getItem("expireTime");
//     if (expireTime < Date.now()){
//       localStorage.clear();
//       dispatch(clearUser());
//       navigate("/login");
//       //toast.error("You were logged out due to inactivity.");
//       window.location.reload();
//     }
//   }

//   const updateExpireTime = () =>{
//     const expireTime = Date.now() + 900000;
//     localStorage.setItem("expireTime", expireTime);
//   }

//   useEffect(() => {
//     const interval = setInterval(() => {
//       checkForActivity();
//     },5000);
//   },[]);

//   useEffect(() => {
//     if (token)
//       updateExpireTime();
    
//     window.addEventListener("click", updateExpireTime);
//     window.addEventListener("keypress", updateExpireTime);
//     window.addEventListener("scroll", updateExpireTime);
//     window.addEventListener("mousemove", updateExpireTime);

//     return () =>{
//       window.addEventListener("click", updateExpireTime);
//       window.addEventListener("keypress", updateExpireTime);
//       window.addEventListener("scroll", updateExpireTime);
//       window.addEventListener("mousemove", updateExpireTime);
//     }

//   }, []);

//   return (
//     <div className="main">
//       <div className="d-flex layout">
//         <div className="sidebar">
//           <div className="sidebar-header">
//             <h1 className="logo">FIU Health</h1>
//             <h1 className="role">Account Role: {role}</h1>
//           </div>

//           <div className="menu">
//             {menuToBeRendered.map((menu) => {
//               const isActive = location.pathname === menu.path;
//               return (
//                 <div
//                   className={`d-flex menu-item ${
//                     isActive && "active-menu-item"
//                   }`}
//                 >
//                   <i className={menu.icon}></i>
//                   {!collapsed && <Link to={menu.path}>{menu.name}</Link>}
//                   {!collapsed && (
//                     menu.name === "Health Tips" ? (
//                       <a href={menu.path} target="_blank" rel="noopener noreferrer">
//                         {menu.name}
//                       </a>
//                     ) : (
//                       <Link to={menu.path}>{menu.name}</Link>
//                     )
//                   )}
//                 </div>
//               );
//             })}
//             <div
//               className={`d-flex menu-item `}
//               onClick={() => {
//                 localStorage.clear();
//                 dispatch(clearUser());  // This will clear the user state in Redux
//                 navigate("/login");
//               }}
//             >
//               <i className="ri-logout-circle-line"></i>
//               {!collapsed && <Link to="/login">Logout</Link>}
//             </div>
//           </div>
//         </div>

//         <div className="content">
//           <div className="header">
//             {collapsed ? (
//               <i
//                 className="ri-menu-2-fill header-action-icon"
//                 onClick={() => setCollapsed(false)}
//               ></i>
//             ) : (
//               <i
//                 className="ri-close-fill header-action-icon"
//                 onClick={() => setCollapsed(true)}
//               ></i>
//             )}

//             <div className="d-flex align-items-center px-4">
//               <Badge
//                 count={user?.unseenNotifications.length}
//                 onClick={() => navigate("/notifications")}
//               >
//                 <i className="ri-notification-line header-action-icon px-3"></i>
//               </Badge>

//               <div className="anchor mx-2">
//                 {user?.name}
//               </div>
//             </div>
//           </div>

//           <div className="body">{children}</div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Layout;
