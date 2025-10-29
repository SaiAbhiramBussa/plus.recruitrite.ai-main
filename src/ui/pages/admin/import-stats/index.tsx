import { useContext, useEffect, useState } from "react";
import axios from "axios";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import Loader from "@/src/component/Loader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthGuard from "@/src/component/AuthGuard";
import _ from "lodash";
import PopOverComponent from "@/src/component/PopOverComponent";
import Pagination from "@/src/component/Pagination";
import AppContext from "@/src/context/Context";
import { colorToRGBA } from "@/src/utils/misc";

const ImportStats = () => {
  const [importStats, setImportStats] = useState<any>();
  const [paginationData, setPaginationData] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [pagingNumber, setPagingNumber] = useState(1);
  const [perPagingNumber, setPerPagingNumber] = useState(50);
  const { color } = useContext(AppContext);

  useEffect(() => {
    const debounce = setTimeout(() => {
      getImportStats();
    }, 500);

    return () => clearTimeout(debounce);
  }, [pagingNumber, perPagingNumber]);

  const PerPageNumberChange = (perPageNumber: any) => {
    setPerPagingNumber(perPageNumber);
  };

  const PageNumberChange = (pageNumber: any) => {
    setPagingNumber(pageNumber);
  };

  const getImportStats = async () => {
    setLoading(true);
    try {
      let res = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/import_stats?page=${pagingNumber}&per_page=${perPagingNumber}`,
        {
          withCredentials: true,
        }
      );
      if (res?.data) {
        let data: any = res?.data;
        setImportStats(data.import_stats);
        data = _.omit(data, "import_stats");
        setPaginationData(data);
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.Error
          ? err.response.data.Error
          : "Something went wrong!",
        {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="h-16">
        <DashboardHeader />
      </div>

      <div
        style={{ backgroundColor: color.outerBg, color: color.secondaryAccent }}
        className="flex flex-col w-full px-6 py-6 grow"
      >
        <div
          style={{ backgroundColor: color.innerBg }}
          className="flex flex-col w-full h-full pb-4 min-h-[78vh]"
        >
          <div className="flex items-center p-4 w-full justify-between">
            <div className="text-lg font-bold">Import Stats</div>
          </div>
          {loading && (
            <div className="flex justify-center items-center h-[75.5vh]">
              <Loader />
            </div>
          )}
          {!loading && importStats && importStats.length > 0 ? (
            <>
              <table className="table-auto overflow-y-auto mx-3 rounded-t-md">
                <thead
                  style={{
                    backgroundColor: colorToRGBA(
                      color?.outerBg,
                      color?.opacity
                    ),
                  }}
                  className="sticky border-b top-0 rounded-t-md"
                >
                  <tr className="h-12">
                    <th className="lg:w-1/12 text-center font-medium">
                      Company
                    </th>
                    <th className="lg:w-1/12 text-center font-medium">Type</th>
                    <th className="lg:w-1/12 text-center font-medium">
                      Total Count
                    </th>
                    <th className="lg:w-1/12 text-center font-medium">
                      Inserted
                    </th>
                    <th className="lg:w-1/12 text-center font-medium">
                      Updated
                    </th>
                    <th className="lg:w-1/12 text-center font-medium">
                      Failed
                    </th>
                    <th className="lg:w-1/12 text-center font-medium">
                      Created At
                    </th>
                    <th className="lg:w-1/12 text-center font-medium">
                      Updated At
                    </th>
                    <th className="lg:w-1/12 text-center font-medium">
                      Exception log
                    </th>
                    <th className="lg:w-1/12 text-center font-medium">
                      Process log
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {importStats.map((stats: any, key: any) => (
                    <tr
                      key={key}
                      className="h-12 items-center table-row w-full border-b"
                    >
                      <td className="text-center truncate max-w-[8vw] min-w-[8vw] px-3 text-sm">
                        {stats?.company || "-"}
                      </td>
                      <td className="text-center px-3 text-sm">
                        {stats?.type || "-"}
                      </td>
                      <td className="text-center px-3 text-sm">
                        {stats.total_count || "-"}
                      </td>
                      <td className="text-center px-3 text-sm">
                        {stats.inserted || "-"}
                      </td>
                      <td className="text-center px-3 text-sm">
                        {stats.updated || "-"}
                      </td>
                      <td className="text-center px-3 text-sm">
                        {stats.failed || "-"}
                      </td>
                      <td className="text-center px-3 text-sm">
                        {new Date(stats.created_at).toLocaleString() || "-"}
                      </td>
                      <td className="text-center px-3 text-sm">
                        {new Date(stats.updated_at).toLocaleString() || "-"}
                      </td>
                      <td className="text-center px-3 text-sm cursor-pointer">
                        {stats.exception_log ? (
                          <PopOverComponent content={stats.exception_log} />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="text-center px-3 text-sm cursor-pointer">
                        {stats.process_log ? (
                          <PopOverComponent content={stats.process_log} />
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : !loading ? (
            <div className="text-center items-center justify-center flex py-5 h-[75.5vh]">
              <div aria-label="Empty" role="status" className="text-gray-800">
                No stats available
              </div>
            </div>
          ) : null}
        </div>
        {!loading && importStats?.length > 0 && (
          <div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthGuard(ImportStats);
