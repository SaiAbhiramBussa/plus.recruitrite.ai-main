import { useContext, useEffect, useState } from "react";
import Breadcrumbs from "./BreadCrumbs";
import CandidateNavbar from "./candidates/CandidateNavbar";
import DashboardHeader from "./Dashboard/DashboardNavbar";
import AppContext from "../context/Context";

const Page404 = () => {
  const [role, setRole] = useState();
  const { color } = useContext(AppContext);

  useEffect(() => {
    var user = JSON.parse(localStorage.getItem("user")!) || {};
    setRole(user.role);
  }, []);

  return (
    <div
      style={{ backgroundColor: color?.innerBg }}
      className="h-screen flex flex-col flex-wrap justify-center items-center w-100"
    >
      {(role === "admin" || role === "employer") && <DashboardHeader />}
      {role === "job_seeker" && <CandidateNavbar />}
      <div
        style={{ color: color?.primaryAccent }}
        className="text-5xl font-bold"
      >
        Page not found
      </div>
      <br />
      <Breadcrumbs
        title={"Go back to home page"}
        backPage=""
        link={
          role === "admin"
            ? "/admin/jobs"
            : role === "employer"
            ? "/dashboard"
            : role === "job_seeker"
            ? "/candidates/dashboard"
            : "/signin"
        }
      />
    </div>
  );
};

export default Page404;
