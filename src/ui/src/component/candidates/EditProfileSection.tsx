import axios from "axios";
import _ from "lodash";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import EduExCard from "../EduExCard";
import TextArea from "../TextArea";
import TextInput from "../TextInput";
import WorkExCard from "../WorkExCard";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faPlayCircle } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../BreadCrumbs";
import Loader from "../Loader";
import Modal from "../Modal";
import ParsedDataPage from "../ParsedDataPage";
import PageLoader from "../PageLoader";
import momment from "moment";
import TextEditor from "../TextEditor";
import { Country } from "country-state-city";
import Select from "react-select";
import Alert from "../Alerts";
import { colorToRGBA } from "@/src/utils/misc";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

interface CandidateDataInterface {
  work_history?: [];
  education_history?: [];
  skills: [];
  email?: any;
  business_email?: any;
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
  candidate_id?: any;
  linked_in?: any;
  phone_code?: any;
}

export default function EditProfileSection(props: any) {
  const getCodeLabel = (option: any) => option.value;
  const getCodeValue = (option: any) => option.value;

  // initial api call to fetch candidate details
  useEffect(() => {
    if (!props?.modal) {
      getCandidateDetails();
    } else {
      if (!props?.detail.phone_code) {
        _.set(props, "detail.phone_code", "+1");
      }
      setCandidateData(props?.detail);
    }
  }, []);

  const { modal, updateCandidateProfileCard, color } = props;
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
  const [parsed, setParsed] = useState<any>(false);
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
    creadentials: candidateData?.credentials || "",
    linked_in: candidateData?.linked_in || "",
    profile: candidateData?.linked_in || "",
    phone: candidateData?.phone || "",
    phone_code: candidateData?.phone_code || "",
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
    business_email: "",
    skill: "",
    resumes: candidateData?.resumes || [],
    picture: candidateData?.picture || "",
  });
  const [profileImage, setProfileImage] = useState<string>(
    "/Images/seeker-icon.svg"
  );
  const [resume, setResume] = useState("");
  const [formData, setFormData] = useState<FormData>();
  const [parsing, setParsing] = useState<boolean>(false);

  useEffect(() => {
    let user: any = localStorage.getItem("user");
    user = user ? JSON.parse(user) : user;
    setUserId(user.id);
  }, []);

  useEffect(() => {
    if (resume == "") {
      uploadButton.current.style.display = "none";
    } else {
      uploadButton.current.style.display = "block";
    }
  }, [resume]);

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
            `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/${candidateData?.candidate_id}/uploads`,
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
          : { ...f, address: { ...f.address, city: value, address: value } }
      );
    },
    [setForm, setCandidateData]
  );

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

  const updateCandidateProfile = async (data: any) => {
    try {
      let mergedObj;
      data.profile = data?.linked_in;
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
      let res: any = "";
      if (!modal) {
        await axios
          .patch(
            `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/candidate-profile`,
            parsedData ? mergedObj : candidateData,
            {
              withCredentials: true,
            }
          )
          .then((resp) => (res = resp));
      } else {
        let CandidateData = candidateData;
        if (
          CandidateData &&
          (_.isEmpty(CandidateData?.phone?.trim()) ||
            _.isNull(CandidateData.phone))
        ) {
          _.set(CandidateData, "phone_code", null);
        }
        await axios
          .put(
            `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/${CandidateData?.candidate_id}`,
            parsedData ? mergedObj : CandidateData,
            {
              withCredentials: true,
            }
          )
          .then((resp) => (res = resp));
      }
      if (res.status === 200) {
        const staged = res?.data?.staged;
        data.staged = staged;
        toast.success("Profile updated successfully! ", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        props.openEditCandidateModal(false);
        if (updateCandidateProfileCard) updateCandidateProfileCard(data);
        return res;
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.Error
          ? err?.response?.data?.Error
          : "Something went wrong updating profile!",
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

  function validateEmail(email: string) {
    let retVal = true;
    if (email) {
      let emailArray = email.split(",");
      var reg =
        /^[A-Za-z0-9_\-\.]+(\+[A-Za-z0-9_\-\.]+)?@[A-Za-z0-9_\-\.]+\.[A-Za-z]{2,4}$/;
      emailArray.map((email) =>
        reg.test(email) ? (retVal = true) : (retVal = false)
      );
    }
    return retVal;
  }

  function isValidURL(url: any) {
    const regex = /^(ftp|http|https):\/\/[^ "]+$/;
    return regex.test(url);
  }

  const validatePersonalDetails = () => {
    if (!validateEmail(candidateData?.email)) {
      setError({ key: "email", value: "Invalid Email" });
      return false;
    }
    if (!validateEmail(candidateData?.business_email)) {
      setError({ key: "business_email", value: "Invalid Email" });
      return false;
    }
    if (_.isEmpty(candidateData?.first_name)) {
      setError({ key: "first_name", value: "First Name can not be empty" });
      return false;
    }
    if (_.size(candidateData?.first_name) < 2) {
      setError({
        key: "first_name",
        value: "First Name length should be more than 2",
      });
      return false;
    }
    if (_.isEmpty(candidateData?.last_name)) {
      setError({ key: "last_name", value: "Last Name can not be empty" });
      return false;
    }
    if (_.size(candidateData?.last_name) < 2) {
      setError({
        key: "last_name",
        value: "Last Name length should be more than 2",
      });
      return false;
    }
    if (
      _.size(candidateData?.phone) != 10 &&
      !_.isEmpty(candidateData?.phone?.trim())
    ) {
      setError({ key: "phone", value: "Phone length should be 10" });
      return false;
    }
    if (_.size(candidateData?.phone) && _.isEmpty(candidateData?.phone_code)) {
      setError({ key: "phone_code", value: "Phone code cannot be empty" });
      return false;
    }
    if (_.size(candidateData?.phone_code) > 4) {
      setError({ key: "phone_code", value: "Incorrect phone code" });
      return false;
    }
    setError({ key: "", value: "" });
    return true;
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

  const validateWorkHistory = (
    workObj: any
  ): { key: keyof typeof form | ""; value: string } => {
    if (!workObj.company)
      return {
        key: "company",
        value: "This field cannot be empty",
      };

    if (!workObj.title)
      return {
        key: "title",
        value: "This field cannot be empty",
      };
    if (workObj.from_date && !/^\d{4}-\d{2}-\d{2}$/.test(workObj.from_date))
      return {
        key: "from_date",
        value: "Incorrect format. Please write it as YYYY-MM-DD.",
      };

    if (!workObj.from_date)
      return {
        key: "from_date",
        value: "This field cannot be empty",
      };

    if (workObj.to_date && !/^\d{4}-\d{2}-\d{2}$/.test(workObj.to_date))
      return {
        key: "to_date",
        value: "Incorrect format. Please write it as YYYY-MM-DD.",
      };

    if (!workObj.to_date)
      return {
        key: "to_date",
        value: "This field cannot be empty",
      };

    if (workObj.from_date > workObj.to_date)
      return {
        key: "to_date",
        value: "End date must be after Start date",
      };

    return { key: "", value: "" };
  };

  const createWorkHistory = () => {
    if (validateWorkHistory(workObj)?.key != "") {
      setError(validateWorkHistory(workObj));
      return;
    }

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
    setEduObj({
      name: "",
      to_date: "",
      degree: "",
      edu_from_date: "",
      edu_to_date: "",
    });
  };

  const validateEduHistory = (
    eduObj: any
  ): { key: keyof typeof form | ""; value: string } => {
    if (!eduObj.name)
      return {
        key: "name",
        value: "This field cannot be empty",
      };

    if (!eduObj.degree)
      return {
        key: "degree",
        value: "This field cannot be empty",
      };

    if (
      eduObj.edu_from_date &&
      !/^\d{4}-\d{2}-\d{2}$/.test(eduObj.edu_from_date)
    )
      return {
        key: "edu_from_date",
        value: "Incorrect format. Please write it as YYYY-MM-DD.",
      };

    if (!eduObj.edu_from_date)
      return {
        key: "edu_from_date",
        value: "This field cannot be empty",
      };

    if (eduObj.edu_to_date && !/^\d{4}-\d{2}-\d{2}$/.test(eduObj.edu_to_date))
      return {
        key: "edu_to_date",
        value: "Incorrect format. Please write it as YYYY-MM-DD.",
      };

    if (!eduObj.edu_to_date)
      return {
        key: "edu_to_date",
        value: "This field cannot be empty",
      };

    if (eduObj.edu_from_date > eduObj.edu_to_date)
      return {
        key: "edu_to_date",
        value: "End date must be after Start date",
      };

    return { key: "", value: "" };
  };

  const createEduHistory = () => {
    if (validateEduHistory(eduObj).key != "") {
      setError(validateEduHistory(eduObj));
      return;
    }

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
      work_history: prevState.work_history.filter(
        (obj: any) => obj.id !== objectId
      ),
    }));
  };

  const closeModal = () => {
    setOpenParsingModal(false);
    if (!props?.modal) {
      getCandidateDetails();
    }
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
      setParsing(true);
      setOpenParsingModal(true);
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
        setParsing(false);
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
    <div style={{ backgroundColor: color?.innerBg }} className="p-2 md:p-4">
      {loading && !modal && <PageLoader />}
      <div className="relative flex-col justify-between">
        {!modal && (
          <div
            style={{ color: color?.secondaryAccent }}
            className="left-20 top-3 text-lg font-bold flex items-center"
          >
            <Breadcrumbs title="" role="job-seeker" backPage={""} /> Dashboard
          </div>
        )}
        <div
          className={`mx-auto ${
            modal
              ? `overflow-auto ${modal ? "px-2" : "md:px-10"} h-[58vh]`
              : "lg:px-60 py-10 md:px-24"
          }`}
        >
          <div className="flex w-full items-start justify-between mt-2">
            <div className="mt-4  w-2/6 text-lg font-semibold">
              About
              <div
                style={{
                  color: colorToRGBA(color?.secondaryAccent, color?.opacity),
                }}
                className="font-light text-sm mt-1"
              >
                We would like to know you. Give us some information about
                yourself.
              </div>
              <br />
              <div className="flex">
                <button>
                  <div className="relative">
                    <div className="top-0">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={imageElement}
                        onChange={(e: any) => {
                          if (e?.target?.files[0]) {
                            setProfileImage(
                              URL.createObjectURL(e?.target?.files[0])
                            );
                            setInForm("profile_picture", e?.target?.files[0]);
                          }
                        }}
                      />
                      <div className="m-auto z-0 rounded-md w-full relative transition">
                        {candidateData?.picture ? (
                          <Image
                            width={100}
                            height={100}
                            src={candidateData?.picture}
                            alt=""
                            className="h-40 w-40 rounded-md border-slate-200 hover:opacity-80"
                            onClick={getImage}
                          />
                        ) : (
                          <Image
                            width={100}
                            height={100}
                            src={profileImage}
                            alt=""
                            className="h-40 w-40 rounded-md border-slate-200 hover:opacity-80"
                            onClick={getImage}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            <div className={`${modal ? "w-3/6" : "w-4/6"}`}>
              {/* <TextArea
                name="summary"
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
              /> */}
              <TextEditor
                error={error?.key === "summary" ? error.value : ""}
                placeholder={candidateData?.summary}
                label="Bio"
                initialValue={candidateData?.summary}
                onChange={(e: any) => setField("summary", e)}
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
                  name="first_name"
                  value={candidateData?.first_name}
                  label={"First name"}
                  placeholder={candidateData?.first_name}
                  section="profile"
                  onChange={(e) => setField("first_name", e.target.value)}
                  error={error?.key === "first_name" ? error.value : ""}
                />
                <TextInput
                  name="lastName"
                  value={candidateData?.last_name}
                  label={"Last name"}
                  placeholder={candidateData?.last_name}
                  section="profile"
                  onChange={(e) => setField("last_name", e.target.value)}
                  error={error?.key === "last_name" ? error.value : ""}
                />
              </div>
              <div className="flex gap-2">
                {phoneCodeOptions && (
                  <div className="flex w-full">
                    <div className="w-full mt-3">
                      <div className="text-sm font-semibold mb-4">Code *</div>
                      <div>
                        <Select
                          options={phoneCodeOptions}
                          getOptionLabel={getCodeLabel}
                          getOptionValue={getCodeValue}
                          value={candidateData?.phone_code}
                          placeholder={candidateData?.phone_code}
                          onChange={(e: any) => {
                            setError({ key: "phone_code", value: "" });
                            setField("phone_code", e.value);
                          }}
                          isSearchable={true}
                          className="text-sm h-10"
                        />
                      </div>
                      {error.key === "phone_code" && error.value && (
                        <div className="mt-4">
                          <Alert type={"error"} msg={error.value} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <TextInput
                  name="Phone"
                  value={candidateData?.phone}
                  label={"Phone"}
                  placeholder={candidateData?.phone}
                  section="profile"
                  min={0}
                  onChange={(e) => {
                    if (
                      (Number(e.target.value) ||
                        e.target.value == "+" ||
                        e.target.value == "") &&
                      _.size(e.target.value) <= 10
                    )
                      setField("phone", e.target.value);
                  }}
                  onKeyDown={(e: any) =>
                    e.code == "Minus" || e.code == "NumpadSubtract"
                      ? e.preventDefault()
                      : ""
                  }
                  error={error?.key === "phone" ? error.value : ""}
                />
              </div>
              <TextInput
                name="Location"
                value={candidateData?.address.city}
                label={"Location"}
                placeholder={candidateData?.address.city}
                section="profile"
                onChange={(e) => setField("address", e.target.value)}
              />
              <div className="flex gap-2">
                <TextInput
                  name="Email"
                  value={candidateData?.email}
                  label={"Email"}
                  placeholder={candidateData?.email}
                  section="profile"
                  onChange={(e) => setField("email", e.target.value)}
                  error={error?.key === "email" ? error.value : ""}
                />
                <TextInput
                  name="Email"
                  value={candidateData?.business_email}
                  label={"Business Email"}
                  placeholder={candidateData?.business_email}
                  section="profile"
                  onChange={(e) => setField("business_email", e.target.value)}
                  error={error?.key === "business_email" ? error.value : ""}
                />
              </div>
              <TextInput
                name="ProfileLink"
                value={candidateData?.linked_in}
                label={"Profile link"}
                placeholder={candidateData?.linked_in}
                section="profile"
                onChange={(e) => setField("linked_in", e.target.value)}
              />
            </div>
          </div>
          <hr
            style={{ backgroundColor: color?.outerBg }}
            className="mt-10 mb-10 w-100"
          />
          <div className="flex items-start justify-between">
            <div className="pr-6 text-lg w-2/6 flex-wrap font-semibold">
              Work Experience
              <div
                style={{
                  color: colorToRGBA(color?.secondaryAccent, color?.opacity),
                }}
                className="font-light text-sm mt-1"
              >
                Where have you worked till now? What does your professional
                career look like? Give some insights.
              </div>
            </div>
            {/* company card */}
            <div className={`${modal ? "w-3/6" : "w-4/6"}`}>
              {candidateData?.work_history &&
                _.size(candidateData.work_history) > 0 &&
                candidateData?.work_history?.map(
                  (work: any) =>
                    !work?.is_deleted && (
                      <WorkExCard
                        data={work}
                        key={work.id}
                        deleteWorkCard={deleteWorkCard}
                        updateWorkEx={updateWorkEx}
                        validateWorkHistory={validateWorkHistory}
                        color={color}
                      />
                    )
                )}
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
                      setWorkObj((f: any) => ({ ...f, title: e.target.value }));
                    }}
                    error={error?.key === "title" ? error.value : ""}
                  />
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
                      momment(e.target.value).isSameOrAfter(
                        momment(new Date()).format("YYYY-MM-DD")
                      )
                        ? setShowCurrentDate(true)
                        : setShowCurrentDate(false);
                      setWorkObj((f: any) => ({
                        ...f,
                        to_date: e.target.value,
                      }));
                    }}
                    error={error?.key === "to_date" ? error.value : ""}
                  />
                  <label className="text-xs font-light mt-3 ml-2 flex">
                    <input
                      type="checkbox"
                      className="mr-1"
                      checked={showCurrentDate}
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
                  <div
                    style={{ color: color?.primaryAccent }}
                    className="flex justify-end mt-2"
                  >
                    <div>
                      <button
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
                  {/* {showWorkExCard && <WorkExCard />} */}
                  <button
                    style={{ color: color?.primaryAccent }}
                    onClick={() => {
                      setShowWorkExForm(true);
                      setShowCurrentDate(false);
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
          <div className="flex items-start justify-between">
            <div className="mt-4 w-2/6 text-lg font-semibold">
              Skills
              <div
                style={{
                  color: colorToRGBA(color?.secondaryAccent, color?.opacity),
                }}
                className="font-light text-sm mt-1"
              >
                What can you bring to the table? This will help us curate some
                best opportunies for you.
              </div>
            </div>
            <div className={`${modal ? "w-3/6" : "w-4/6"}`}>
              <TextInput
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
                    <button
                      type="button"
                      style={{
                        backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
                        color: color?.primaryAccent,
                      }}
                      className="flex items-center justify-center h-8 rounded-2xl px-3 "
                      onClick={() => removeSkill(skills.candidate_skill_id)}
                    >
                      <div className="text-xs font-light">{skills.skill} x</div>
                    </button>
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
          <div className="flex mt-4 items-start justify-between w-full">
            <div className="text-lg w-2/6 flex-wrap font-semibold">
              Education Experience
              <div
                style={{
                  color: colorToRGBA(color?.secondaryAccent, color?.opacity),
                }}
                className="font-light text-sm mt-1"
              >
                What have you studied? Throw some light on your educational
                experience for us to know you more.
              </div>
            </div>
            {/* company card */}
            <div className={`${modal ? "w-3/6" : "w-4/6"}`}>
              {candidateData &&
                _.size(candidateData.education_history) > 0 &&
                candidateData?.education_history?.map(
                  (edu: any) =>
                    !edu?.is_deleted && (
                      <EduExCard
                        data={edu}
                        key={edu.id}
                        deleteEduCard={deleteEduCard}
                        validateEduHistory={validateEduHistory}
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
                  <TextInput
                    name="University/College name"
                    label={"University/College name"}
                    value={eduObj.name}
                    placeholder={eduObj.name}
                    section="profile"
                    onChange={(e) => {
                      setError({ key: "name", value: "" });
                      setEduObj((f: any) => ({ ...f, name: e.target.value }));
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
                      setEduObj((f: any) => ({ ...f, degree: e.target.value }));
                    }}
                    error={error?.key === "degree" ? error.value : ""}
                  />
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
                    error={error?.key === "edu_from_date" ? error.value : ""}
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
                    error={error?.key === "edu_to_date" ? error.value : ""}
                  />
                  <div
                    style={{ color: color?.primaryAccent }}
                    className="flex justify-end mt-2"
                  >
                    <div>
                      <button
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
          <hr
            style={{ backgroundColor: color?.outerBg }}
            className="mt-10 mb-10 w-100"
          />
          <div className="flex items-center mb-10">
            <div className="w-2/6">
              <div className="mt-4 text-lg font-semibold">
                Resume
                <div
                  style={{
                    color: colorToRGBA(color?.secondaryAccent, color?.opacity),
                  }}
                  className="font-light text-sm mt-1 mr-6"
                >
                  Please upload your updated resume. Once uploaded, we can
                  easily grab all the required information about you while you
                  go and grab some coffee!
                </div>
              </div>
            </div>
            {/* company card */}
            {/* <div>
              <button>+ Add skills</button>
            </div> */}
            <div className="w-4/6">
              <div className="flex flex-wrap mb-4">
                {candidateData &&
                  _.size(candidateData.resumes) > 0 &&
                  candidateData?.resumes?.map((resume: any) =>
                    resume.resume_type === "doc" ? (
                      <div
                        style={{ color: color?.primaryAccent }}
                        key={resume.resume_id}
                        className="mt-2"
                      >
                        <FontAwesomeIcon icon={faFile} className="mr-1" />
                        <Link
                          href={resume.resume_url}
                          className="mr-5 text-sm"
                          target="_blank"
                        >
                          Resume File
                        </Link>
                      </div>
                    ) : (
                      <div
                        style={{ color: color?.primaryAccent }}
                        key={resume.resume_id}
                        className="mt-2"
                      >
                        <FontAwesomeIcon icon={faPlayCircle} className="mr-2" />
                        <Link
                          href={resume.resume_url}
                          className="mr-1 text-sm"
                          target="_blank"
                        >
                          Video Resume
                        </Link>
                      </div>
                    )
                  )}
              </div>
              <div className="hidden">
                <input
                  type="file"
                  name="Upload Resume"
                  placeholder="Upload resume file / link"
                  accept=".pdf,.doc,.docx,.doc,video/*"
                  ref={resumeElement}
                  onChange={(e: any) => {
                    if (e.target.files[0]) {
                      setResume(e.target.files[0].name);
                      setInForm("resume", e.target.files[0]);
                      setResumeFile(e.target.files[0]);
                    } else {
                      setResume("");
                      // setInForm("resume", e.target.files[0]);
                    }
                  }}
                />
              </div>
              <div
                style={{
                  backgroundColor: colorToRGBA(color?.primaryAccent, 0.09),
                  color: color?.secondaryAccent,
                }}
                className="uploadButton w-full h-4/5 px-2 py-6 rounded-md justify-center text-center outline-dashed outline-3 flex flex-wrap"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="w-3/5 flex flex-col items-center gap-2">
                  <FontAwesomeIcon
                    icon={faFile}
                    style={{
                      color: color?.primaryAccent,
                      width: "25px",
                      height: "25px",
                      margin: "auto",
                    }}
                  />
                  <p className="m-auto px-3 text-sm out">Drag and Drop</p>
                  <p className="m-auto px-3 text-sm out">or</p>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={getResume}
                      style={{
                        backgroundColor: color?.primaryAccent,
                        color: color?.btnAccent,
                      }}
                      className="hover:cursor-pointer hover:opacity-70 transition-all duration-300 px-3 py-1.5 rounded-md text-sm "
                    >
                      Browse
                    </button>
                    <span className="text-sm m-2 break-all">
                      {resume ? resume : "to select a resume"}
                    </span>
                  </div>
                  <label className="text-xs flex items-center font-light mt-3 ml-2">
                    <input
                      type="checkbox"
                      className="mr-2 h-3 w-3"
                      checked={autofillChecked}
                      onChange={() => setAutofillChecked(!autofillChecked)}
                    />
                    {/* <input type="checkbox" className="mr-2 h-3 w-3" checked={openParsingModal} onChange={autofillFields} /> */}
                    Autofill fields from resume
                  </label>
                </div>
                <button
                  style={{
                    backgroundColor: color?.primaryAccent,
                    color: color?.btnAccent,
                  }}
                  ref={uploadButton}
                  disabled={resumeLoading}
                  className="w-auto hidden rounded border border-transparent px-3 py-3 text-xs font-medium shadow-sm focus:outline-none m-auto disabled:opacity-40 hover:opacity-75"
                  onClick={() => {
                    autofillChecked && !parsed
                      ? autofillFields()
                      : uploadFiles("resume");
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between">
                    {resumeLoading ? (
                      <div>
                        <Loader height="h-5" width="w-5" />
                      </div>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15"
                        />
                      </svg>
                    )}
                    <p className="mt-1">
                      {autofillChecked && !parsed
                        ? "Parse and Upload"
                        : "Upload"}
                    </p>
                  </div>
                </button>
              </div>
              <div></div>
            </div>
          </div>
          <br />
          <div
            style={{ backgroundColor: color?.innerBg }}
            className={`flex items-center ${
              props?.modal
                ? "justify-end bottom-2 right-14 fixed  w-full pt-2"
                : "justify-end"
            }`}
          >
            <div>
              <ButtonWrapper
                classNames="flex justify-end items-center rounded-lg border border-transparent px-6 py-2 text-base font-medium shadow-sm focus:outline-none"
                onClick={() => {
                  validatePersonalDetails()
                    ? updateCandidateProfile(candidateData)
                    : "";
                }}
                disabled={loading ? true : false}
              >
                {loading ? "Please wait..." : "Save Changes"}
              </ButtonWrapper>
            </div>
          </div>
          <Modal
            open={openParsingModal}
            setOpen={setOpenParsingModal}
            section={props?.modal ? "parseResume" : "companyDetail"}
            header=""
          >
            {parsing ? (
              <div className="w-full flex-col h-[90vh] flex items-center">
                <div className="flex flex-col justify-center items-center h-[90vh]">
                  <Loader />
                  <div>Parsing data...</div>
                </div>
              </div>
            ) : (
              <div
                style={{ backgroundColor: color?.innerBg }}
                className="w-full align-bottom rounded-lg overflow-auto"
              >
                <ParsedDataPage
                  role="admin"
                  loadingParsedData={loading}
                  closeModal={closeModal}
                  setParsing={setParsing}
                  updateCandidateProfile={updateCandidateProfile}
                  candidateData={candidateData}
                  uploadFiles={uploadFiles}
                  candidateId={candidateId}
                  data={parsedData}
                  previewData={previewData}
                  saveParsedDataHandler={saveParsedDataHandler}
                  resumeFile={resumeFile}
                  setParsed={setParsed}
                  color={color}
                />
              </div>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
}
