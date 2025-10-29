import _ from "lodash";
import { NextPage } from "next";
import { DragEvent, useContext, useState } from "react";
import AppContext from "../context/Context";

type InputEvent = React.ChangeEvent<HTMLInputElement>;

interface Props {
  setFile: any;
  file: any;
  accept: string;
}

const FileUpload: NextPage<Props> = ({ setFile, file, accept }) => {
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const { color } = useContext(AppContext);

  const handleDrag = function (e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = function (e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      accept.split(",").map((ext: string) => {
        if (e.dataTransfer.files[0].name.includes(ext)) {
          setFile(e.dataTransfer.files[0]);
        }
      });
    }
  };

  const onSelectFile = (e: InputEvent) => {
    if (e?.target?.files && e?.target?.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div
      style={{ color: color?.secondaryAccent }}
      className="flex flex-col gap-6"
    >
      <label
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        draggable
        onDragEnter={handleDrag}
        style={{ borderColor: color?.primaryAccent }}
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
        {file && file.name && (
          <div>{`${file.name} (${_.round(file.size / 1024, 2)} KB)`}</div>
        )}
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={onSelectFile}
          style={{ display: "none" }}
        />
        {isDragActive && <br />}
      </label>
    </div>
  );
};

export default FileUpload;
