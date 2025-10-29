import Loader from "@/src/component/Loader";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import _ from "lodash";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import dynamic from "next/dynamic";
import AppContext from "@/src/context/Context";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

const TrainingCandidatesModal = (props: any) => {
  const [loading, setLoading] = useState<boolean>(false);
  const { color, setTrainedCandidatesModal } = useContext(AppContext);
  const [jobIds, setJobIds] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  const handleTrainingCandidates = async () => {
    setLoading(true);

    const jobs = _.compact(jobIds.split(",").map((job) => job.trim()));

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/training_candidates/download-csv`,
        {
          job_posting_ids: jobs,
        },
        {
          responseType: "blob",
          withCredentials: true,
        }
      );

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `training-candidates-${Date.now()}.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "text/csv",
        })
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTrainedCandidatesModal(false);
    } catch (error) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
      setLoading(false);
      setError(true);
    }
  };

  return (
    <div>
      {loading ? (
        <Loader />
      ) : error ? (
        <p className="py-8">Something went wrong, please try again!</p>
      ) : (
        <div className="flex flex-col gap-6 mt-4">
          <div className="text-md">
            Please specify the Job IDs for which you want to export the ranked
            candidates.
            <div className="w-full">
              <textarea
                style={{ borderColor: color?.outerBg }}
                value={jobIds}
                onChange={(e) => setJobIds(e.target.value)}
                className="w-full px-3 border py-1.5 min-h-[150px] my-4"
                placeholder="Enter Job IDs"
              />
            </div>
          </div>
          <div className="flex items-center justify-end">
            <div>
              <ButtonWrapper
                onClick={handleTrainingCandidates}
                disabled={loading}
                classNames="flex justify-center gap-2 items-center rounded-md border border-transparent px-5 py-2 text-sm font-medium shadow-sm focus:outline-none mt-4"
              >
                <FontAwesomeIcon icon={faDownload} />
                <span className="hidden lg:block">Download</span>
              </ButtonWrapper>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingCandidatesModal;
