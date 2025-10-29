import { useCallback, useContext, useEffect, useState } from "react";
import TextInput from "@/src/component/TextInput";
import Select from "@/src/component/Select";
import Breadcrumbs from "@/src/component/BreadCrumbs";
import Modal from "@/src/component/Modal";
import UploadOffers from "@/src/component/Job/UploadOffers";
import { useRouter } from "next/router";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import { CreateNewJob } from "@/src/component/Job/JobServices";
import SkillTab from "@/src/component/SkillTab";
import { deleteJobById, UpdateData } from "@/src/services/job";
import jobLocation from "./../../locations.json";
import jobIndustries from "./../../industries.json"
import _ from "lodash";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TextEditor from "@/src/component/TextEditor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import AppContext from "../context/Context";
import { colorToRGBA } from "../utils/misc";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

type Props = {
  email?: string;
  password?: string | number;
  showPreview?: boolean;
  showDetail?: boolean;
  companyData?: any;
};

let workLocation = [
  {
    key: "0",
    value: "onsite",
  },
  {
    key: "1",
    value: "hybrid",
  },
  {
    key: "2",
    value: "remote",
  },
];

let remoteType: any = [
  {
    key: "0",
    value: "Within State",
    option: "state",
  },
  {
    key: "1",
    value: "Within country",
    option: "country",
  },
  {
    key: "2",
    value: "Global",
    option: "any_region",
  },
];

const JobCreateForm = (props: Props) => {
  const router = useRouter();
  const companyid = router.query.id ? router.query.id[0] : null;

  const [showPreview, setShowPreview] = useState(
    props.showPreview ? "true" : false
  );
  const [isEnterPressed, setIsEnterPressed] = useState(false);
  const { companyData } = props;
  const [updatedData, setUpdatedData] = useState(companyData);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [showRemoteType, setShowRemoteType] = useState<boolean>(false);
  const [locations, setLocations] = useState<any>();
  const [form, setForm] = useState({
    isActive: showPreview
      ? updatedData.status === "active"
        ? true
        : false
      : true,
    title: showPreview ? updatedData.title : "",
    showDetail: props.showDetail ? props.showDetail : false,
    compensation: showPreview ? updatedData.compensation : 0,
    description: showPreview ? updatedData.description : "",
    status: "active",
    jobLocation: {
      key: "",
      value: "",
    },
    jobIndustry: {
      key: "",
      value: "",
    },
    workLocation: {
      key: "",
      value: "",
    },
    remoteType: {
      key: "",
      value: "",
      option: "",
    },
    skills: [],
    skillsList: showPreview ? companyData.skills : "",
  } as any);
  const [loading, setLoading] = useState(false);
  const [companyLocation, setCompanyLocation] = useState<any>(
    updatedData ? updatedData?.companyLocation : null
  );
  const [role, setRole] = useState("");
  const [showModalRerunModal, setShowModalRerunModal] = useState(false);
  const { color } = useContext(AppContext);

  useEffect(() => {
    const user: any = localStorage.getItem("user");
    setRole(JSON.parse(user).role);
  }, []);

  useEffect(() => {
    setUpdatedData(companyData);
  }, [companyData]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const getOptionValue = (option: any) => {
    const addressParts = _.compact([
      option?.state,
      option?.city,
      option?.address,
    ]);
    const formattedAddress = `${addressParts[1] && addressParts[1]} (${
      addressParts[0] && addressParts[0]
    }, ${addressParts[2] && addressParts[2]})`;
    return formattedAddress;
  };

  const setField = useCallback(
    (name: keyof typeof form, value: any) =>
      showPreview
        ? setUpdatedData((f: any) => ({ ...f, [name]: value }))
        : setForm((f: any) => ({ ...f, [name]: value })),
    [setForm, setUpdatedData, showPreview]
  );

  const [error, setError] = useState<{
    key: keyof typeof form | "";
    value: any;
  }>({ key: "" as any, value: "" });

  const setActiveHandler = async (isActive: any) => {
    await setForm({ isActive: !form.isActive });

    (await isActive)
      ? setField("status", "active")
      : setField("status", "inactive");

    updateHandler();
    if (form.status === "active") {
      setField("isActive", form.status === "active" ? "true" : "false");
    }
  };

  const keyDownHandler = (e: any) => {
    if (e.key === "Enter") {
      setIsEnterPressed(true);
    }
  };

  const showDeleteConfirmationModal = () => {
    setConfirmDelete(true);
  };

  const handlerModal = () => {
    setOpenModal(true);
  };

  const create = async () => {
    if (!form.title)
      return setError({ key: "title", value: "Please specify title" });
    if (!companyLocation)
      return setError({
        key: "companyLocation",
        value: "Please specify company location",
      });
    if (!form.jobLocation.value)
      return setError({
        key: "jobLocation",
        value: "Please specify job location",
      });
    if (!form.workLocation.value)
      return setError({
        key: "workLocation",
        value: "Please specify work location",
      });
    if (form.workLocation.value === "remote" && !form.remoteType.value)
      return setError({
        key: "remoteType",
        value: "Please specify remote type",
      });
    if (!form.compensation)
      return setError({
        key: "compensation",
        value: "Please specify compensation",
      });
    if (!form.skillsList)
      return setError({ key: "skillsList", value: "Please specify skills" });
    if (!form.description)
      return setError({
        key: "description",
        value: "Please specify description",
      });

    setError({ key: "", value: "" });
    setLoading(true);
    try {
      form.skills = form.skillsList.split(",");
      form.location_id = companyLocation.id;
      const result = await CreateNewJob(form);
      toast.success("Job created successfully!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
      router.back();
    } catch (error) {
      toast.error("Something went wrong creating job posting", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // const fetchLocations = async () => {
  //   const response = await axios.get(
  //     `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/locations/`,
  //     {
  //       withCredentials: true,
  //     }
  //   );
  //   if (response.status === 200) {
  //     setLocations(response.data);
  //   }
  // };

  const fetchLocations = async () => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/locations/`,
      {
        withCredentials: true,
      }
    );
    if (response.status === 200) {
      setLocations(response.data);
    }
  };

  const remove = async (id: any) => {
    setLoading(true);
    try {
      const result: any = await deleteJobById(id);
      if (result && result.status === 200) {
        toast.success("Job post deleted successfully!", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Something went wrong deleting job posting", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateHandler = async () => {
    setLoading(true);
    try {
      let skills = updatedData.skillsList?.split(",");
      let data = updatedData;
      _.set(data, "skills", skills);
      const result: any = await UpdateData(data, updatedData.id);
      if (result && result.status === 200) {
        setShowModalRerunModal(true);
      }
    } catch (error) {
      toast.error("Something went wrong updating job posting", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="h-16">
        <DashboardHeader />
      </div>

      <div
        style={{
          backgroundColor: color?.outerBg,
          color: color?.secondaryAccent,
        }}
        className="flex flex-col px-6 py-6 min-h-screen"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="px-4 py-4 flex justify-between "
        >
          <div>
            <Breadcrumbs
              title={form?.showDetail ? "Job detail" : "Dashboard"}
              backPage={""}
            />
          </div>
          {role !== "admin" && (
            <div className="flex items-center">
              <button
                style={{
                  backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
                  color: color?.primaryAccent,
                }}
                onClick={() => handlerModal()}
                className="flex items-center justify-center h-12 hover:opacity-75 px-4"
              >
                <div className="text-sm font-semibold mr-2">
                  Upload multiple jobs
                </div>
                <Modal
                  open={openModal}
                  setOpen={setOpenModal}
                  header="Upload Offers"
                >
                  <UploadOffers
                    setOpenModal={setOpenModal}
                    role="multipleJobPosting"
                    color={color}
                  />
                </Modal>
                <svg
                  fill="none"
                  style={{ color: color?.primaryAccent }}
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Form starts */}
        {!form.showDetail && (
          <div
            style={{ backgroundColor: color?.innerBg }}
            className="flex flex-col"
          >
            <div className="w-3/4 divide-x gap-5 mt-6 mx-auto col-span-2 px-6 flex justify-between">
              <div className="w-3/6 h-auto">
                <div className="">
                  <TextInput
                    name="title"
                    section="employer"
                    value={showPreview ? updatedData?.title : form?.title}
                    label={"Job title"}
                    placeholder="Type your title here..."
                    onChange={(e) => setField("title", e.target.value)}
                    error={error?.key === "title" ? error.value : ""}
                  />
                  {locations && (
                    <Select
                      items={locations}
                      isLocation={true}
                      label={"Company location"}
                      section="admin"
                      selected={
                        companyLocation && getOptionValue(companyLocation)
                      }
                      placeholder={
                        companyLocation
                          ? getOptionValue(companyLocation)
                          : "Select the company location..."
                      }
                      setSelected={(e) => {
                        setCompanyLocation(e);
                      }}
                      error={
                        error?.key === "companyLocation" ? error.value : ""
                      }
                    />
                  )}
                  <Select
                    items={jobLocation}
                    label={"Job location"}
                    section="employer"
                    selected={
                      showPreview
                        ? updatedData?.jobLocation
                        : form?.jobLocation.value
                    }
                    placeholder={
                      showPreview
                        ? updatedData?.jobLocation
                        : "Select the job location..."
                    }
                    setSelected={(e) => {
                      setField("jobLocation", showPreview ? e.value : e);
                    }}
                    error={error?.key === "jobLocation" ? error.value : ""}
                  />
                  <Select
                    items={workLocation}
                    section="employer"
                    label={"Work location"}
                    selected={
                      showPreview
                        ? updatedData?.workLocation
                        : form?.workLocation.value
                    }
                    placeholder={
                      showPreview
                        ? updatedData?.workLocation
                        : "Select the work location..."
                    }
                    setSelected={(e) => {
                      setField("workLocation", showPreview ? e.value : e);
                      e.value === "remote"
                        ? setShowRemoteType(true)
                        : setShowRemoteType(false);
                    }}
                    error={error?.key === "workLocation" ? error.value : ""}
                  />
                  {(showRemoteType ||
                    (showPreview &&
                      updatedData?.workLocation === "remote")) && (
                    <Select
                      items={remoteType}
                      section="employer"
                      label={"Location (if Remote)"}
                      selected={
                        showPreview
                          ? remoteType &&
                            remoteType.find(
                              (type: any) =>
                                type.option === updatedData.remoteType
                            )
                            ? remoteType.find(
                                (type: any) =>
                                  type.option === updatedData.remoteType
                              ).value
                            : updatedData.remoteType
                          : form?.remoteType.value
                      }
                      placeholder={
                        showPreview
                          ? updatedData?.remoteType
                          : "Select the location for remote work..."
                      }
                      setSelected={(e) =>
                        setField("remoteType", showPreview ? e.value : e)
                      }
                      error={error?.key === "remoteType" ? error.value : ""}
                    />
                  )}
                  <Select
                    items={jobIndustries}
                    label={"Industry"}
                    section="employer"
                    selected={
                      showPreview
                        ? updatedData?.jobIndustry
                        : form?.jobIndustry.value
                    }
                    placeholder={
                      showPreview
                        ? updatedData?.jobIndustry
                        : "Select the job industry..."
                    }
                    setSelected={(e) => {
                      setField("jobIndustry", showPreview ? e.value : e);
                    }}
                    error={error?.key === "jobIndustry" ? error.value : ""}
                  />
                  <TextInput
                    type="number"
                    section="employer"
                    name="compensation"
                    placeholder="0-1000"
                    min={0}
                    label={"Annual salary (in USD)"}
                    value={
                      showPreview
                        ? updatedData?.compensation
                        : form?.compensation || 0
                    }
                    onKeyDown={(e: any) =>
                      e.code == "Minus" || e.code == "NumpadSubtract"
                        ? e.preventDefault()
                        : ""
                    }
                    onChange={(e) => setField("compensation", e.target.value)}
                    error={error?.key === "compensation" ? error.value : ""}
                  />
                  <TextInput
                    type="string"
                    section="employer"
                    name="skillsList"
                    placeholder="Enter each skill separated by a comma"
                    label={"Job Skills"}
                    // onKeyDown={keyDownHandler}
                    value={
                      showPreview
                        ? updatedData?.skillsList
                        : form?.skillsList || 0
                    }
                    onChange={(e) => setField("skillsList", e.target.value)}
                    error={error?.key === "skillsList" ? error.value : ""}
                  />
                  {showPreview && companyData?.skills !== undefined && (
                    <SkillTab portal="job" skills={companyData?.skills} />
                  )}
                  {/* <TextArea
                rows={6}
                section="employer"
                label={"Description"}
                value={showPreview ? updatedData?.description : form?.description}
                placeholder={"Type somethings about your offer..."}
                onChange={(e) => setField("description", e.target.value)}
                error={error?.key === "description" ? error.value : ""}
                onValue={(value) => {setField("description", value)}}
              /> */}
                  <TextEditor
                    error={error?.key === "description" ? error.value : ""}
                    placeholder="Type something about your offer..."
                    label="Description"
                    initialValue={
                      showPreview ? updatedData?.description : form?.description
                    }
                    onChange={(e: any) => setField("description", e)}
                  />
                </div>
                <div className="flex justify-end items-center mb-8">
                  <ButtonWrapper
                    onClick={showPreview ? updateHandler : create}
                    disabled={loading}
                    classNames="flex mt-12 justify-end items-center rounded border border-transparent px-5 py-3 text-base font-medium shadow-sm focus:outline-none"
                  >
                    {showPreview
                      ? loading
                        ? "Saving..."
                        : "Save"
                      : loading
                      ? "Creating..."
                      : "Create job"}
                  </ButtonWrapper>
                  {showPreview && (
                    <div className="flex items-center">
                      <button
                        type="button"
                        style={{ color: color?.btnAccent }}
                        onClick={showDeleteConfirmationModal}
                        className="flex mt-12 ml-2 justify-end items-center rounded-md border border-transparent bg-red-500 px-5 py-2 text-base font-medium shadow-sm hover:bg-red-400 focus:outline-none"
                      >
                        Delete
                      </button>
                      <Modal
                        open={confirmDelete}
                        setOpen={setConfirmDelete}
                        header="Confirmation"
                      >
                        <div className="flex flex-col gap-6 mt-2">
                          <div className="text-md">
                            Are you sure you want to delete this job posting?
                          </div>
                          <div className="flex items-center justify-end">
                            <div>
                              <button
                                style={{ color: color?.btnAccent }}
                                disabled={loading}
                                type="button"
                                className="disabled:cursor-not-allowed flex justify-center items-center rounded-md border border-transparent bg-red-500 px-5 py-2.5 text-sm font-medium shadow-sm hover:bg-red-700 disabled:bg-red-400 focus:outline-none mt-4"
                                onClick={() => remove(companyData.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </Modal>
                      <Modal
                        open={showModalRerunModal}
                        setOpen={setShowModalRerunModal}
                        header="Confirmation"
                        type="alert"
                      >
                        <div className="flex flex-col gap-6">
                          <div className="flex justify-between items-center">
                            <FontAwesomeIcon
                              icon={faTriangleExclamation}
                              className="h-20 mr-2 text-yellow-400 cursor-pointer"
                            />
                            <div className="text-md font-light ml-4">
                              StartDate has received your edits, our Model V5
                              will reprocess and will add new candidates very
                              soon. This may take a couple of minutes.
                            </div>
                          </div>
                        </div>
                      </Modal>
                    </div>
                  )}
                </div>
              </div>
              {/* job preview */}
              <div className="col-span-1 w-3/6 flex flex-col py-6 pl-6 mb-1 h-100">
                <div className="font-semibold mb-1">Job preview</div>
                <div
                  style={{
                    backgroundColor: color?.innerBg,
                    borderColor: color?.outerBg,
                  }}
                  className="flex flex-col w-full divide-y border rounded-md overflow-auto"
                >
                  <div className="flex justify-start items-center px-2 py-4">
                    <svg
                      className="w-12 h-12 mr-4"
                      width="38"
                      height="38"
                      viewBox="0 0 34 34"
                    >
                      <g
                        id="Grupo_4966"
                        data-name="Grupo 4966"
                        transform="translate(-1292 -14)"
                      >
                        <circle
                          id="Elipse_419"
                          data-name="Elipse 419"
                          cx="17"
                          cy="17"
                          r="17"
                          transform="translate(1292 14)"
                          fill="#474a56"
                        />
                        <path
                          id="company"
                          d="M4.949,18.275a2.432,2.432,0,0,1-1.784-.741,2.43,2.43,0,0,1-.74-1.783V7.928a2.433,2.433,0,0,1,.74-1.784A2.433,2.433,0,0,1,4.949,5.4h.6V4.8a2.433,2.433,0,0,1,.74-1.784,2.433,2.433,0,0,1,1.784-.74h4.694a2.43,2.43,0,0,1,1.783.74A2.432,2.432,0,0,1,15.3,4.8V8.533h.6a2.527,2.527,0,0,1,2.524,2.524v4.694A2.528,2.528,0,0,1,15.9,18.275H11.207V14.186H9.643v4.089Zm0-2.524H6.514V14.186H4.949Zm0-3.129H6.514V11.057H4.949Zm0-3.129H6.514V7.928H4.949Zm3.129,3.129H9.643V11.057H8.078Zm0-3.129H9.643V7.928H8.078Zm0-3.129H9.643V4.8H8.078Zm3.129,6.258h1.565V11.057H11.207Zm0-3.129h1.565V7.928H11.207Zm0-3.129h1.565V4.8H11.207Zm3.129,9.387H15.9V14.186H14.336Zm0-3.129H15.9V11.057H14.336Z"
                          transform="translate(1298.575 20.725)"
                          fill="#fff"
                        />
                      </g>
                    </svg>
                    <div className="flex flex-col">
                      <div className="font-medium">
                        {showPreview
                          ? updatedData.title
                          : form.title || "Job title"}
                      </div>
                      <div className="text-lg font-light" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 divide-x py-4 px-2">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 mr-2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                      </svg>
                      <div className="text-sm font-extralight max-w-[5vw] min-w-[5vw] truncate ">
                        {showPreview
                          ? companyData.jobLocation
                          : form.jobLocation?.value}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 mr-2 ml-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-sm font-extralight max-w-[4vw] min-w-[4vw] truncate">
                        {showPreview
                          ? companyData.workLocation
                          : form.workLocation?.value}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-4 font-extralight">
                        <span style={{ color: color?.primaryAccent }}>
                          {" "}
                          $
                          {showPreview
                            ? updatedData.compensation
                            : form.compensation || 0}{" "}
                          /{" "}
                        </span>{" "}
                        year
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-start py-4 px-3 overflow-auto">
                    <div className=" text-sm">Description</div>
                    {showPreview && (
                      <p className="text-sm h-100 font-extralight">
                        {/* {(updatedData.description || "") || "..."} */}
                        <div
                          className="text-editor-priview"
                          dangerouslySetInnerHTML={{
                            __html: updatedData.description || "" || "...",
                          }}
                        />
                      </p>
                    )}
                    {!showPreview && (
                      <p className="text-sm h-100 font-extralight">
                        <div
                          className="text-editor-priview"
                          dangerouslySetInnerHTML={{
                            __html: form.description || "" || "...",
                          }}
                        />
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobCreateForm;
