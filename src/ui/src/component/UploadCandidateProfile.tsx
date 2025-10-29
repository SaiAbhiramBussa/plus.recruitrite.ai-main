import React, { useState, DragEvent, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import _ from "lodash";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

type InputEvent = React.ChangeEvent<HTMLInputElement>;

export default function UploadCandidateProfile(props: any, ref: any) {
  const resumeElement: any = React.useRef();
  const {
    setOpenParsingModal,
    setProfileModal,
    setPreview,
    setParsedData,
    setLoading,
    setParsing,
    resumeFile,
    setResumeFile,
    loading,
    uploadFiles,
    color,
  } = props;
  const [userId, setUserId] = useState();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>("");
  const [offers, setOffers] = useState([]);
  const [statusText, setStatusText] = useState("Download file template");
  const [templateUrl, setTemplateUrl] = useState("");
  // const [resumeFile, setResumeFile] = useState<File | undefined | Blob>();

  const { role } = props;

  useEffect(() => {
    let User: any = localStorage.getItem("user");
    if (User) {
      User = JSON.parse(User);
    }
    if (User?.role == "admin") {
      setTemplateUrl(
        `https://startdate-images-1.s3.us-west-1.amazonaws.com/templates/import_candidates.xlsx`
      );
    } else {
      setTemplateUrl(
        `https://startdate-images-1.s3.us-west-1.amazonaws.com/templates/import_job_postings.xlsx`
      );
    }
  }, []);

  useEffect(() => {
    if (offers.length) {
      sendOffers();
    }
  }, [offers]);

  useEffect(() => {
    let user: any = localStorage.getItem("user");
    user = user ? JSON.parse(user) : user;
    setUserId(user.id);
  }, []);

  useEffect(() => {
    if (resumeFile) setPreview(URL.createObjectURL(resumeFile));
  }, [resumeFile]);

  const sendOffers = async () => {
    setLoading(true);
    // await sendMultipleOffers(offers);
    setLoading(false);
    // navigate("/dashboard");
  };

  const onSelectFile = (e: InputEvent) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: any) => {
    try {
      setParsing(true);
      setProfileModal(false);
      setOpenParsingModal(true);
      setLoading(true);
      const formData1 = new FormData();
      formData1.append("resume", file || "");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/parse-resume`,
        formData1,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.status === 200) {
        setParsing(false);
        setParsedData(res.data);
      }
      return res;
    } catch (err) {
      toast.error(
        "Something went wrong fetching details! Please try again later",
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

  const handleDrag = function (e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const handleDrop = function (e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-sm font-light mt-4">
        Add several {role === "candidate" ? "candidates" : "job offers"} by
        attaching a document in the following format: xlsx
      </div>
      <label
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        draggable
        onDragEnter={handleDrag}
        style={{
          borderColor: color?.primaryAccent,
          color: color?.secondaryAccent,
        }}
        className="cursor-pointer border-dashed border-2 flex flex-col gap-3 justify-between items-center w-full px-6 py-16"
      >
        <div style={{ backgroundColor: color?.primaryAccent }} className="p-2">
          <svg className="h-6 w-6" viewBox="0 0 16.051 16.051">
            <path
              id="Trazado_3669"
              data-name="Trazado 3669"
              d="M0,0H16.051V16.051H0Z"
              fill="none"
            />
            <path
              id="Trazado_3670"
              data-name="Trazado 3670"
              d="M8.344,11.829h2.675a.671.671,0,0,0,.669-.669V7.816h1.063a.671.671,0,0,0,.475-1.144L10.156,3.6a.666.666,0,0,0-.943,0l-3.07,3.07a.669.669,0,0,0,.468,1.144H7.675V11.16A.671.671,0,0,0,8.344,11.829ZM5.669,13.167h8.025a.669.669,0,0,1,0,1.338H5.669a.669.669,0,0,1,0-1.338Z"
              transform="translate(-1.656 -1.129)"
              fill="#FFFFFF"
            />
          </svg>
        </div>
        <div className="text-lg font-semibold">Select the file to upload</div>
        <div className="text-sm font-light">Or drag and drop it here</div>
        {resumeFile && resumeFile.name && (
          <div>{`${resumeFile.name} (${resumeFile.size}M)`}</div>
        )}
        <input
          ref={resumeElement}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.doc,video/*"
          onChange={onSelectFile}
          style={{ display: "none" }}
        />
        {dragActive && <br />}
      </label>
      {error != "" ? <small className="text-red-500">{error}</small> : null}
      {role && (
        <div className="text-sm">
          <a
            href={templateUrl}
            style={{ color: color?.primaryAccent }}
            className="font-medium hover:opacity-75"
          >
            {statusText}
          </a>
        </div>
      )}
      <div className="flex items-center justify-end">
        {resumeFile ? (
          <div>
            <ButtonWrapper
              classNames="disabled:cursor-not-allowed flex justify-center items-center rounded-md border border-transparent px-5 py-2 text-base font-medium shadow-sm focus:outline-none mt-4"
              onClick={() => {
                uploadFiles("resume", resumeFile);
              }}
              disabled={loading ? true : false}
            >
              {loading ? "Please wait..." : "Upload"}
            </ButtonWrapper>
          </div>
        ) : null}
      </div>
    </div>
  );
}
