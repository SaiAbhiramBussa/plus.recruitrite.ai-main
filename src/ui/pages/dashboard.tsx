import React from "react";
import DashboardView from "@/src/component/Dashboard/DashboardView";
import AuthGuard from "@/src/component/AuthGuard";

const Dashboard = () => {

 return(
     <DashboardView />
 )
}

export default AuthGuard(Dashboard);
