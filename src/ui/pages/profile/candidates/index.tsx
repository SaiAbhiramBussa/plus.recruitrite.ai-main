import CandidateStatsCard from "@/src/component/CandidateStatsCard";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import Loader from "@/src/component/Loader";
import SideMenu from "@/src/component/sideMenu";
import AppContext from "@/src/context/Context";
import axios from "axios";
import { useState, useEffect, use, useContext } from "react";
import { ToastContainer, toast } from "react-toastify";

export default function ImportedCandidates() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { color } = useContext(AppContext);

  useEffect(() => {
    getImportedCandidatesStats();
  }, []);

  const getImportedCandidatesStats = async () => {
    try {
      setLoading(true);
      let res = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/candidate_stats`,
        {
          withCredentials: true,
        }
      );
      let data = res.data;
      setData(res.data);
      return data;
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ backgroundColor: color?.outerBg }}
      className="h-screen overflow-hidden"
    >
      <div className="h-16">
        <DashboardHeader />
      </div>

      <div className="flex flex-grow">
        <SideMenu active="candidateStats" />
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="m-6 flex flex-col justify-between h-screen flex-1 overflow-x-scroll"
        >
          {loading && !data.length ? (
            <div className="flex h-full justify-center items-center">
              <Loader />
            </div>
          ) : (
            <table className="table-auto overflow-y-auto">
              <thead
                style={{ backgroundColor: color?.innerBg }}
                className="sticky top-0"
              >
                <tr>
                  <th className="lg:w-3/12 text-left pl-14 text-sm font-semibold">
                    Job Title
                  </th>
                  <th className="lg:w-3/12 text-left text-sm font-semibold">
                    Job Location
                  </th>
                  <th className="lg:w-2/12 text-left text-sm font-semibold">
                    Created At
                  </th>
                  <th className="lg:w-1/12 py-4 text-left text-sm font-semibold">
                    Inserted
                  </th>
                  <th className="lg:w-1/12 py-4 text-left text-sm font-semibold">
                    Failed
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.map((item: any, index) => (
                  <CandidateStatsCard key={index} item={item} color={color} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
