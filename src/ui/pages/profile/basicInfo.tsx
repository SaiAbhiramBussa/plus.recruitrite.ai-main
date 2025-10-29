import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import SideMenu from "@/src/component/sideMenu";
import AppContext from "@/src/context/Context";
import { useContext } from "react";

export default function BasicInfo() {
  const { color } = useContext(AppContext);

  return (
    <div style={{ backgroundColor: color.outerBg }} className="h-screen">
      <DashboardHeader />
      <div className="flex">
        <SideMenu active="basic_info" />
        <main className="flex-1 px-4 py-4 justify-center flex">
          <h1 className="text-3xl font-bold">Basic Info</h1>
        </main>
      </div>
    </div>
  );
}
