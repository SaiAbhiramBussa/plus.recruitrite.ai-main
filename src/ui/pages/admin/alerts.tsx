import { Key, useContext, useEffect, useState } from "react";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import axios from "axios";
import _ from "lodash";
import Loader from "@/src/component/Loader";
import AppContext from "@/src/context/Context";
import Pagination from "@/src/component/Pagination";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthGuard from "@/src/component/AuthGuard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faTriangleExclamation,
  faBell,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { colorToRGBA } from "@/src/utils/misc";

const AdminAlerts = () => {
  const { color } = useContext(AppContext);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [pagingNumber, setPagingNumber] = useState(1);
  const [companiesData, setCompaniesData] = useState<any>({});
  const [perPagingNumber, setPerPagingNumber] = useState(50);
  const [showFirst, setShowFirst] = useState(true);
  const [showSecond, setShowSecond] = useState(false);
  const [showThird, setShowThird] = useState(false);
  const [items, setItems]: any = useState();
  const [alertType, setAlertType] = useState("");

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (showFirst) {
        getAlertCandidates("high");
      } else if (showSecond) {
        getAlertCandidates("medium");
      } else if (showThird) {
        getAlertCandidates("low");
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [pagingNumber, perPagingNumber]);

  useEffect(() => {
    setPagingNumber(1);
    setPerPagingNumber(50);
  }, [alertType]);

  const getAlertCandidates = async (alert_type: string) => {
    try {
      setAlertType(alert_type);
      setLoading(true);
      let res = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/alerts/see_all_profiles?alert_type=${alert_type}&page=${pagingNumber}&per_page=${perPagingNumber}`,
        {
          withCredentials: true,
        }
      );
      let data = res.data;
      setItems(res.data);
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

  const openFirstSection = () => {
    getAlertCandidates("high");
    setShowSecond(false);
    setShowFirst(true);
    setShowThird(false);
  };

  const openSecondSection = () => {
    getAlertCandidates("medium");
    setShowSecond(true);
    setShowFirst(false);
    setShowThird(false);
  };

  const openThirdSection = () => {
    getAlertCandidates("low");
    setShowSecond(false);
    setShowFirst(false);
    setShowThird(true);
  };
  const PerPageNumberChange = (perPageNumber: any) => {
    setPerPagingNumber(perPageNumber);
  };

  const PageNumberChange = (pageNumber: any) => {
    setPagingNumber(pageNumber);
  };
  const selectedRow = (selected: any) => {
    router.push(`/admin/company/${selected?.company_id}`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div className="h-16">
        <DashboardHeader companyName="Admin" section="alerts" />
      </div>

      <div
        style={{
          color: color?.secondaryAccent,
          backgroundColor: color?.outerBg,
        }}
        className="flex flex-col w-full grow min-h-full px-6"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="flex flex-col py-2 w-full h-full min-h-[89vh] relative my-6"
        >
          <div className="flex w-full px-4 justify-between items-center">
            <div className="text-lg font-bold cursor-pointer">Alerts</div>
            <div
              style={{
                color: color?.secondaryAccent,
                borderColor: colorToRGBA(
                  color?.secondaryAccent,
                  color?.opacity
                ),
              }}
              className="text-sm font-medium text-center flex justify-center items-center w-full"
            >
              <button
                style={
                  showFirst
                    ? {
                        color: color?.primaryAccent,
                        borderColor: color?.primaryAccent,
                      }
                    : {
                        color: color?.secondaryAccent,
                        borderColor: color?.secondaryAccent,
                      }
                }
                className={`${
                  showFirst ? "border-b-2 active" : ""
                } hover:opacity-75 p-3 rounded-t-lg flex items-center`}
                onClick={openFirstSection}
              >
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="h-4 mr-2 cursor-pointer text-red-500"
                />
                High
              </button>
              <button
                style={
                  showSecond
                    ? {
                        color: color?.primaryAccent,
                        borderColor: color?.primaryAccent,
                      }
                    : {
                        color: color?.secondaryAccent,
                        borderColor: color?.secondaryAccent,
                      }
                }
                className={`${
                  showSecond ? "border-b-2 active" : ""
                } hover:opacity-75 flex items-center p-3 rounded-t-lg`}
                onClick={openSecondSection}
              >
                <FontAwesomeIcon
                  icon={faBell}
                  className="h-4 mr-2 cursor-pointer text-yellow-500"
                />
                Medium
              </button>
              <button
                style={
                  showThird
                    ? {
                        color: color?.primaryAccent,
                        borderColor: color?.primaryAccent,
                      }
                    : {
                        color: color?.secondaryAccent,
                        borderColor: color?.secondaryAccent,
                      }
                }
                className={`${
                  showThird ? "border-b-2 active" : ""
                } hover:opacity-75 flex items-center p-3 rounded-t-lg`}
                onClick={openThirdSection}
              >
                <FontAwesomeIcon
                  icon={faCircleExclamation}
                  className="h-4 mr-2 cursor-pointer text-green-500"
                />
                Low
              </button>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center h-[50vh] justify-center w-100">
              <Loader />
            </div>
          ) : (
            <table
              style={{ backgroundColor: color?.innerBg }}
              className="table-auto overflow-y-auto rounded-t-md mx-2 mt-2"
            >
              <thead
                style={{
                  backgroundColor: colorToRGBA(color?.outerBg, color?.opacity),
                }}
                className="sticky border-b top-0 rounded-t-md"
              >
                <tr>
                  <th className="lg:w-3/12 text-left font-semibold pl-2">
                    Title
                  </th>
                  <th className="lg:w-3/12 py-2.5 text-left font-semibold pl-2">
                    Location
                  </th>
                  <th className="lg:w-2/12 text-left font-semibold">Company</th>
                  <th className="lg:w-2/12 text-center font-semibold">
                    Candidate Count
                  </th>
                  <th className="lg:w-2/12 text-center font-semibold">
                    Created at
                  </th>
                </tr>
              </thead>
              <tbody>
                {items &&
                  items.alerts.map((item: any, index: Key) => (
                    <tr
                      key={index}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = colorToRGBA(
                          color?.outerBg,
                          color?.opacity
                        ))
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = color?.innerBg)
                      }
                      className="h-12 items-center table-row w-full border-b cursor-pointer"
                      onClick={() => selectedRow(item)}
                    >
                      <td className="truncate pl-2 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
                        <div className="flex-col">{item.title}</div>
                      </td>
                      <td className="truncate px-1 text-sm lg:max-w-[16vw] lg:min-w-[16vw] pl-2">
                        {!item.location.city
                          ? item.location.state
                          : !item.location.state
                          ? item.location.city
                          : item.location.city + ", " + item.location.state}
                      </td>
                      {/* </div> */}
                      <td className="px-1 text-xs lg:text-sm truncate lg:max-w-[10vw] lg:min-w-[10vw]">
                        {item.company}
                      </td>
                      <td className="px-1 text-xs lg:text-sm text-center truncate lg:max-w-[10vw] lg:min-w-[10vw]">
                        {item.job_posting_candidate_count}
                      </td>
                      <td className="px-1 text-xs lg:text-sm text-center truncate lg:max-w-[10vw] lg:min-w-[10vw]">
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
          {!items?.alerts.length && !loading && (
            <div
              style={{ color: color?.primaryAccent }}
              className="flex h-[50vh] justify-center items-center font-semibold"
            >
              No data to show
            </div>
          )}
          {items && items?.alerts.length && (
            <div className="absolute bottom-0 w-[99%] m-auto">
              <Pagination
                setCurrentPage={items?.current_page}
                totalItems={items?.total_count}
                currentPage={items?.current_page}
                itemsPerPage={items?.per_page}
                totalPages={items?.total_pages}
                PageNumberChange={PageNumberChange}
                PerPageNumberChange={PerPageNumberChange}
                setPerPagingNumber={setPerPagingNumber}
                perPagingNumber={perPagingNumber}
                setPageNumber={setPagingNumber}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthGuard(AdminAlerts);
