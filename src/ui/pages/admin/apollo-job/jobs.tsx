import Link from "next/link";
import { Key, useContext, useEffect, useState } from "react";
import axios from "axios";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Loader from "@/src/component/Loader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthGuard from "@/src/component/AuthGuard";
import Pagination from "@/src/component/Pagination";
import _ from "lodash";
import AppContext from "@/src/context/Context";
import { colorToRGBA } from "@/src/utils/misc";

const DashboardView = () => {
  const [jobs, setJobs] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [pagingNumber, setPagingNumber] = useState(1);
  const [perPagingNumber, setPerPagingNumber] = useState(50);
  const [paginationData, setPaginationData] = useState<any>();
  const { color } = useContext(AppContext);

  useEffect(() => {
    const debounce = setTimeout(() => {
      getApolloJobs();
    }, 500);

    return () => clearTimeout(debounce);
  }, [pagingNumber, perPagingNumber]);

  const PerPageNumberChange = (perPageNumber: any) => {
    setPerPagingNumber(perPageNumber);
  };

  const PageNumberChange = (pageNumber: any) => {
    setPagingNumber(pageNumber);
  };

  const fetchApolloJobs = async () => {
    try {
      let res: any = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/apollo-jobs?page=${pagingNumber}&per_page=${perPagingNumber}`,
        {
          withCredentials: true,
        }
      );
      let jobsList: any = res?.data?.apollo_jobs;
      let paginationData: any = _.omit(res?.data, "apollo_jobs");
      setPaginationData(paginationData);
      return jobsList;
    } catch (err) {
      return err;
    }
  };

  const deleteJobHandler = async (id: any) => {
    const newJobs = jobs.filter((job: any) => job.id !== id);
    setJobs(newJobs);
    try {
      let res = await axios.delete(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/apollo-jobs/${id}/delete`,
        {
          withCredentials: true,
        }
      );
      let data = res.data;
      return data;
    } catch (err) {
      return err;
    }
  };

  const getApolloJobs = async (): Promise<void> => {
    setLoading(true);
    try {
      const jobsList = await fetchApolloJobs();
      if (jobsList && Object.values(jobsList).length > 0) {
        setLoading(false);
        setJobs(jobsList);
      }
      setLoading(false);
    } catch (error) {}
  };

  return (
    <div>
      <div className="h-16">
        <DashboardHeader />
      </div>

      <div
        style={{
          backgroundColor: color?.outerBg,
          color: color?.secondaryAccent,
        }}
        className="flex flex-col gap-4 w-full px-6 pt-6 grow"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="flex flex-col w-full border-b-2 h-full rounded-md"
        >
          <div className="flex items-center pt-3 pb-2 w-full px-4 justify-between">
            <h2 className="text-lg font-bold cursor-pointer">Apollo Jobs</h2>
            <div className="flex justify-between">
              <Link
                href="create"
                type="button"
                style={{
                  backgroundColor: color?.primaryAccent,
                  color: color?.btnAccent,
                }}
                className="flex items-center justify-center gap-2 border border-transparent px-5 py-2 rounded-md text-sm font-medium shadow-sm hover:opacity-75 focus:outline-none"
                passHref
              >
                <FontAwesomeIcon icon={faPlus} />
                <span className="hidden lg:block text-sm">
                  Create Apollo Jobs
                </span>
              </Link>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-[79vh]">
              <Loader />
            </div>
          ) : jobs?.length ? (
            <>
              <table className="table-auto overflow-y-auto rounded-md mt-2 mx-3">
                <thead
                  style={{
                    backgroundColor: colorToRGBA(
                      color?.outerBg,
                      color?.opacity
                    ),
                  }}
                  className="sticky border-b top-0 rounded-t-md"
                >
                  <tr className="h-12 rounded-t-md">
                    <th className="lg:w-2/12 text-left pl-4">Titles</th>
                    <th className="lg:w-2/12 text-left">Locations</th>
                    <th className="lg:w-1/12">List</th>
                    <th className="lg:w-2/12 text-center">Status</th>
                    <th className="lg:w-1/12 text-center">Inserted</th>
                    <th className="lg:w-1/12 text-center">Updated</th>
                    <th className="lg:w-1/12 text-center">Failed</th>
                    <th className="lg:w-2/12 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job: any, index: Key) => (
                    <tr key={index} className="h-12 table-row w-full border-b">
                      <td className="truncate max-w-[300px] xl:max-w-none text-sm pl-4">
                        {job?.apollo_api_titles
                          ?.split(" ")
                          ?.slice(0, 7)
                          ?.join(" ") || "-"}
                        {job?.apollo_api_titles?.split(" ")?.length > 7
                          ? "..."
                          : ""}
                      </td>
                      <td className="truncate text-sm">
                        {job?.apollo_api_locations || "-"}
                      </td>
                      <td className="truncate text-sm">
                        {job.apollo_account_label_name}
                      </td>
                      <td className="text-center text-sm">
                        <span
                          className={`${
                            job.status === "pending"
                              ? "bg-yellow-400"
                              : "bg-green-400"
                          } px-3 py-1 rounded-full text-xs`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="text-center text-sm">
                        {job.inserted_records}
                      </td>
                      <td className="text-center text-sm">
                        {job.updated_records}
                      </td>
                      <td className="text-center text-sm">
                        {job.failed_records}
                      </td>
                      <td className="flex gap-4 justify-center mt-1.5">
                        <Link
                          href={job.status == "success" ? "" : `${job.id}`}
                          style={
                            job.status == "success"
                              ? {
                                  color: color?.primaryAccent,
                                  backgroundColor: colorToRGBA(
                                    color?.outerBg,
                                    0.4
                                  ),
                                }
                              : {
                                  backgroundColor: colorToRGBA(
                                    color?.primaryAccent,
                                    0.15
                                  ),
                                  color: color?.primaryAccent,
                                }
                          }
                          className={`col-span-1 flex items-center justify-center ${
                            job.status == "success"
                              ? "cursor-not-allowed"
                              : "cursor-pointer"
                          } rounded-md px-3 py-1.5`}
                          passHref
                        >
                          <svg
                            xmlns="httpwww.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                            />
                          </svg>
                        </Link>
                        <button
                          type="button"
                          style={{
                            backgroundColor: colorToRGBA(
                              color?.primaryAccent,
                              0.15
                            ),
                            color: color?.primaryAccent,
                          }}
                          disabled={job.status == "in_progress"}
                          onClick={() => deleteJobHandler(job.id)}
                          className="col-span-1 flex duration-300 px-3 py-1.5 rounded-md items-center border border-transparent text-base font-medium shadow-sm focus:outline-none"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                setCurrentPage={paginationData?.current_page}
                totalItems={paginationData?.total_count}
                currentPage={paginationData?.current_page}
                itemsPerPage={paginationData?.per_page}
                totalPages={paginationData?.total_pages}
                PageNumberChange={PageNumberChange}
                PerPageNumberChange={PerPageNumberChange}
                setPerPagingNumber={setPerPagingNumber}
                perPagingNumber={perPagingNumber}
                setPageNumber={setPagingNumber}
              />
            </>
          ) : (
            <div className="text-center items-center justify-center flex py-5 h-[79vh]">
              <div aria-label="Empty" role="status">
                No jobs created yet
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthGuard(DashboardView);
