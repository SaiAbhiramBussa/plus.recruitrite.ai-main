import axios from "axios";
import _ from "lodash";
import React, { useContext, useEffect, useState } from "react";
import TextInput from "./TextInput";
import WorkExCard from "./WorkExCard";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "./BreadCrumbs";
import PageLoader from "./PageLoader";
import EduExCard from "./EduExCard";
import TextArea from "./TextArea";
import AppContext from "../context/Context";
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

export default function DisabledProfileForm() {
  // initial api call to fetch candidate details
  useEffect(() => {
    getCandidateDetails();
  }, []);

  const resumeElement: any = React.useRef();
  const uploadButton: any = React.useRef();
  const imageElement: any = React.useRef();

  const [userId, setUserId] = useState();
  const [candidateId, setCandidateId] = useState();
  const [loading, setLoading] = useState<boolean>(false);
  const [resumeLoading, setResumeLoading] = useState<boolean>(false);

  // storing fetched candidate data
  const [candidateData, setCandidateData] = useState<CandidateDataInterface>();
  const [openParsingModal, setOpenParsingModal] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<any>();
  const [autofillChecked, setAutofillChecked] = useState<boolean>(false);
  const [enableAutoFill, setEnableAutoFill] = useState<boolean>(false);
  const [error, setError] = useState<{
    key: keyof typeof form | "";
    value: any;
  }>({ key: "" as any, value: "" });
  const [showWorkExForm, setShowWorkExForm] = useState<boolean>(false);
  const [showEducationExForm, setShowEducationExForm] =
    useState<boolean>(false);
  const [showWorkExCard, setShowWorkExCard] = useState<boolean>(false);
  const [showCurrentDate, setShowCurrentDate] = useState<boolean>(false);
  const [resumeFile, setResumeFile] = useState<Blob | any>();
  const [resumeUrl, setResumeUrl] = useState();
  const [previewData, setPreviewdata] = useState<any>();
  const [workObj, setWorkObj] = useState({
    title: "",
    description: "",
    from_date: "",
    company: "",
    to_date: "",
  });
  const [eduObj, setEduObj] = useState({
    name: "",
    to_date: "",
    degree: "",
    edu_from_date: "",
    edu_to_date: "",
  });
  const [form, setForm] = React.useState({
    first_name: candidateData?.first_name,
    last_name: candidateData?.last_name || "",
    phone: candidateData?.phone || "",
    jobExperience: [{}],
    yearsOfExperience: 0,
    salaryRange: "",
    credentials: "",
    aboutMe: "",
    videoLink: "",
    summary: candidateData?.summary || "",
    address: candidateData?.address?.city || "",
    title: "",
    description: "",
    from_date: "",
    company: "",
    to_date: "",
    edu_from_date: "",
    edu_to_date: "",
    skills: candidateData?.skills || [],
    skillsList: candidateData?.skills || "",
    work_history: candidateData?.work_history || "",
    education_history: candidateData?.education_history || "",
    degree: "",
    name: "",
    email: "",
    skill: "",
    resumes: candidateData?.resumes || [],
    picture: candidateData?.picture || "",
  });
  const [profileImage, setProfileImage] = useState<string>(
    "/Images/seeker-icon.svg"
  );
  const [resume, setResume] = useState("");
  const [formData, setFormData] = useState<FormData>();
  const { color } = useContext(AppContext);

  useEffect(() => {
    parsedData && parsedData?.email ? setOpenParsingModal(true) : null;
  }, [parsedData]);

  useEffect(() => {
    let user: any = localStorage.getItem("user");
    user = user ? JSON.parse(user) : user;
    setUserId(user.id);
  }, []);

  // useEffect(() => {
  //   if (resume == "") {
  //     uploadButton.current.style.display = "none";
  //   } else {
  //     uploadButton.current.style.display = "block";
  //   }
  // }, [resume]);

  useEffect(() => {
    if (resumeFile) setPreviewdata(URL.createObjectURL(resumeFile));
  }, [resumeFile]);

  const getResume = () => {
    resumeElement?.current?.click();
    setEnableAutoFill(true);
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    let searchPatterns = ["pdf", "doc", "docx", "video"];
    const allowedExtensions = new RegExp("(" + searchPatterns.join("|") + ")");
    if (allowedExtensions.exec(e.dataTransfer?.files[0]?.type)) {
      setResume(e.dataTransfer.files[0].name);
      setInForm("resume", e.dataTransfer.files[0]);
    } else {
      toast.warn("You can only drop doc pdf or Video", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const getCandidateDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/candidate-profile`,
        {
          withCredentials: true,
        }
      );
      if (res.status === 200) {
        setCandidateData(res.data);
        setCandidateId(res?.data?.candidate_id);
        setProfileImage(
          res.data?.picture
            ? res.data?.picture + "?=" + new Date()
            : "/Images/seeker-icon.svg"
        );
      }
      return res;
    } catch (err) {
      toast.error("Something went wrong fetching details!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getImage = () => {
    imageElement?.current?.click();
  };

  const setInForm = (tag: string, file: File) => {
    if (file) {
      if (file.type.includes("video") && file.size > 1048576 * 15) {
        toast.warn("File size should be less than 15 mb", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        setResume("");
        return;
      } else if (!file.type.includes("video") && file.size > 1048576 * 2) {
        toast.warn("File size should be less than 1mb", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        if (tag == "profile_picture") {
          setProfileImage("/Images/seeker-icon.svg");
        } else {
          setResume("");
        }
        return;
      }
      let form = new FormData();
      if (formData) {
        form = formData;
      }
      form.set(tag, file);
      setFormData(form);
      if (tag == "resume") {
        return;
      }
      uploadFiles(tag, file);
    }
  };

  const uploadFiles = async (key: string, file: any = "") => {
    let item: any = formData?.get(key);
    if (item || file) {
      let sendFormData = new FormData();
      sendFormData.set(key, item || file);
      try {
        setResumeLoading(true);
        await axios
          .post(
            `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/${candidateId}/uploads`,
            sendFormData,
            {
              withCredentials: true,
            }
          )
          .then((response: any) => {
            setResumeUrl(response?.data?.resume_url);
            if (key == "profile_picture") {
              let user: any = localStorage.getItem("user");
              user = user ? JSON.parse(user) : user;
              _.set(
                user,
                "profile_picture",
                response.data.profile_picture + "?=" + new Date()
              );
              localStorage.setItem("user", JSON.stringify(user));
              window.dispatchEvent(new Event("storage"));
            }
            if (response.data.resume_url) {
              let data: any = candidateData;
              if (response.data.resume_type == "doc") {
                let i = _.findIndex(data.resumes, (resume: any) => {
                  return resume.resume_type == "doc";
                });
                i < 0 ? (i = data.resumes.length) : "";
                _.set(data, `resumes[${i}]`, response.data);
              } else {
                let i = _.findIndex(data.resumes, (resume: any) => {
                  return resume.resume_type == "video";
                });
                i < 0 ? (i = data.resumes.length) : "";
                _.set(data, `resumes[${i}]`, response.data);
              }
              setCandidateData(data);
              setEnableAutoFill(true);
            }
            toast.success("File Uploaded", {
              position: toast.POSITION.TOP_RIGHT,
              autoClose: 2000,
              hideProgressBar: true,
            });
          });
      } catch (error) {
        toast.warn(
          "Something went wrong please try again, check image size it should be less then 1MB if it is a video it should be less than 15MB",
          {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          }
        );
        if (key == "profile_picture")
          setProfileImage("/Images/seeker-icon.svg");
      } finally {
        closeModal();
        formData?.delete(key);
        if (key == "resume") {
          setResume("");
        }
        setResumeLoading(false);
      }
    }
  };

  const setField = React.useCallback(
    (name: keyof typeof form, value: any) => {
      setCandidateData((f: any) =>
        name !== "address"
          ? { ...f, [name]: value }
          : { ...f, address: { ...f.address, city: value } }
      );
    },
    [setForm, setCandidateData]
  );

  const updateCandidateProfile = async (data: any) => {
    try {
      let mergedObj;
      if (parsedData) {
        const skillsArrayWithId = data?.skills.map((skill: any) => {
          return { ...skill, candidate_skill_id: null };
        });
        const eduExArrayWithId = data?.education_history.map((edu: any) => {
          return { ...edu, id: null };
        });
        const workExArrayWithId = data?.work_history.map((work: any) => {
          return { ...work, id: null };
        });

        data.skills = skillsArrayWithId;
        data.education_history = eduExArrayWithId;
        data.work_history = workExArrayWithId;
        mergedObj = mergeObjects(candidateData, data);
      }

      setLoading(true);
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/candidate-profile`,
        parsedData ? mergedObj : candidateData,
        {
          withCredentials: true,
        }
      );

      toast.success("Profile updated successfully! ", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
      return res;
    } catch (err) {
      toast.error("Something went wrong updating profile!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const mergeObjects = (obj1: any, obj2: any) => {
    const mergedObject = {
      ...obj1,
      ...obj2,
      skills: [...obj1.skills, ...obj2.skills],
      address: {
        ...obj1.address,
        ...obj2.address,
      },
    };
    mergedObject.work_history = obj1.work_history.concat(obj2.work_history);
    mergedObject.education_history = obj1.education_history.concat(
      obj2.education_history
    );
    return mergedObject;
  };

  const addSKill = (e: any) => {
    setField("skillsList", e.target.value);

    if (e.key === "Enter") {
      const obj = {
        candidate_skill_id: null,
        skill: form.skills,
      };
      setCandidateData((prevState: any) => ({
        ...prevState,
        skills: [...prevState.skills, obj],
      }));
      setForm((f: any) => ({ ...f, skills: " " }));
    }
  };

  // work_history methods

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

    setShowWorkExCard(true);
    setShowWorkExForm(false);

    const obj = {
      id: null,
      company: workObj.company,
      title: workObj.title,
      from_date: workObj.from_date,
      to_date: workObj.to_date,
      description: workObj.description,
    };

    setCandidateData((prevState: any) => ({
      ...prevState,
      work_history: [...prevState.work_history, obj],
    }));

    resetWorkHistory();
  };

  const resetWorkHistory = () => {
    setWorkObj((f: any) => ({ ...f, company: "" }));
    setWorkObj((f: any) => ({ ...f, title: "" }));
    setWorkObj((f: any) => ({ ...f, from_date: "" }));
    setWorkObj((f: any) => ({ ...f, to_date: "" }));
    setWorkObj((f: any) => ({ ...f, description: "" }));
  };

  const updateWorkEx = (id: any, obj: any) => {
    const objectToUpdate: any = _.get(candidateData, "work_history", [])?.find(
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

  // edu_history related methods
  const resetEduHistory = () => {
    setForm((f: any) => ({ ...f, degree: "" }));
    setForm((f: any) => ({ ...f, name: "" }));
    setForm((f: any) => ({ ...f, edu_from_date: "" }));
    setForm((f: any) => ({ ...f, edu_to_date: "" }));
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

    setCandidateData((prevState: any) => ({
      ...prevState,
      education_history: [...prevState.education_history, obj],
    }));

    resetEduHistory();
  };

  const deleteEduCard = (objectId: any, newKey: any, newValue: boolean) => {
    setCandidateData((prevState: any) => ({
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

  const updateEduEx = (id: any, obj: any) => {
    const objectToUpdate: any = _.get(
      candidateData,
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

  const deleteWorkCard = (objectId: any, newKey: any, newValue: boolean) => {
    setCandidateData((prevState: any) => ({
      ...prevState,
      work_history: prevState.work_history.map((obj: any) => {
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

  const closeModal = () => {
    setOpenParsingModal(false);
    getCandidateDetails();
  };

  const saveParsedDataHandler = async (updatedParsedData: any) => {
    updatedParsedData.candidate_id = candidateId;
    const skillsArrayWithId = updatedParsedData?.skillsList.map(
      (skill: any) => {
        return { ...skill, candidate_skill_id: null };
      }
    );

    const workExArrayWithId = updatedParsedData?.work_history.map(
      (work: any) => {
        return { ...work, id: null, title: work?.title };
      }
    );

    const eduExArrayWithId = updatedParsedData.education_history.map(
      (edu: any) => {
        return { ...edu, id: null, name: edu.name };
      }
    );

    updatedParsedData.skills = skillsArrayWithId;
    updatedParsedData.work_history = workExArrayWithId;
    updatedParsedData.education_history = eduExArrayWithId;
    setCandidateData(updatedParsedData);
    try {
      setLoading(true);
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/candidate-profile`,
        updatedParsedData,
        {
          withCredentials: true,
        }
      );
      return res;
    } catch (err) {
      toast.error("Something went wrong updating profile!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
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

  const removeSkill = (id: any) => {
    const arr = candidateData?.skills.filter(
      (skill: any) => skill.candidate_skill_id !== id
    );
    setField("skills", arr);
  };

  const autofillFields = async () => {
    try {
      setLoading(true);
      const formData1 = new FormData();
      formData1.append("resume", resumeFile || "");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/parse-resume`,
        formData1,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.status === 200) {
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
    getCandidateDetails();
  };

  return (
    <div
      style={{ backgroundColor: color?.innerBg, color: color?.secondaryAccent }}
      className="p-2 md:p-4"
    >
      {loading && <PageLoader />}
      <div className="relative flex-col justify-between">
        <div className="left-20 top-3 text-lg font-bold flex items-center">
          <Breadcrumbs title="" role="job-seeker" backPage={""} /> Dashboard
        </div>
        <div className="py-10 mx-auto">
          <div className=" w-full items-start justify-between mt-7">
            <div className="mt-4 text-lg font-semibold">
              About
              <br />
            </div>
            <div className="">
              <TextArea
                name="summary"
                disabled
                value={candidateData?.summary}
                label={"Bio"}
                rows={4}
                placeholder={candidateData?.summary}
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
                value={candidateData?.credentials}
                label={"Credentials"}
                placeholder={candidateData?.credentials}
                section="profile"
                onChange={(e) => setField("credentials", e.target.value)}
              />
              <div className="flex gap-2">
                <TextInput
                  disabled
                  name="first_name"
                  value={candidateData?.first_name}
                  label={"First name"}
                  placeholder={candidateData?.first_name}
                  section="profile"
                  onChange={(e) => setField("first_name", e.target.value)}
                />
                <TextInput
                  disabled
                  name="lastName"
                  value={candidateData?.last_name}
                  label={"Last name"}
                  placeholder={candidateData?.last_name}
                  section="profile"
                  onChange={(e) => setField("last_name", e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <TextInput
                  disabled
                  name="Phone"
                  value={candidateData?.phone}
                  label={"Phone"}
                  placeholder={candidateData?.phone}
                  section="profile"
                  onChange={(e) => setField("phone", e.target.value)}
                />
                <TextInput
                  disabled
                  name="Location"
                  value={candidateData?.address.city}
                  label={"Location"}
                  placeholder={candidateData?.address.city}
                  section="profile"
                  onChange={(e) => setField("address", e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <TextInput
                  disabled
                  name="Email"
                  value={candidateData?.email}
                  label={"Email"}
                  placeholder={candidateData?.email}
                  section="profile"
                  onChange={(e) => setField("email", e.target.value)}
                />
                <TextInput
                  disabled
                  name="Email"
                  value={candidateData?.email}
                  label={"Business Email"}
                  placeholder={candidateData?.email}
                  section="profile"
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>
            </div>
          </div>
          <hr
            style={{ backgroundColor: color?.outerBg }}
            className="mt-10 mb-10 w-100"
          />
          <div className="items-start justify-between">
            <div className="pr-6 text-lg w-full flex-wrap font-semibold">
              Work Experience
            </div>
            <br />
            {/* company card */}
            <div className="w-full">
              {candidateData &&
                _.size(candidateData.work_history) > 0 &&
                candidateData?.work_history?.map(
                  (work: any) =>
                    !work?.is_deleted && (
                      <WorkExCard
                        data={work}
                        key={work.id}
                        deleteWorkCard={deleteWorkCard}
                        updateWorkEx={updateWorkEx}
                      />
                    )
                )}
            </div>
          </div>
          <hr
            style={{ backgroundColor: color?.outerBg }}
            className="mt-10 w-100"
          />

          <div className="items-start justify-between">
            <div className="mt-4 w-2/6 text-lg font-semibold">Skills</div>
            <div className="w-full">
              <TextInput
                disabled
                type="string"
                name="skillsList"
                placeholder={
                  form.skills.toString() || "Press enter after each skill"
                }
                label={"Job Skills"}
                section="profile"
                value={form.skills}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, skills: e.target.value }))
                }
                onKeyDown={addSKill}
              />
              {candidateData &&
                _.size(candidateData.skills) > 0 &&
                candidateData?.skills?.map((skills: any) => (
                  // <EduExCard data={ski} key={work.id} />
                  <div
                    key={skills.candidate_skill_id}
                    className="mt-1 inline-flex items-center hustify-center rounded-full py-1 px-1"
                  >
                    <ButtonWrapper
                      classNames="flex items-center justify-center h-8 rounded-2xl px-3 "
                      onClick={() => removeSkill(skills.candidate_skill_id)}
                    >
                      <div className="text-xs font-light">{skills.skill} x</div>
                    </ButtonWrapper>
                  </div>
                ))}
            </div>

            {/* {(_.size(candidateData.education_history) > 0) && <SkillTab skills={candidateData?.skills} />} */}
            {/* { <SkillTab portal='job' skills={companyData.skills} />} */}
            {}
          </div>
          <hr
            style={{ backgroundColor: color?.outerBg }}
            className="mt-10 w-100"
          />
          <div className="mt-4 items-start justify-between w-full">
            <div className="text-lg w-fullflex-wrap font-semibold">
              Education Experience
            </div>
            <br />
            {/* company card */}
            <div className="w-full">
              {candidateData &&
                _.size(candidateData.education_history) > 0 &&
                candidateData?.education_history?.map(
                  (edu: any) =>
                    !edu?.is_deleted && (
                      <EduExCard
                        data={edu}
                        key={edu.id}
                        deleteEduCard={deleteEduCard}
                        updateEduEx={updateEduEx}
                        color={color}
                      />
                    )
                )}
            </div>
          </div>
          <hr
            style={{ backgroundColor: color?.outerBg }}
            className="mt-10 mb-10 w-100"
          />
          <div className="flex items-start">
            {/* company card */}
            {/* <div>
              <button>+ Add skills</button>
            </div> */}
          </div>
          <br />
          <br />
        </div>
      </div>
    </div>
  );
}
