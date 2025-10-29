import AuthGuard from "@/src/component/AuthGuard";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import Loader from "@/src/component/Loader";
import Modal from "@/src/component/Modal";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import _ from "lodash";
import { NextPage } from "next";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import dynamic from "next/dynamic";
import AppContext from "@/src/context/Context";
import { colorToRGBA } from "@/src/utils/misc";
import Pagination from "@/src/component/Pagination";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

interface Props {}

const ModalTraining: NextPage<Props> = ({}) => {
  const [modal, setModal] = useState<any>();
  const [loading, setLoading] = useState<boolean>(false);
  const [activeLoading, setActiveLoading] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<any>();
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] =
    useState<boolean>(false);
  const { color } = useContext(AppContext);
  const [pagingNumber, setPagingNumber] = useState<number>(1);
  const [perPagingNumber, setPerPagingNumber] = useState<number>(50);

  useEffect(() => {
    const debounce = setTimeout(() => {
      getModalTrainData();
    }, 500);

    return () => clearTimeout(debounce);
  }, [pagingNumber, perPagingNumber]);

  const getModalTrainData = () => {
    setLoading(true);
    axios
      .get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/model_training/?page=${pagingNumber}&per_page=${perPagingNumber}`,
        {
          withCredentials: true,
        }
      )
      .then((response) => setModal(response.data))
      .catch((error) => [
        toast.error(error.response?.data?.Error, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        }),
      ])
      .finally(() => setLoading(false));
  };

  const setJobStatus = async (payload: any) => {
    try {
      await axios
        .post(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/model_training/`,
          payload,
          {
            withCredentials: true,
          }
        )
        .then(() => {
          toast.success("Job Status Changed", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
        })
        .catch((err) => {
          toast.error(err.response?.data?.Error, {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
        })
        .finally(() => {
          setActiveLoading(false);
          setIsConfirmationModalOpen(false);
          getModalTrainData();
        });
    } catch (err) {
      toast.error("Server Error", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const toggleJobStatus = (job: any) => {
    setActiveLoading(true);
    const { job_posting_id } = job;
    let currentActiveJob = _.find(modal, (o) => o.is_active);
    if (currentActiveJob) {
      setJobStatus({
        job_posting_id: currentActiveJob?.job_posting_id,
        is_active: false,
      });
    }
    setJobStatus({ job_posting_id, is_active: true });
  };

  const PageNumberChange = (pageNumber: number) => {
    setPagingNumber(pageNumber);
  };

  const PerPageNumberChange = (perPageNumber: number) => {
    setPerPagingNumber(perPageNumber);
  };

  return (
    <>
      <div className="min-h-screen">
        <div className="h-16">
          <DashboardHeader companyName="Admin" section="modalTraining" />
        </div>

        <div
          style={{
            backgroundColor: color?.outerBg,
            color: color?.secondaryAccent,
          }}
          className="flex flex-col w-full grow min-h-full px-6"
        >
          <div
            style={{ backgroundColor: color?.innerBg }}
            className="flex flex-col w-full h-full min-h-[89vh] relative my-6 rounded-md"
          >
            <div className="w-full text-lg font-bold px-4 py-3 flex justify-between">
              Model Auto Training
            </div>

            {loading ? (
              <div className="h-[60vh] flex justify-center items-center">
                <Loader />
              </div>
            ) : (
              <div className="px-2 pt-1">
                <div
                  style={{
                    backgroundColor: colorToRGBA(
                      color?.outerBg,
                      color?.opacity
                    ),
                  }}
                  className="grid grid-cols-12 items-center w-full justify-between p-1 border-b min-w-[800px] rounded-t-md"
                >
                  <div className="col-span-2 flex-col p-2 truncate font-medium text-base">
                    Title
                  </div>
                  <div className="col-span-1 flex-col p-2 truncate font-medium text-base text-center">
                    Major Version
                  </div>
                  <div className="col-span-1 flex-col p-2 truncate font-medium text-base text-center">
                    Minor Version
                  </div>
                  <div className="col-span-2 flex-col p-2 truncate font-medium text-base">
                    Job Posting Id
                  </div>
                  <div className="col-span-2 flex-col p-2 truncate font-medium text-base">
                    S3 Path
                  </div>
                  <div className="col-span-1 flex-col p-2 truncate font-medium text-base">
                    Last Update
                  </div>
                  <div className="col-span-2 flex-col p-2 truncate font-medium text-base text-center">
                    Training Status
                  </div>
                  <div className="col-span-1 flex-col p-2 truncate font-medium text-base text-center">
                    Status
                  </div>
                </div>
                {!modal?.data?.length ? (
                  <div
                    style={{ color: color?.primaryAccent }}
                    className="h-[80vh] flex items-center justify-center font-bold"
                  >
                    No Modal Found
                  </div>
                ) : (
                  <>
                    {modal?.data?.map((mod: any, index: number) => {
                      return (
                        <div
                          key={index}
                          className={`grid grid-cols-12 items-center w-full justify-between p-1 border-b min-w-[800px]`}
                        >
                          <div className="col-span-2 flex flex-col p-2 truncate">
                            <div className="flex flex-wrap text-sm text-left font-normal w-full truncate overflow-ellipsis">
                              <p className="truncate">{mod?.title}</p>
                            </div>
                          </div>

                          <div className="col-span-1 flex flex-col p-2 truncate">
                            <div className="flex flex-wrap text-sm justify-center font-normal w-full truncate overflow-ellipsis">
                              <p className="truncate">{mod?.major_version}</p>
                            </div>
                          </div>

                          <div className="col-span-1 flex flex-col p-2 truncate">
                            <div className="flex flex-wrap text-sm justify-center font-normal w-full truncate overflow-ellipsis">
                              <p className="truncate">{mod?.minor_version}</p>
                            </div>
                          </div>

                          <div className="col-span-2 flex flex-col p-2 truncate">
                            <div className="flex flex-wrap text-sm text-left font-normal w-full truncate overflow-ellipsis">
                              <Link
                                style={{ color: color?.primaryAccent }}
                                href={`/admin/company/${mod.company_id}/job_posting/${mod.job_posting_id}/job-info`}
                                className="cursor-pointer hover:opacity-75 truncate"
                                target="_blank"
                                passHref
                              >
                                {mod?.job_posting_id}
                              </Link>
                            </div>
                          </div>

                          <div className="col-span-2 flex flex-col p-2 truncate">
                            <div className="flex flex-wrap text-sm text-left font-normal w-full truncate overflow-ellipsis">
                              <p className="truncate">
                                <Link
                                  style={{ color: color?.primaryAccent }}
                                  href={`https://${mod?.model_s3_path}`}
                                  className="cursor-pointer hover:opacity-75 truncate"
                                  target="_blank"
                                >
                                  {mod?.model_s3_path}
                                </Link>
                              </p>
                            </div>
                          </div>

                          <div className="col-span-1 flex flex-col p-2 truncate">
                            <div className="flex flex-wrap text-sm text-left font-normal w-full truncate overflow-ellipsis">
                              <p className="truncate">{mod?.updated_at}</p>
                            </div>
                          </div>

                          <div className="col-span-2 flex flex-col p-2 truncate">
                            <div className="flex flex-wrap text-sm justify-center font-normal truncate overflow-ellipsis">
                              <p
                                className={`${
                                  mod?.status === "completed"
                                    ? "bg-green-400"
                                    : "bg-yellow-400"
                                } truncate w-fit px-3 py-1 rounded-full text-xs`}
                              >
                                {mod?.status}
                              </p>
                            </div>
                          </div>

                          <div className="col-span-1 flex divide-x gap-3 items-center justify-center font-thin">
                            <div className="max-h-[3rem] overflow-ellipsis truncate">
                              <div className="slider">
                                <div className="flex cursor-pointer justify-center mb-2 mt-4 md:mt-0 items-center">
                                  <div
                                    style={
                                      mod.is_active
                                        ? {
                                            backgroundColor:
                                              color?.primaryAccent,
                                          }
                                        : { color: color?.outerBg }
                                    }
                                    className={`${
                                      mod.is_active
                                        ? "grid justify-items-end opacity-80 cursor-not-allowed"
                                        : ""
                                    } form-toggle-slider h-6 w-12 rounded-full shadow-inner transition-all duration-200 ease-in-out`}
                                    onClick={() => {
                                      if (!mod.is_active) {
                                        setIsConfirmationModalOpen(true);
                                        setSelectedJob(mod);
                                      }
                                    }}
                                  >
                                    <div
                                      style={{
                                        backgroundColor: color?.innerBg,
                                      }}
                                      className={`circle h-4 w-4 rounded-full shadow-sm m-1`}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <Pagination
                      totalPages={modal.total_pages}
                      totalItems={modal.total_count}
                      currentPage={modal.current_page}
                      itemsPerPage={modal.per_page}
                      PageNumberChange={PageNumberChange}
                      PerPageNumberChange={PerPageNumberChange}
                      setPerPagingNumber={setPerPagingNumber}
                      perPagingNumber={perPagingNumber}
                      setPageNumber={setPagingNumber}
                      setCurrentPage={modal.current_page}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <Modal
          open={isConfirmationModalOpen}
          setOpen={setIsConfirmationModalOpen}
          header="Confirmation"
          section="Confirmation"
        >
          <div className="flex flex-col gap-6 mt-4">
            <div className="text-md">
              Are you sure you want to Activate this job modal ?
              <p className="font-thin">every other modal will get inactive</p>
            </div>
            <div className="flex items-center justify-end">
              <div>
                <ButtonWrapper
                  onClick={() => toggleJobStatus(selectedJob)}
                  disabled={activeLoading}
                  classNames="flex justify-center items-center rounded-md border border-transparent px-5 py-2 text-sm font-medium shadow-sm focus:outline-none mt-4"
                >
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="h-4 mr-1 cursor-pointer"
                  />
                  <span className="mx-1 hidden lg:block">Activate</span>
                </ButtonWrapper>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default AuthGuard(ModalTraining);
