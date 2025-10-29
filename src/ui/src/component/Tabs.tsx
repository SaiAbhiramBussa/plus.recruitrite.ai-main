import {
  faArrowUp,
  faArrowUpWideShort,
  faBell,
  faCheck,
  faCircleInfo,
  faDatabase,
  faDownload,
  faFileArrowUp,
  faFileImport,
  faMultiply,
  faRankingStar,
  faRepeat,
  faTrash,
  faUpload,
  faUserMinus,
  faUserPlus,
  faUsers,
  faUsersGear,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Key, useEffect, useState } from "react";
import Modal from "./Modal";
import Select from "react-select";
import _ from "lodash";
import { toast } from "react-toastify";
import axios from "axios";
import FileUpload from "./FIleUpload";
import StartDateButton from "./StartDateButton";
import { postOtherCandidate } from "../services/job";
import { showErrorToast, showSuccessToast } from "../common/common.util";
import { Option } from "@/src/common/common.comp";
import { colorToRGBA } from "../utils/misc";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

const Tabs = ({
  tabs,
  defaultTab,
  jobid,
  reprocessHandler,
  deleteCount,
  tabContents,
  pushToTrainingData,
  deleteTrainingData,
  rankCandidates,
  setFilterRankCandidates,
  downloadTrainingData,
  downloadPrescreenedData,
  setPublishCandidatesModal,
  count,
  deleteFromMlOutputHandler,
  publishCandidateHandler,
  setFalse,
  setGlobalActiveTab,
  setLoading,
  enableFullService,
  isEnableFullService,
  selectedCandidates,
  disableFullService,
  mlCandidates,
  searchRef,
  pushToAdwerk,
  color,
  customStyles,
}: any) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [selectedAction, setSelectedAction] = useState("");
  const [isImportCandidateModalOpen, setIsImportCandidateModalOpen] =
    useState<boolean>(false);
  const [isCandidateUploading, setIsCandidateUploading] =
    useState<boolean>(false);
  const [candidateCsvFile, setCandidateCsvFile] = useState<any>();
  const [showReprocessConfirmation, setShowReprocessConfirmation] =
    useState<boolean>(false);
  const path = usePathname();

  const checkedCandidates =
    mlCandidates &&
    mlCandidates?.filter((candidate: any) =>
      selectedCandidates.includes(candidate.candidate_id)
    );
  const selectedPublishedCount =
    checkedCandidates &&
    checkedCandidates?.filter(
      (candidate: any) => candidate.is_published === false
    ).length;
  const selectedUnpublishedCount =
    checkedCandidates &&
    checkedCandidates?.filter(
      (candidate: any) => candidate.is_published === true
    ).length;

  useEffect(() => {
    if (!path) return;

    const currentTab = path?.split("/");

    const tabs: any = {
      "job-info": "Job Info",
      "pre-screening": "Pre-screened candidates",
      "ml-output": "ML Output",
      "training-data": "Training Data",
      "rank-candidates": "Rank Candidates",
    };

    setActiveTab(tabs[currentTab[currentTab.length - 1]]);
  }, [path]);

  useEffect(() => {
    setLoading(true);
    setGlobalActiveTab(activeTab);

    if (searchRef.current) {
      searchRef.current.value = "";
    }
  }, [activeTab]);

  const enableUnPublishBtn = () => {
    if (enableFullService && count > 0) {
      if (mlCandidates.every((candidate: any) => candidate.is_published))
        return true;
      if (checkedCandidates.length !== 0) {
        if (checkedCandidates.length > 0) {
          if (selectedUnpublishedCount === checkedCandidates.length) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const enablePublishBtn = () => {
    if (isEnableFullService && count > 0) {
      if (mlCandidates.every((candidate: any) => !candidate.is_published))
        return true;
      if (checkedCandidates.length !== 0) {
        if (checkedCandidates.length > 0) {
          if (selectedPublishedCount === checkedCandidates.length) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const preScreenedOptions: any = [
    {
      value: "download_prescreened_csv",
      label: `Download (as .csv)`,
      icon: faDownload,
    },
    {
      value: "download_prescreened_zip",
      label: "Download (as .zip)",
      icon: faDownload,
    },
    {
      value: "push_to_training_data_prescreened",
      label: `Push to training data (${count})`,
      icon: faFileArrowUp,
      isDisabled: count > 0 ? false : true,
    },
    {
      value: "push_to_ml_modal",
      label: `Push to ML Model (${count})`,
      icon: faUpload,
      isDisabled: count > 0 ? false : true,
    },
  ];

  const options: any = [
    {
      value: "publish",
      label: `Publish (${count})`,
      icon: faUserPlus,
      isDisabled: enablePublishBtn() ? false : true,
    },
    {
      value: "un_publish",
      label: `Unpublish (${count})`,
      icon: faUserMinus,
      isDisabled: enableUnPublishBtn() ? false : true,
    },
    {
      value: "publish_to_job_posting",
      label: `Publish to job posting (${count})`,
      icon: faArrowUp,
      isDisabled: count > 0 ? false : true,
    },
    {
      value: "push_to_training_data",
      label: `Push to training data (${count})`,
      icon: faFileArrowUp,
      isDisabled: count > 0 ? false : true,
    },
    {
      value: "delete_all",
      label: `Delete (${count})`,
      icon: faTrash,
      isDisabled: count > 0 ? false : true,
    },
    { value: "re_process", label: "Reprocess", icon: faRepeat },
    { value: "alert_user", label: "Alert User", icon: faBell },
    { value: "push_to_adwerk", label: "Push to Adwerk", icon: faArrowUp },
    {
      value: "import_other_candidates",
      label: "Import Other Candidates",
      icon: faFileImport,
    },
  ];

  const trainingDataOptions: any = [
    {
      value: "download_training_data_csv",
      label: `Download (as .csv)`,
      icon: faDownload,
    },
    {
      value: "download_training_data_zip",
      label: "Download (as .zip)",
      icon: faDownload,
    },
    {
      value: "delete_all_training_data",
      label: `Delete (${deleteCount})`,
      icon: faFileArrowUp,
      isDisabled: deleteCount > 0 ? false : true,
    },
    {
      value: "publish_to_job_posting",
      label: `Publish to job posting (${deleteCount})`,
      icon: faArrowUp,
      isDisabled: deleteCount > 0 ? false : true,
    },
    {
      value: "rank_candidates",
      label: `Rank Candidates`,
      icon: faArrowUpWideShort,
    },
    {
      value: "push_to_training_candidates",
      label: `Push To Training`,
      icon: faDatabase,
    },
  ];

  const handleActionSelect = async (event: any) => {
    const selectedValue = event.value;
    setSelectedAction(selectedValue);

    switch (selectedValue) {
      case "publish":
      case "un_publish":
        await publishCandidateHandler(selectedValue);
        break;
      case "push_to_training_data":
      case "push_to_training_data_prescreened":
        await pushToTrainingData();
        break;
      case "delete_all":
        await deleteFromMlOutputHandler();
        break;
      case "re_process":
        setShowReprocessConfirmation(true);
        break;
      case "download_prescreened_csv":
        await downloadPrescreenedData("csv");
        break;
      case "download_prescreened_zip":
        await downloadPrescreenedData("zip");
        break;
      case "publish_to_job_posting":
        setPublishCandidatesModal(true);
        break;
      case "download_training_data_csv":
        await downloadTrainingData("csv");
        break;
      case "download_training_data_zip":
        await downloadTrainingData("zip");
        break;
      case "delete_all_training_data":
        await deleteTrainingData();
        break;
      case "rank_candidates":
        await rankCandidates();
        break;
      case "push_to_ml_modal":
        await pushToMLModal();
        break;
      case "alert_user":
        await alertUser();
        break;
      case "push_to_adwerk":
        await pushToAdwerk();
        break;
      case "push_to_training_candidates":
        await pushCandidatesToTraining(jobid);
        break;
      case "import_other_candidates":
        setIsImportCandidateModalOpen(true);
        break;
      default:
        break;
    }
  };

  const pushCandidatesToTraining = async (job_id: string) => {
    await rankCandidates();
    await axios
      .post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/model_training/training/${job_id}`,
        {},
        {
          withCredentials: true,
        }
      )
      .then(() => {
        toast.success("Candidate are pushed to candidates", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
      })
      .catch((err: any) => {
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
      });
  };

  const setActiveTabHandler = (tab: any) => {
    setFalse();
    setFilterRankCandidates("");
    setActiveTab(tab);
  };

  const pushToMLModal = async () => {
    let payload = {
      candidates: _.map(selectedCandidates),
      job_posting: jobid,
    };

    try {
      let res: any = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/candidate_ml_push`,
        payload,
        {
          withCredentials: true,
        }
      );
      if (res) {
        toast.success(res.data?.Message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const alertUser = async () => {
    try {
      let res: any = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/ml_output/${jobid}`,
        {},
        {
          withCredentials: true,
        }
      );
      if (res) {
        toast.success(res.data?.Message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.Error, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const uploadCSVFile = async () => {
    if (!candidateCsvFile) return;

    let payload = new FormData();
    payload.append("other_candidates", candidateCsvFile);
    setIsCandidateUploading(true);

    await postOtherCandidate(payload, jobid)
      .then((response) => {
        if (response.success) {
          let data = response.data?.data;

          showSuccessToast(
            "Candidates Pushed to ML Screening Queue! Please wait for a while.",
            !data?.queued ? "error" : data?.failed ? "warning" : undefined
          );
        }
      })
      .catch(() => showErrorToast("Something went wrong"))
      .finally(() => {
        setIsCandidateUploading(false);
        setIsImportCandidateModalOpen(false);
      });

    setCandidateCsvFile(null);
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center z-10">
        <div className="flex">
          {tabs.map((tab: any, key: Key) => (
            <button
              key={tab}
              style={
                activeTab === tab
                  ? {
                      color: color?.primaryAccent,
                      borderColor: color?.primaryAccent,
                    }
                  : {
                      color: colorToRGBA(
                        color?.secondaryAccent,
                        color?.opacity
                      ),
                      borderColor: color?.innerBg,
                    }
              }
              data-tooltip-target="tooltip-default"
              className="w-max lg:pb-4 pb-2 pt-2 px-1 flex items-center text-center border-b lg:border-b-2 mr-3 l g:mr-3 text-xs lg:text-sm focus:outline-none hover:opacity-80"
              onClick={() => setActiveTabHandler(tab)}
              data-tip={tab}
              data-for={`tooltip-${key}`}
            >
              {key === 0 && (
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  className="h-4 md:h-3 mr-1 cursor-pointer"
                  title="View Job Info"
                />
              )}
              {key === 1 && (
                <FontAwesomeIcon
                  icon={faUsers}
                  className="h-4 md:h-3 mr-1 cursor-pointer"
                  title="View Prescreened Candidates"
                />
              )}
              {key === 2 && (
                <FontAwesomeIcon
                  icon={faUsersGear}
                  className="h-4 md:h-3 mr-1 cursor-pointer"
                  title="View ML Output"
                />
              )}
              {key === 3 && (
                <FontAwesomeIcon
                  icon={faDatabase}
                  className="h-4 md:h-3 mr-1 cursor-pointer"
                  title="View Training Data"
                />
              )}
              {key === 4 && (
                <FontAwesomeIcon
                  icon={faRankingStar}
                  className="h-4 md:h-3 mr-1 cursor-pointer"
                  title="View Training Data"
                />
              )}
              <span className="hidden md:block">{tab}</span>
            </button>
          ))}
        </div>
        {activeTab === "Pre-screened candidates" && (
          <Select
            options={preScreenedOptions}
            value={selectedAction}
            onChange={handleActionSelect}
            placeholder="Select Action"
            className="w-full font-normal text-sm md:w-48 lg:w-56 md:mt-0 flex justify-end md:block"
            components={{ Option }}
            styles={customStyles}
          />
        )}
        {activeTab === "ML Output" && (
          <Select
            options={options}
            value={selectedAction}
            onChange={handleActionSelect}
            placeholder="Select Action"
            className="w-full font-normal text-sm md:w-48 lg:w-56 md:mt-0 flex justify-end md:block"
            components={{ Option }}
            styles={customStyles}
          />
        )}
        {activeTab === "Training Data" && (
          <Select
            options={trainingDataOptions}
            value={selectedAction}
            onChange={handleActionSelect}
            placeholder="Select Action"
            className="w-full  font-normal text-sm md:w-48 lg:w-56 md:mt-0 flex justify-end md:block"
            components={{ Option }}
            styles={customStyles}
          />
        )}
        {activeTab === "Job Info" && (
          <div className="flex cursor-pointer md:justify-start justify-end mb-2 mt-4 md:mt-0 items-center">
            <div
              style={
                isEnableFullService
                  ? { backgroundColor: color?.primaryAccent }
                  : {
                      backgroundColor: colorToRGBA(
                        color?.secondaryAccent,
                        color?.opacity
                      ),
                    }
              }
              className={`${
                isEnableFullService ? "grid justify-items-end" : ""
              } form-toggle-slider h-6 w-12 rounded-full shadow-inner transition-all duration-200 ease-in-out`}
              onClick={() => setShowConfirmation(true)}
            >
              <div
                style={{ backgroundColor: color?.innerBg }}
                className={`circle h-4 w-4 rounded-full shadow-sm m-1`}
              ></div>
            </div>
            <div className="text-xs ml-2">
              {isEnableFullService
                ? "Disable Full Service"
                : "Enable Full Service"}
            </div>
          </div>
        )}
        <Modal
          open={showConfirmation}
          setOpen={setShowConfirmation}
          header="Confirmation"
        >
          <div className="flex flex-col gap-6 mt-4">
            <div className="text-md">
              Are you sure you want to{" "}
              {isEnableFullService ? "disable" : "enable"} full service plan for
              this company?
            </div>
            <div className="flex items-center justify-end">
              <div>
                <button
                  type="button"
                  className={`${
                    isEnableFullService ? "bg-red-500" : "bg-green-500"
                  } flex justify-center items-center rounded border border-transparent text-white px-4 py-1 text-base font-medium shadow-sm focus:outline-none mt-4 hover:opacity-80`}
                  onClick={() => {
                    setShowConfirmation(false);
                    isEnableFullService
                      ? disableFullService()
                      : enableFullService();
                  }}
                >
                  {isEnableFullService ? (
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faXmark} className="mr-2" />
                      Disable
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCheck} className="mr-2" />
                      Enable
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Modal>
        <Modal
          open={showReprocessConfirmation}
          setOpen={setShowReprocessConfirmation}
          header="Re-Process Confirmation"
        >
          <div className="flex flex-col gap-6">
            <div className="text-md mt-10 flex justify-center">
              Are you sure you want to refresh the ML model?
            </div>
            <div className="flex items-center justify-end">
              <div>
                <ButtonWrapper
                  classNames="flex justify-center items-center rounded border border-transparent px-4 py-1 text-base font-medium shadow-sm focus:outline-none mt-4"
                  onClick={() => {
                    setShowReprocessConfirmation(false);
                    reprocessHandler();
                  }}
                >
                  Proceed
                </ButtonWrapper>
              </div>
            </div>
          </div>
        </Modal>
      </div>
      <div>
        {activeTab === "Job Info" && tabContents[0]}
        {activeTab === "Pre-screened candidates" && tabContents[1]}
        {activeTab === "ML Output" && tabContents[2]}
        {activeTab === "Training Data" && tabContents[3]}
        {activeTab === "Rank Candidates" && tabContents[4]}
      </div>
      <Modal
        open={isImportCandidateModalOpen}
        setOpen={setIsImportCandidateModalOpen}
        section="candidateImport"
        header="Import Candidates"
      >
        <FileUpload
          setFile={setCandidateCsvFile}
          file={candidateCsvFile}
          accept=".csv,.xlsx"
        />
        <div className="flex items-center justify-end">
          <div className="flex gap-1 mt-6">
            <StartDateButton
              isDisabled={isCandidateUploading ? true : false}
              action={uploadCSVFile}
              btnLabel={isCandidateUploading ? "Please wait..." : "Upload"}
              icon={faUpload}
            />
            <StartDateButton
              isDisabled={isCandidateUploading ? true : false}
              action={() => setCandidateCsvFile("")}
              btnLabel={"Clear"}
              icon={faMultiply}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tabs;
