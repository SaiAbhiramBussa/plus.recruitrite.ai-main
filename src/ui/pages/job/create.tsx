import React, { useContext, useEffect, useState } from "react";
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
import _ from "lodash";
import AuthGuard from "@/src/component/AuthGuard";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TextEditor from "@/src/component/TextEditor";
import JobIndustries from "./../../industries.json"
import dynamic from "next/dynamic";
import CustomizationsData from "@/src/utils/CustomizationData";
import AppContext from "@/src/context/Context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
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

const workLocation = [
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

const remoteType: any = [
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

const checkIsAdmin = (): boolean => {
  let user = localStorage.getItem("user");
  let isAdmin: boolean = false;
  if (user) {
    let userParsed = JSON.parse(user);
    if (userParsed?.role == "admin") {
      isAdmin = true;
    }
  }
  return isAdmin;
};

const JobPage = (props: Props) => {
  const router = useRouter();
  const isAdmin = checkIsAdmin();
  const [showPreview, setShowPreview] = useState(
    props.showPreview ? "true" : false
  );
  const { companyData } = props;
  const [updatedData, setUpdatedData] = useState(companyData);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [showRemoteType, setShowRemoteType] = useState<boolean>(false);
  const [locationId, setLocationId] = useState<any>();
  const [redirect, setRedirect] = useState(false);
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
      key : "",
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
  if (isAdmin) {
    if (!_.has(form, "minimum_match")) {
      setForm({
        ...form,
        minimum_match: showPreview ? updatedData.minimum_match : 0,
      });
    }
  }
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [showModalRerunModal, setShowModalRerunModal] = useState(false);
  const customizationsData: any = CustomizationsData[6].data;
  const { color } = useContext(AppContext);

  useEffect(() => {
    const user: any = localStorage.getItem("user");
    setRole(JSON.parse(user).role);
    setLocationId(JSON.parse(user).location_id);
  }, []);

  useEffect(() => {
    if (redirect && !showModalRerunModal) {
      router.push("/dashboard");
    }
  }, [showModalRerunModal, redirect]);

  useEffect(() => {
    setUpdatedData(companyData);
  }, [companyData]);

  const setField = React.useCallback(
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

  const showDeleteConfirmationModal = () => {
    setConfirmDelete(true);
  };

  const handlerModal = () => {
    setOpenModal(true);
  };

  const create = async () => {
    if (!form.title)
      return setError({ key: "title", value: "Please specify title" });
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
    if (!form.minimum_match && isAdmin)
      return setError({
        key: "minimum_match",
        value: "Please specify Min Match",
      });
    if (!form.description)
      return setError({
        key: "description",
        value: "Please specify description",
      });

    setError({ key: "", value: "" });
    setLoading(true);
    try {
      form.location_id = locationId;
      form.skills = form.skillsList.split(",");
      const result = await CreateNewJob(form);
      router.push("/dashboard");
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
        router.back();
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
        setRedirect(true);
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
          color: color?.text,
        }}
        className="flex flex-col p-6"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="px-4 py-4 flex justify-between "
        >
          <div>
            <Breadcrumbs
              title={
                form.isActive
                  ? customizationsData.form.secondaryText
                  : customizationsData.form.primaryText
              }
              backPage={""}
              link={role === "admin" ? "/admin/jobs" : null}
            />
          </div>
          <div className="flex items-center">
            <ButtonWrapper
              onClick={() => handlerModal()}
              classNames="flex items-center justify-center py-2.5 px-5 rounded-md"
              color={customizationsData.color}
            >
              <p className="text-sm font-semibold mr-2">Upload multiple jobs</p>
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
            </ButtonWrapper>
          </div>
        </div>

        {/* Form starts */}
        {!form.showDetail && (
          <div
            style={{ backgroundColor: color?.innerBg }}
            className="flex flex-col"
          >
            <div className="divide-x gap-5 mt-6 px-6 flex justify-between">
              <div className="h-auto w-full">
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
                    items={JobIndustries}
                    label={"Industry"}
                    section="employer"
                    selected={
                      showPreview
                        ? updatedData?.job_industry
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
                    label={"Annual salary (in USD)*"}
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
                    <SkillTab
                      portal="job"
                      skills={companyData?.skills}
                      color={color}
                    />
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
                  {isAdmin ? (
                    <TextInput
                      type="number"
                      section="employer"
                      name="minimumMatch"
                      placeholder="Minimum Match"
                      min={0}
                      max={100}
                      label={"Minimum Match"}
                      onKeyDown={(e: any) =>
                        e.code == "Minus" || e.code == "NumpadSubtract"
                          ? e.preventDefault()
                          : ""
                      }
                      value={
                        showPreview
                          ? updatedData?.minimum_match
                          : form?.minimum_match
                      }
                      onChange={(e) =>
                        Number(e.target.value) > 100
                          ? ""
                          : setField("minimum_match", e.target.value)
                      }
                      error={error?.key === "minimum_match" ? error.value : ""}
                    />
                  ) : (
                    <></>
                  )}
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
                    classNames="flex mt-12 justify-end items-center rounded-md border border-transparent px-5 py-2 text-base font-medium shadow-sm focus:outline-none"
                  >
                    {showPreview
                      ? loading
                        ? "Saving..."
                        : customizationsData.btnTertiaryText
                      : loading
                      ? "Creating..."
                      : customizationsData.btnSecondaryText}
                  </ButtonWrapper>
                  {showPreview && (
                    <div className="flex items-center">
                      <button
                        type="button"
                        style={{ color: color?.btnAccent }}
                        onClick={showDeleteConfirmationModal}
                        className="flex mt-12 ml-2 justify-end items-center rounded-md border transition-all hover:opacity-75 border-transparent px-5 py-2 text-base bg-red-500 disabled:bg-red-200 font-medium shadow-sm focus:outline-none"
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
                                disabled={loading}
                                type="button"
                                style={{ color: color?.btnAccent }}
                                className="disabled:cursor-not-allowed flex justify-center items-center rounded-md border border-transparent bg-red-500 px-5 py-2 text-sm font-medium shadow-sm hover:bg-red-700 disabled:bg-red-400 focus:outline-none mt-4"
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
                        classNames="max-w-lg"
                      >
                        <div className="flex flex-col gap-6 my-6 ml-1">
                          <div className="flex justify-between items-center gap-5">
                            <FontAwesomeIcon
                              icon={faTriangleExclamation}
                              className="text-yellow-500 h-20 mb-3"
                            />
                            <div className="flex flex-col gap-2 text-[15px]">
                              <p>
                                StartDate has received your edits and our Model
                                V5 will re-process new candidates very soon.
                              </p>
                              <p>
                                This may take a couple of minutes, we'll email
                                you once it's done!
                              </p>
                            </div>
                          </div>
                        </div>
                      </Modal>
                    </div>
                  )}
                </div>
              </div>
              {/* job preview */}
              <div className="flex w-full flex-col py-6 pl-6 mb-1 h-100">
                <div className="font-semibold mb-1">
                  {customizationsData.previewText}
                </div>
                <div
                  style={{
                    backgroundColor: color?.innerBg,
                    color: color?.secondaryAccent,
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
                        <span style={{ color: color?.primaryText }}>
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
                      <div className="text-sm h-100 font-extralight">
                        <div
                          className="text-editor-priview"
                          dangerouslySetInnerHTML={{
                            __html: form.description || "" || "...",
                          }}
                        />
                      </div>
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

export default AuthGuard(JobPage);
