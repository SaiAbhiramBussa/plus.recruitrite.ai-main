import { NextPage } from "next";
import axios from "axios";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import _ from "lodash";
import Select from "@/src/component/Select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TextEditor from "../TextEditor";
import { faAdd } from "@fortawesome/free-solid-svg-icons";
import TextInput from "../TextInput";
import { toast } from "react-toastify";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

interface Props {
  modalState: Dispatch<SetStateAction<boolean>>;
  getAllJob: () => Promise<void>;
  jobTemplateData: any;
  isEdit: boolean;
  industriesData: any;
}

const AddJobTemplate: NextPage<Props> = ({
  modalState,
  getAllJob,
  jobTemplateData,
  isEdit,
  industriesData,
}) => {
  const [industries, setIndustries] = useState<any>(industriesData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [JobTemplateForm, setTemplateForm] = useState<any>({
    industry: isEdit ? jobTemplateData.industry : "",
    job_title: isEdit ? jobTemplateData.job_title : "",
    skill: isEdit ? jobTemplateData.skill : "",
    description: isEdit ? jobTemplateData.description : "",
  });
  const [error, setError] = useState<any>({
    key: "",
    value: "",
  });

  useEffect(() => {
    if (!industriesData) return;

    setIndustries(
      industriesData.map((industry: any) => {
        return {
          label: industry.id,
          value: industry.title,
        };
      })
    );
  }, [industriesData]);

  const addJobTemplate = async () => {
    let payload = {
      ...JobTemplateForm,
      industry_id: JobTemplateForm.industry.label,
      industry_name: JobTemplateForm.industry.value,
    };
    delete payload["industry"];
    if (validateJobTemplateData(payload)) {
      if (isEdit) {
        payload["template_id"] = jobTemplateData.id;
        updateTemplate(payload);
      } else {
        newTemplate(payload);
      }
    }
  };

  const newTemplate = async (payload: any) => {
    setIsLoading(true);
    await axios
      .post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/jobposting_templates`,
        payload,
        {
          withCredentials: true,
        }
      )
      .then(() => {
        modalState(false);
        toast.success("Job Template Added", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        getAllJob();
      })
      .catch((err: any) => {
        modalState(false);
        toast.error(err?.response?.data?.Error, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
      })
      .finally(() => setIsLoading(false));
  };

  const updateTemplate = async (payload: any) => {
    setIsLoading(true);
    await axios
      .put(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/jobposting_templates`,
        payload,
        {
          withCredentials: true,
        }
      )
      .then(() => {
        modalState(false);
        toast.success("Job Template Updated", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        getAllJob();
      })
      .catch((err: any) => {
        modalState(false);
        toast.error(err?.response?.data?.Error, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const validateJobTemplateData = (payload: any): boolean => {
    let isValid = true;
    if (payload.industry_id == "" || !payload.industry_id) {
      isValid = false;
      setError({ key: "industry", value: "Select Industry" });
    } else if (payload.job_title == "" || !payload.job_title) {
      isValid = false;
      setError({ key: "job_title", value: "Title cannot be empty" });
    } else if (payload.skill == "" || !payload.skill) {
      isValid = false;
      setError({ key: "skill", value: "Skill cannot be empty" });
    } else if (
      payload.description == "<p><br></p>" ||
      !payload.description ||
      payload.description == ""
    ) {
      isValid = false;
      setError({ key: "description", value: "Description cannot be empty" });
    }
    return isValid;
  };

  return (
    <div className="relative">
      <div className="overflow-y-auto max-h-[70vh]">
        <Select
          items={industries}
          label={"Industry"}
          section="Industry"
          selected={JobTemplateForm.industry?.value}
          placeholder="Select Industry"
          setSelected={(e) => {
            setError({ key: "", value: "" });
            setTemplateForm({
              ...JobTemplateForm,
              industry: e,
            });
          }}
          error={error?.key === "industry" ? error.value : ""}
        />

        <div className="w-full items-center mt-2">
          <div>
            <TextInput
              label={"Title"}
              section="Title"
              value={JobTemplateForm.job_title}
              placeholder={"Title"}
              onChange={(e) => {
                setError({ key: "", value: "" });
                setTemplateForm({
                  ...JobTemplateForm,
                  job_title: e.target.value,
                });
              }}
              error={error?.key === "title" ? error.value : ""}
              onValue={(value) => {
                setTemplateForm({ ...JobTemplateForm, job_title: value });
              }}
            />
          </div>
          <div>
            <TextInput
              label={"Skill"}
              section="Skill"
              value={JobTemplateForm.skill}
              placeholder={"Title"}
              onChange={(e) => {
                setError({ key: "", value: "" });
                setTemplateForm({ ...JobTemplateForm, skill: e.target.value });
              }}
              error={error?.key === "skill" ? error.value : ""}
              onValue={(value) => {
                setTemplateForm({ ...JobTemplateForm, skill: value });
              }}
            />
          </div>
        </div>
        <TextEditor
          placeholder="Job template description"
          label="Description"
          initialValue={JobTemplateForm.description}
          onChange={(event: any) => {
            setError({ key: "", value: "" });
            setTemplateForm({
              ...JobTemplateForm,
              description: event,
            });
          }}
          error={error?.key === "description" ? error.value : ""}
        />
      </div>
      <ButtonWrapper
        classNames="sticky bottom-0 w-full mt-3 flex items-center justify-center rounded border border-transparent px-5 py-2.5 text-sm font-medium shadow-sm focus:outline-none"
        onClick={addJobTemplate}
        disabled={isLoading}
      >
        <FontAwesomeIcon icon={faAdd} className="h-4 mr-1" />
        <span className="mx-1 hidden lg:block">
          {isEdit ? "Update" : "Add"}
        </span>
      </ButtonWrapper>
    </div>
  );
};

export default AddJobTemplate;
