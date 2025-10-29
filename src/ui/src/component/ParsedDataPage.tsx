import _ from "lodash";
import React, { useState } from "react";
import EduExParsedCard from "./EduExParsedCard";
import TextArea from "./TextArea";
import TextInput from "./TextInput";
import WorkExParsedCard from "./WorkExParsedCard";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PdfPreview from "./EmbedPdf";
import DisabledProfileForm from "./DisabledProfileForm";
import Loader from "./Loader";
import Alert from "./Alerts";
import { Country } from "country-state-city";
import Select from "react-select";
import { colorToRGBA } from "../utils/misc";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

interface CandidateDataInterface {
  work_history?: [];
  education_history?: [];
  skills: [];
  email?: any;
  first_name?: any;
  last_name?: any;
  role?: any;
  location_id?: any;
  reveals_left?: any;
  summary: any;
  phone?: any;
  address?: any;
  picture?: any;
  resumes?: [];
  credentials?: any;
}

export default function ParsedDataPage(props: any) {
  const getCodeLabel = (option: any) => option.value;
  const getCodeValue = (option: any) => option.value;

  const {
    role,
    data,
    previewData,
    uploadFiles,
    candidateId,
    updateCandidateProfile,
    closeModal,
    loadingParsedData,
    resumeFile,
    setParsed,
    color,
  } = props;
  const [parsedData, setParsedData] = useState<CandidateDataInterface>(data);
  const [showWorkExForm, setShowWorkExForm] = useState<boolean>(false);
  const [showCurrentDate, setShowCurrentDate] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showEducationExForm, setShowEducationExForm] =
    useState<boolean>(false);
  const [skill, setSkill] = useState<any>(" ");
  const [countryCode, setCountryCode] = useState<any>();
  const [workObj, setWorkObj]: any = useState({
    title: "",
    description: "",
    from_date: "",
    company: "",
    to_date: "",
  });
  const [eduObj, setEduObj]: any = useState({
    name: "",
    to_date: "",
    degree: "",
    edu_from_date: "",
    edu_to_date: "",
  });
  const [countryCodeError, setCountryCodeError] = useState("");
  const [error, setError] = useState<{
    key: keyof typeof workObj | "";
    value: any;
  }>({ key: "" as any, value: "" });

  const createWorkHistory = () => {
    if (workObj.from_date && !/^\d{4}-\d{2}-\d{2}$/.test(workObj.from_date)) {
      return setError({
        key: "from_date",
        value: "Incorrect format. Please write it as YYYY-MM-DD.",
      });
    }

    if (workObj.to_date && !/^\d{4}-\d{2}-\d{2}$/.test(workObj.to_date))
      return setError({
        key: "to_date",
        value: "Incorrect format. Please write it as YYYY-MM-DD.",
      });

    if (!workObj.from_date)
      return setError({
        key: "from_date",
        value: "This field cannot be empty",
      });

    if (!workObj.to_date)
      return setError({
        key: "to_date",
        value: "This field cannot be empty",
      });

    if (!workObj.company)
      return setError({
        key: "company",
        value: "This field cannot be empty",
      });

    if (!workObj.title)
      return setError({
        key: "title",
        value: "This field cannot be empty",
      });
    const obj = {
      id: null,
      company: workObj.company,
      title: workObj.title,
      from_date: workObj.from_date,
      to_date: workObj.to_date,
      description: workObj.description,
    };

    setParsedData((prevState: any) => ({
      ...prevState,
      work_history: [...prevState.work_history, obj],
    }));

    // resetWorkHistory();
  };

  const updateWorkEx = (id: any, obj: any) => {
    const objectToUpdate: any = _.get(parsedData, "work_history", [])?.find(
      (obj: any) => obj.id === id
    );
    if (objectToUpdate) {
      _.set(objectToUpdate, "company", _.get(obj, "company", ""));
      _.set(objectToUpdate, "description", _.get(obj, "description", ""));
      _.set(objectToUpdate, "from_date", _.get(obj, "from_date", ""));
      _.set(objectToUpdate, "to_date", _.get(obj, "to_date", null));
      _.set(objectToUpdate, "title", _.get(obj, "title", null));
    }
  };

  const createEduHistory = () => {
    if (
      eduObj.edu_from_date &&
      !/^\d{4}-\d{2}-\d{2}$/.test(eduObj.edu_from_date)
    )
      return setError({
        key: "edu_from_date",
        value: "Incorrect format. Please write it as YYYY-MM-DD.",
      });

    if (eduObj.edu_to_date && !/^\d{4}-\d{2}-\d{2}$/.test(eduObj.edu_to_date))
      return setError({
        key: "edu_to_date",
        value: "Incorrect format. Please write it as YYYY-MM-DD.",
      });

    if (!eduObj.name)
      return setError({
        key: "name",
        value: "This field cannot be empty",
      });

    if (!eduObj.edu_from_date)
      return setError({
        key: "edu_from_date",
        value: "This field cannot be empty",
      });

    if (!eduObj.edu_to_date)
      return setError({
        key: "edu_to_date",
        value: "This field cannot be empty",
      });

    if (!eduObj.degree)
      return setError({
        key: "degree",
        value: "This field cannot be empty",
      });
    setShowEducationExForm(false);

    const obj = {
      id: null,
      degree: eduObj.degree,
      name: eduObj.name,
      from_date: eduObj.edu_from_date,
      to_date: eduObj.edu_to_date,
    };

    setParsedData((prevState: any) => ({
      ...prevState,
      education_history: [...prevState.education_history, obj],
    }));

    resetEduHistory();
  };

  const takeCurrentDate = () => {
    if (showCurrentDate) setWorkObj((f: any) => ({ ...f, to_date: "" }));
    else
      setWorkObj((f: any) => ({
        ...f,
        to_date: new Date().toISOString().split("T")[0],
      }));
    setShowCurrentDate(!showCurrentDate);
  };

  const deleteWorkCard = (objectId: any, newKey: any, newValue: boolean) => {
    setParsedData((prevState: any) => ({
      ...prevState,
      work_history: prevState.work_history.map((obj: any, key: any) => {
        if (key === objectId) {
          return {
            ...obj,
            [newKey]: newValue,
          };
        }
        return obj;
      }),
    }));
  };

  const addSKill = (e: any) => {
    if (e.key === "Enter") {
      const obj = {
        candidate_skill_id: null,
        skill: skill,
      };
      setParsedData((prevState: any) => ({
        ...prevState,
        skills: [...prevState.skills, obj],
      }));
      setSkill(" ");
    }
  };

  const deleteEduCard = (objectId: any, newKey: any, newValue: boolean) => {
    setParsedData((prevState: any) => ({
      ...prevState,
      education_history: prevState.education_history.map((obj: any) => {
        if (obj.id === objectId) {
          return {
            ...obj,
            [newKey]: newValue,
          };
        }
        return obj;
      }),
    }));
  };

  const isValidCountryCode = (countryCode: any) => {
    const countryCodeRegex = /^\+[1-9]\d{0,3}$/;
    return countryCodeRegex.test(countryCode);
  };

  const validateData = () => {
    if (isValidCountryCode(countryCode)) {
      parsedData.phone = countryCode + parsedData.phone;
      return true;
    } else {
      if (!countryCode) return setCountryCodeError("Please fill this field");
      else return setCountryCodeError("Incorrect country code");
    }
  };

  const resetWorkHistory = () => {
    setWorkObj((f: any) => ({ ...f, company: "" }));
    setWorkObj((f: any) => ({ ...f, title: "" }));
    setWorkObj((f: any) => ({ ...f, from_date: "" }));
    setWorkObj((f: any) => ({ ...f, to_date: "" }));
    setWorkObj((f: any) => ({ ...f, description: "" }));
  };

  const updateEduEx = (id: any, obj: any) => {
    const objectToUpdate: any = _.get(
      parsedData,
      "education_history",
      []
    )?.find((obj: any) => obj.id === id);
    if (objectToUpdate) {
      _.set(objectToUpdate, "name", _.get(obj, "name", ""));
      _.set(objectToUpdate, "degree", _.get(obj, "degree", ""));
      _.set(objectToUpdate, "edu_from_date", _.get(obj, "from_date", null));
      _.set(objectToUpdate, "edu_to_date", _.get(obj, "to_date", null));
    }
  };

  const resetEduHistory = () => {
    setEduObj((f: any) => ({ ...f, degree: "" }));
    setEduObj((f: any) => ({ ...f, name: "" }));
    setEduObj((f: any) => ({ ...f, edu_from_date: "" }));
    setEduObj((f: any) => ({ ...f, edu_to_date: "" }));
  };

  const setField = React.useCallback(
    (name: any, value: any) => {
      setParsedData((f: any) =>
        name !== "address"
          ? { ...f, [name]: value }
          : { ...f, address: { ...f.address, city: value } }
      );
    },
    [setParsedData]
  );

  const removeSkill = (id: any) => {
    const arr = parsedData?.skills.filter(
      (skill: any) => skill.candidate_skill_id !== id
    );
    setParsedData((prevState: any) => ({
      ...prevState,
      skills: arr,
    }));
  };

  const phoneCodeOptions = Country.getAllCountries().map((country) => ({
    label:
      country?.phonecode[0] === "+"
        ? country?.phonecode
        : "+" + country?.phonecode,
    value:
      country?.phonecode[0] === "+"
        ? country?.phonecode
        : "+" + country?.phonecode,
  }));

  return (
    <div className="overflow-y-scroll">
      {loadingParsedData ? (
        <div
          className="flex w-full overflow-y-scroll pb-4"
          style={{ height: "75vh" }}
        >
          {role != "admin" ? (
            <div className="w-1/2 overflow-y-scroll">
              <DisabledProfileForm />
            </div>
          ) : (
            ""
          )}
          <div
            style={{ backgroundColor: colorToRGBA(color?.primaryAccent, 0.1) }}
            className="w-1/2 flex-col h-full flex items-center justify-center"
          >
            {/* <PageLoader /> */}
            <Loader />
            <div>Parsing data...</div>
          </div>
        </div>
      ) : (
        <div
          className="flex w-full overflow-y-scroll"
          style={{ height: "75vh" }}
        >
          <div className="w-1/2">
            <div
              style={{
                backgroundColor: color?.primaryAccent,
                color: color?.btnAccent,
              }}
              className="flex justify-center rounded-md border border-transparent px-5 py-2 text-base font-medium mr-4"
            >
              PARSED RESUME
            </div>
            <div className="overflow-auto" style={{ height: "60vh" }}>
              <div className="flex-col w-5/6 items-start justify-between">
                <TextArea
                  name="summary"
                  value={parsedData?.summary}
                  label={"Bio"}
                  rows={4}
                  placeholder={parsedData?.summary}
                  section="profile"
                  onChange={(e) => {
                    setField("summary", e.target.value);
                  }}
                  onValue={(value) => {
                    setField("summary", value);
                  }}
                />
                <TextInput
                  name="credentials"
                  value={parsedData?.credentials}
                  label={"Credentials"}
                  placeholder={parsedData?.credentials}
                  section="profile"
                  onChange={(e) => setField("credentials", e.target.value)}
                />
                <div className="flex gap-2">
                  <TextInput
                    name="first_name"
                    value={parsedData?.first_name}
                    label={"First name"}
                    placeholder={parsedData?.first_name}
                    section="profile"
                    onChange={(e) => setField("first_name", e.target.value)}
                  />
                  <TextInput
                    name="lastName"
                    value={parsedData?.last_name}
                    label={"Last name"}
                    placeholder={parsedData?.last_name}
                    section="profile"
                    onChange={(e) => setField("last_name", e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {phoneCodeOptions && (
                    <div className="flex w-full">
                      <div className="w-full mt-10">
                        <div className="text-sm font-semibold">Code *</div>
                        <div>
                          <Select
                            options={phoneCodeOptions}
                            getOptionLabel={getCodeLabel}
                            getOptionValue={getCodeValue}
                            value={countryCode}
                            placeholder={countryCode}
                            onChange={(e) => {
                              setCountryCodeError("");
                              setCountryCode(e.value);
                            }}
                            isSearchable={true}
                          />
                        </div>
                        {countryCodeError && (
                          <div className="mt-4">
                            <Alert type={"error"} msg={countryCodeError} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <TextInput
                    name="Phone"
                    value={parsedData?.phone}
                    label={"Phone"}
                    placeholder={parsedData?.phone}
                    section="profile"
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                </div>
                <TextInput
                  name="Email"
                  value={parsedData?.email}
                  label={"Email"}
                  placeholder={parsedData?.email}
                  section="profile"
                  onChange={(e) => setField("email", e.target.value)}
                />
                <TextInput
                  name="Location"
                  value={parsedData?.address?.city}
                  label={"Location"}
                  placeholder={parsedData?.address?.city}
                  section="profile"
                  onChange={(e) => setField("address", e.target.value)}
                />
                {/* </div> */}
              </div>
              <hr
                style={{ backgroundColor: color?.outerBg }}
                className="mt-10 mb-10 w-100"
              />
              <div className="pr-6 text-lg flex-wrap font-semibold">
                Work Experience
              </div>
              <div className="flex items-start justify-between">
                {/* company card */}
                <div className="w-5/6">
                  {parsedData?.work_history?.map((work: any, key: any) => (
                    <WorkExParsedCard
                      data={work}
                      keyId={key}
                      key={key}
                      deleteWorkCard={deleteWorkCard}
                      updateWorkEx={updateWorkEx}
                      color={color}
                    />
                  ))}
                  {showWorkExForm ? (
                    <div
                      style={{
                        backgroundColor: colorToRGBA(
                          color?.outerBg,
                          color?.opacity
                        ),
                      }}
                      className="px-2 pb-4 pt-2 rounded mt-2"
                    >
                      <div className="flex">
                        <TextInput
                          name="Company"
                          value={workObj.company}
                          label={"Company"}
                          placeholder={workObj.company || "Company name"}
                          section="profile"
                          onChange={(e) => {
                            setError({ key: "company", value: "" });
                            setWorkObj((f: any) => ({
                              ...f,
                              company: e.target.value,
                            }));
                          }}
                          error={error?.key === "company" ? error.value : ""}
                        />
                        <TextInput
                          name="Title"
                          value={workObj.title}
                          label={"Title"}
                          placeholder={workObj.title || "Designation"}
                          section="profile"
                          onChange={(e) => {
                            setError({ key: "title", value: "" });
                            setWorkObj((f: any) => ({
                              ...f,
                              title: e.target.value,
                            }));
                          }}
                          error={error?.key === "title" ? error.value : ""}
                        />
                      </div>
                      <div className="flex">
                        <TextInput
                          name="Start date"
                          value={workObj.from_date}
                          label={"Start date"}
                          type="Date"
                          id="datepicker"
                          placeholder={workObj.from_date || "YYYY-MM-DD"}
                          section="profile"
                          onChange={(e) => {
                            setError({ key: "from_date", value: "" });
                            setWorkObj((f: any) => ({
                              ...f,
                              from_date: e.target.value,
                            }));
                          }}
                          error={error?.key === "from_date" ? error.value : ""}
                        />
                        <TextInput
                          name="End date"
                          value={workObj.to_date}
                          label={"End date"}
                          type="Date"
                          id="datepicker"
                          placeholder={workObj.to_date || "YYYY-MM-DD"}
                          section="profile"
                          onChange={(e) => {
                            setError({ key: "to_date", value: "" });
                            setWorkObj((f: any) => ({
                              ...f,
                              to_date: e.target.value,
                            }));
                          }}
                          error={error?.key === "to_date" ? error.value : ""}
                        />
                      </div>
                      <label className="text-xs font-light mt-3 ml-2 flex">
                        <input
                          type="checkbox"
                          className="mr-1"
                          onChange={takeCurrentDate}
                        />
                        I currently work here
                      </label>
                      <TextArea
                        name="Description"
                        value={workObj?.description}
                        label={"Description"}
                        rows={4}
                        placeholder={workObj?.description}
                        section="profile"
                        onChange={(e) =>
                          setWorkObj((f: any) => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                        onValue={(value) =>
                          setWorkObj((f: any) => ({ ...f, description: value }))
                        }
                        // error={error?.key === "title" ? error.value : ""}
                      />
                      <div className="flex justify-end mt-2">
                        <div>
                          <button
                            style={{ color: color?.primaryAccent }}
                            onClick={() => {
                              createWorkHistory();
                            }}
                            className="mr-6 text-sm"
                          >
                            Add
                          </button>
                        </div>
                        <div>
                          <button
                            style={{ color: color?.primaryAccent }}
                            onClick={() => {
                              setShowWorkExForm(false);
                              resetWorkHistory();
                            }}
                            className="text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        style={{ color: color?.primaryAccent }}
                        onClick={() => {
                          setShowWorkExForm(true);
                          setError({ key: "from_date", value: "" });
                          setError({ key: "to_date", value: "" });
                          setField("to_date", "");
                          setField("from_date", "");
                        }}
                        className="text-sm py-3"
                      >
                        + Add work experience
                      </button>
                    </>
                  )}
                </div>
              </div>
              <hr
                style={{ backgroundColor: color?.outerBg }}
                className="mt-10 w-100"
              />
              <div className="mt-4 text-lg font-semibold">Skills</div>
              <div className="flex items-start justify-between">
                <div className="w-5/6">
                  <TextInput
                    type="string"
                    name="skill"
                    placeholder={"Press enter after each skill"}
                    label={"Job Skills"}
                    section="profile"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    onKeyDown={addSKill}
                  />
                  {parsedData &&
                    _.size(parsedData.skills) > 0 &&
                    parsedData?.skills?.map((skills: any, key: any) => (
                      <div
                        key={skills.candidate_skill_id}
                        className="mt-1 inline-flex items-center hustify-center rounded-full py-1 px-1"
                      >
                        <button
                          type="button"
                          style={{
                            backgroundColor: colorToRGBA(
                              color?.primaryAccent,
                              0.1
                            ),
                            color: color?.primaryAccent,
                          }}
                          className="flex items-center justify-center h-8 rounded-2xl px-3"
                          onClick={() => removeSkill(skills.candidate_skill_id)}
                        >
                          <div className="text-xs font-light">
                            {skills.skill} x
                          </div>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
              <hr
                style={{ backgroundColor: color?.outerBg }}
                className="mt-10 w-100"
              />
              <div className="text-lg flex-wrap font-semibold">
                Education Experience
              </div>
              <div className="flex mt-4 items-start justify-between w-full">
                {/* company card */}
                <div className="w-5/6">
                  {parsedData &&
                    _.size(parsedData.education_history) > 0 &&
                    parsedData?.education_history?.map(
                      (edu: any) =>
                        !edu?.is_deleted && (
                          <EduExParsedCard
                            data={edu}
                            key={edu.id}
                            deleteEduCard={deleteEduCard}
                            updateEduEx={updateEduEx}
                            color={color}
                          />
                        )
                    )}

                  {showEducationExForm ? (
                    <div
                      style={{
                        backgroundColor: colorToRGBA(
                          color?.outerBg,
                          color?.opacity
                        ),
                      }}
                      className="px-2 pb-4 pt-2 rounded mt-2"
                    >
                      <div className="flex">
                        <TextInput
                          name="University/College name"
                          label={"University/College name"}
                          value={eduObj.name}
                          placeholder={eduObj.name}
                          section="profile"
                          onChange={(e) => {
                            setError({ key: "name", value: "" });
                            setEduObj((f: any) => ({
                              ...f,
                              name: e.target.value,
                            }));
                          }}
                          error={error?.key === "name" ? error.value : ""}
                        />
                        <TextInput
                          name="Degree"
                          value={eduObj.degree}
                          label={"Degree"}
                          placeholder={eduObj.degree}
                          section="profile"
                          onChange={(e) => {
                            setError({ key: "degree", value: "" });
                            setEduObj((f: any) => ({
                              ...f,
                              degree: e.target.value,
                            }));
                          }}
                          error={error?.key === "degree" ? error.value : ""}
                        />
                      </div>
                      <div className="flex">
                        <TextInput
                          name="Start date"
                          value={eduObj.edu_from_date}
                          type="Date"
                          id="datepicker"
                          label={"Start date"}
                          placeholder={eduObj.edu_from_date || "YYYY-MM-DD"}
                          section="profile"
                          onChange={(e) => {
                            setError({ key: "edu_from_date", value: "" });
                            setEduObj((f: any) => ({
                              ...f,
                              edu_from_date: e.target.value,
                            }));
                          }}
                          error={
                            error?.key === "edu_from_date" ? error.value : ""
                          }
                        />
                        <TextInput
                          name="End date"
                          value={eduObj.edu_to_date}
                          label={"End date"}
                          type="Date"
                          id="datepicker"
                          placeholder={eduObj.edu_to_date || "YYYY-MM-DD"}
                          section="profile"
                          onChange={(e) => {
                            setError({ key: "edu_to_date", value: "" });
                            setEduObj((f: any) => ({
                              ...f,
                              edu_to_date: e.target.value,
                            }));
                          }}
                          error={
                            error?.key === "edu_to_date" ? error.value : ""
                          }
                        />
                      </div>
                      <div className="flex justify-end mt-2">
                        <div>
                          <button
                            style={{ color: color?.primaryAccent }}
                            onClick={() => {
                              createEduHistory();
                            }}
                            className="mr-6 text-sm"
                          >
                            Add
                          </button>
                        </div>
                        <div>
                          <button
                            style={{ color: color?.primaryAccent }}
                            onClick={() => {
                              setShowEducationExForm(false);
                              resetEduHistory();
                            }}
                            className="text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      style={{ color: color?.primaryAccent }}
                      onClick={() => {
                        setShowEducationExForm(true);
                        setError({ key: "edu_from_date", value: "" });
                        setError({ key: "edu_to_date", value: "" });
                        setField("edu_to_date", "");
                        setField("edu_from_date", "");
                      }}
                      className="text-sm py-3"
                    >
                      + Add education experience
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <div className="ml-4">
                <button
                  className="flex justify-center items-center rounded-md border border-transparent px-5 py-2.5 text-base font-medium shadow-sm focus:outline-none mt-4"
                  onClick={() => {
                    closeModal();
                  }}
                >
                  Close
                </button>
              </div>
              <div className="ml-4">
                <button
                  className="flex justify-center items-center rounded-md border border-transparent px-5 py-2.5 text-base font-medium shadow-sm focus:outline-none mt-4"
                  onClick={() => {
                    if (validateData()) {
                      updateCandidateProfile(parsedData);
                      closeModal();
                    }
                  }}
                  disabled={loadingParsedData ? true : false}
                >
                  {loading ? "Please wait..." : "Save"}
                </button>
              </div>
              <div className="ml-4">
                <button
                  className="flex justify-center items-center rounded-md border border-transparent px-5 py-2.5 text-base font-medium shadow-sm focus:outline-none mt-4"
                  onClick={() => {
                    if (validateData()) {
                      updateCandidateProfile(parsedData);
                      uploadFiles("resume", resumeFile);
                      closeModal();
                    }
                  }}
                  disabled={loadingParsedData ? true : false}
                >
                  {loading ? "Please wait..." : "Save and Upload"}
                </button>
              </div>
            </div>
          </div>
          <PdfPreview pdfUrl={previewData} />
        </div>
      )}
    </div>
  );
}
