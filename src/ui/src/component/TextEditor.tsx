import React from "react";
import "react-quill/dist/quill.snow.css";
import dynamic from "next/dynamic";
import Alert from "./Alerts";
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading ...</p>,
});

type Props = {
  initialValue: any;
  onChange: any;
  label: string;
  placeholder?: string;
  error?: any;
};

const TextEditor = (props: Props) => {
  const { initialValue, onChange, label, placeholder, error } = props;

  return (
    <>
      <div className="mt-10">
        <p className=" font-semibold mb-1 text-sm">{label}</p>
        <ReactQuill
          style={{ height: '120px' }} 
          placeholder={placeholder}
          theme="snow"
          value={initialValue}
          onChange={onChange}
          className="mb-14 rounded-md min-h-[20vh]"
        />
      </div>
      {error && (
        <div className="mt-4">
          <Alert type="error" msg={error} />
        </div>
      )}
    </>
  );
};

export default TextEditor;
