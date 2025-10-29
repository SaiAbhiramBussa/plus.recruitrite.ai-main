import {
  importCandidateFile,
  importMultipleJobPosting,
} from "@/src/services/job";
import { useRouter } from "next/router";
import { useRef, useState, DragEvent, useEffect } from "react";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

type InputEvent = React.ChangeEvent<HTMLInputElement>;

export default function UploadOffers(props: any) {
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | undefined | Blob>(
    undefined
  );
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>("");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState({
    clickable: true,
    message: "Download file template",
    error: false,
  });
  const [templateUrl, setTemplateUrl] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const { role, setOpenModal, color } = props;

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

  const sendOffers = async () => {
    setLoading(true);
    // await sendMultipleOffers(offers);
    setLoading(false);
    // navigate("/dashboard");
  };

  const onSelectFile = (e: InputEvent) => {
    setSelectedFile(undefined);
    //validate file
    if (e.target.files && e.target.files[0]) {
      //validate extension
      if (validExtension(e.target.files[0].name, ["xlsx"])) {
        setSelectedFile(e.target.files[0]);
      }
    }
  };

  const uploadFile = async () => {
    setStatusText({ clickable: false, message: "Uploading...", error: false });
    const formData = new FormData();
    if (selectedFile) {
      formData.append("file", selectedFile);
      if (role === "candidate") {
        await importCandidateFile(formData)
          .catch(() =>
            setStatusText({
              clickable: false,
              message: "Something was wrong. Please try to upload again!",
              error: true,
            })
          )
          .then((response: any) => {
            if (response && response.status === 200) {
              setStatusText({
                clickable: false,
                message: "Upload successfull",
                error: false,
              });
              setTimeout(() => {
                router.push("/admin/apollo-job/jobs");
              }, 1000);
            }
          });
      }
      if (role === "multipleJobPosting") {
        await importMultipleJobPosting(formData)
          .catch(() =>
            setStatusText({
              clickable: false,
              message: "Something was wrong. Please try to upload again!",
              error: true,
            })
          )
          .then((response: any) => {
            if (response && response.status === 200) {
              setStatusText({
                clickable: false,
                message: "Upload Successfull",
                error: false,
              });
              setTimeout(() => {
                router.push("/dashboard");
              }, 1000);
            } else {
              setStatusText({
                clickable: false,
                message:
                  response?.response?.data?.Error ||
                  "Something was wrong. Please try to upload again!",
                error: true,
              });
            }
          });
      }
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
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const validExtension = (name: string, extensions: string[]): boolean => {
    setError("");
    if (name) {
      const extension = name.split(".").pop();
      if (extension && extensions.includes(extension.toLowerCase())) {
        return true;
      }
      setError("Invalid file extension: " + extension);
    }
    return false;
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
        style={{ borderColor: color?.primaryAccent }}
        onDragEnter={handleDrag}
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
        {selectedFile && selectedFile.name && (
          <div>{`${selectedFile.name} (${selectedFile.size}M)`}</div>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onSelectFile}
          style={{ display: "none" }}
        />
        {dragActive && <br />}
      </label>
      {error != "" ? <small className="text-red-500">{error}</small> : null}
      {role && (
        <div className="text-sm">
          {statusText.clickable ? (
            <a
              href={templateUrl}
              style={
                statusText.error
                  ? { color: "#dc2626" }
                  : { color: color?.primaryAccent }
              }
              className="font-medium hover:opacity-75"
            >
              {statusText.message}
            </a>
          ) : (
            <span
              style={
                statusText.error
                  ? { color: "#dc2626" }
                  : { color: color?.primaryAccent }
              }
              className="font-medium hover:opacity-75"
            >
              {statusText.message}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center justify-end">
        <div>
          <ButtonWrapper
            disabled={!selectedFile || loading}
            classNames="disabled:cursor-not-allowed flex justify-center items-center rounded-md border border-transparent px-5 py-2 text-base font-medium shadow-sm focus:outline-none mt-4"
            onClick={uploadFile}
          >
            Upload
          </ButtonWrapper>
        </div>
      </div>
    </div>
  );
}
