import AuthGuard from "@/src/component/AuthGuard";
import BillingCard from "@/src/component/BillingCard";
import Breadcrumbs from "@/src/component/BreadCrumbs";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import Loader from "@/src/component/Loader";
import SideMenu from "@/src/component/sideMenu";
import AppContext from "@/src/context/Context";
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Billing = () => {
  let user: any = JSON.parse(localStorage.getItem("user")!);
  let companyid: any = user.company_id ? user.company_id : null;
  const { color } = useContext(AppContext);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBillingHistory();
  }, []);

  const getBillingHistory = async () => {
    try {
      setLoading(true);
      let res = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/billings/`,
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
      className="min-h-screen overflow-hidden"
    >
      <div className="h-16">
        <DashboardHeader />
      </div>

      <div className="flex flex-grow">
        <SideMenu active="billing" />
        <div
          style={{
            backgroundColor: color?.innerBg,
          }}
          className="m-6 flex flex-col justify-between h-screen flex-1 overflow-auto"
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
                  <th className="lg:w-2/12 text-left pl-14 text-sm font-semibold">
                    Invoice
                  </th>
                  <th className="lg:w-1/12 text-left text-sm font-semibold">
                    Billing Date
                  </th>
                  <th className="lg:w-1/12 text-left text-sm font-semibold">
                    Expiry date
                  </th>
                  <th className="lg:w-1/12 py-4 text-left text-sm font-semibold">
                    Amount
                  </th>
                  <th className="lg:w-1/12 py-4 text-left text-sm font-semibold">
                    Plan{" "}
                  </th>
                  <th className="lg:w-1/12 py-4 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="lg:w-1/12 py-4 text-left text-sm font-semibold">
                    Payment
                  </th>
                </tr>
              </thead>

              <tbody>
              {data.filter((item: any) => item?.invoice_id).map((item: any, index) => (
                <BillingCard key={index} item={item} />
              ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthGuard(Billing);
