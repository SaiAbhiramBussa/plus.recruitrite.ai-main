import { useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import Breadcrumbs from "@/src/component/BreadCrumbs";
import TextInput from "@/src/component/TextInput";
import Modal from "@/src/component/Modal";
import Select from "@/src/component/Select";
import {
  checkApolloJobCount,
  createApolloJob,
  deleteJobById,
} from "@/src/services/job";
import { UpdateApolloData } from "@/src/services/apolloJob";
import axios from "axios";
import Loader from "@/src/component/Loader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthGuard from "@/src/component/AuthGuard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import AppContext from "@/src/context/Context";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});
interface ApiResponse {
  data: any;
  status: any;
  response: any;
}

type Props = {
  email?: string;
  password?: string | number;
  showPreview?: boolean;
  showDetail?: boolean;
  apolloJobData?: any;
};
let statusChoice = [
  {
    key: "pending",
    value: "pending",
  },
  {
    key: "paused",
    value: "paused",
  },
];
const ApolloJob = (props: Props) => {
  const router = useRouter();
  const [loaderOn, setLoaderOn] = useState(false);
  const { color } = useContext(AppContext);
  const [showPreview, setShowPreview] = useState(
    props.showPreview ? "true" : false
  );
  const [confirmCreate, setConfirmCreate] = useState(false);
  const [updatedData, setUpdatedData] = useState(props.apolloJobData);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [apolloLabels, setApolloLabels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [apolloLabelData, setApolloLabelData] = useState<any>({
    name: "",
    id: "",
  });
  const [form, setForm] = useState({
    api_key: null,
    apollo_job: null,
    page_number: showPreview ? updatedData.page_number : 1,
    fetch_limit: showPreview ? updatedData.fetch_limit : 100,
    apollo_api_titles: showPreview ? updatedData.apollo_api_titles : "",
    apollo_api_locations: showPreview ? updatedData.apollo_api_locations : "",
    status: showPreview ? updatedData.status : "pending",
    apollo_account_label_ids: showPreview
      ? updatedData.apollo_account_label_ids
      : "",
  } as any);

  useEffect(() => {
    getApolloLabelIds();
  }, []);

  const getApolloLabelIds = async () => {
    try {
      setLoading(true);
      let result = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/apollo-jobs/label-list`,
        {
          withCredentials: true,
        }
      );
      setApolloLabels(result.data.labels);
    } catch (err: any) {
      toast.error(err?.message, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirmationModal = () => {
    setConfirmDelete(true);
  };
  const checkTotalCount = async () => {
    setLoaderOn(true);
    if (
      !form.apollo_api_locations &&
      !form.apollo_api_titles &&
      !form.apollo_account_label_ids
    ) {
      if (!form.apollo_api_locations)
        return setError({
          key: "apollo_api_locations",
          value: "Please specify Atleast Location or Title or Label List",
        });
      if (!form.apollo_api_titles)
        return setError({
          key: "apollo_api_titles",
          value: "Please specify Atleast Location or Title or Label List",
        });
    }
    const apiResponse = await checkApolloJobCount(form);
    const res = apiResponse as ApiResponse;
    setLoaderOn(false);
    setShowSuccessMessage(true);
    setSuccessMessage(
      `Total entries: ${res.data?.total_entries}. Do you want to proceed?`
    );
    setConfirmCreate(true);
  };

  const create = async () => {
    if (
      !form.apollo_api_locations &&
      !form.apollo_api_titles &&
      !form.apollo_account_label_ids
    ) {
      if (!form.apollo_api_locations)
        return setError({
          key: "apollo_api_locations",
          value: "Please specify Atleast Location or Title or Label List",
        });
      if (!form.apollo_api_titles)
        return setError({
          key: "apollo_api_titles",
          value: "Please specify Atleast Location or Title or Label List",
        });
    }

    const res = await createApolloJob(form);
    router.push("/admin/apollo-job/jobs");
  };

  const remove = async (id: any) => {
    setLoading(true);
    try {
      const result: any = await deleteJobById(id);
      if (result && result?.status === 200) {
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateHandler = async () => {
    setUpdating(true);
    try {
      const result: any = await UpdateApolloData(updatedData, updatedData.id);
      if (result && result?.status === 200) {
        router.push("/admin/apollo-job/jobs");
      }
    } catch (error: any) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setUpdating(false);
    }
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

  const handleCompanyChange = (selectedOption: any) => {
    setApolloLabelData(selectedOption);
    setForm((f: any) => ({
      ...f,
      apollo_account_label_ids: selectedOption.id,
    }));
  };

  return (
    <div className="min-h-screen">
      <div className="h-16">
        <DashboardHeader role="admin" />
      </div>

      <div
        style={{ backgroundColor: color?.outerBg }}
        className="flex flex-col px-6 pt-6 h-full"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="px-4 py-4 flex justify-between "
        >
          <div>
            <Breadcrumbs
              title={"Apollo jobs"}
              backPage=""
              link="/admin/apollo-job/jobs"
            />
          </div>
        </div>
        {!form.showDetail && (
          <div
            style={{ backgroundColor: color?.innerBg }}
            className={`flex flex-col ${
              loaderOn ? "opacity-60 z-10 " : ""
            } w-full`}
          >
            {loaderOn ? (
              <div className="w-full h-screen absolute z-30 flex justify-center items-center fixed">
                <Loader />
              </div>
            ) : null}
            <div className="w-3/4 divide-x gap-5 mt-6 mx-auto col-span-2 px-6 flex justify-between">
              <div className="w-3/6 mx-auto h-auto">
                <div>
                  <TextInput
                    label={"Candidate Titles"}
                    section="admin"
                    value={form.apollo_api_titles}
                    placeholder={"Titles you want to search for..."}
                    onChange={(e) =>
                      setField("apollo_api_titles", e.target.value)
                    }
                    error={
                      error?.key === "apollo_api_titles" ? error.value : ""
                    }
                    onValue={(value) => {
                      setField("apollo_api_titles", value);
                    }}
                    disabled={showPreview ? true : false}
                  />
                  <TextInput
                    section="admin"
                    label={"Candidate Locations"}
                    value={form.apollo_api_locations}
                    placeholder={"Type somethings about your offer..."}
                    onChange={(e) =>
                      setField("apollo_api_locations", e.target.value)
                    }
                    error={
                      error?.key === "apollo_api_locations" ? error.value : ""
                    }
                    onValue={(value) => {
                      setField("apollo_api_locations", value);
                    }}
                    disabled={showPreview ? true : false}
                  />
                  <Select
                    items={apolloLabels}
                    section="admin"
                    label={"Apollo company list"}
                    disabled={showPreview ? true : false}
                    selected={form.apollo_account_label_ids}
                    placeholder={
                      !showPreview
                        ? apolloLabelData.name
                          ? apolloLabelData.name
                          : "Select from list..."
                        : updatedData?.apollo_account_label_name
                    }
                    setSelected={(e: any) => handleCompanyChange(e)}
                    error={error?.key === "companyList" ? error.value : ""}
                  />
                  <TextInput
                    type="number"
                    section="admin"
                    name="startPage"
                    placeholder="0-1000"
                    label={"Start Page"}
                    value={
                      showPreview ? updatedData.page_number : form.page_number
                    }
                    onChange={(e) =>
                      setField("page_number", parseInt(e.target.value))
                    }
                    error={error?.key === "page_number" ? error.value : ""}
                  />
                  <TextInput
                    type="number"
                    section="admin"
                    name="endPage"
                    placeholder="Should be Greater than Start Page"
                    label={"End Page"}
                    value={
                      showPreview ? updatedData.fetch_limit : form.fetch_limit
                    }
                    onChange={(e) =>
                      setField("fetch_limit", parseInt(e.target.value))
                    }
                    error={error?.key === "fetch_limit" ? error.value : ""}
                  />

                  {showPreview && (
                    <Select
                      items={statusChoice}
                      section="admin"
                      label={"Status"}
                      selected={showPreview ? updatedData.status : form.status}
                      placeholder={showPreview ? updatedData.status : ""}
                      setSelected={(e) => {
                        setField("status", showPreview ? e.value : e);
                      }}
                      error={error?.key === "status" ? error.value : ""}
                    />
                  )}
                </div>
                <div className="flex justify-end items-center mb-8">
                  <ButtonWrapper
                    onClick={showPreview ? updateHandler : checkTotalCount}
                    disabled={loading}
                    classNames="flex items-center mt-12 justify-center rounded border border-transparent px-4 py-3 text-sm font-medium shadow-sm focus:outline-none"
                  >
                    <FontAwesomeIcon
                      icon={faPlus}
                      className="h-4 mr-1 cursor-pointer"
                    />
                    <span className="mx-1 hidden lg:block">
                      {showPreview
                        ? updating
                          ? "Saving.."
                          : "Save"
                        : loading
                        ? "Creating"
                        : "Create"}
                    </span>
                  </ButtonWrapper>
                  {showPreview && (
                    <div>
                      {!(props.apolloJobData?.status == "in_progress") && (
                        <button
                          style={{ color: color?.btnAccent }}
                          type="button"
                          onClick={showDeleteConfirmationModal}
                          className="flex items-center mt-12 ml-2 justify-center rounded border border-transparent bg-red-500 px-4 py-3 text-sm font-medium shadow-sm hover:bg-red-700 focus:outline-none"
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="h-4 mr-1 cursor-pointer"
                          />
                          <span className="mx-1 hidden lg:block">Delete</span>
                        </button>
                      )}
                      <Modal
                        open={confirmDelete}
                        setOpen={setConfirmDelete}
                        header="Confirmation"
                      >
                        <div className="flex flex-col gap-6 mt-4">
                          <div className="text-md">
                            Are you sure you want to delete this job?
                          </div>
                          <div className="flex items-center justify-end">
                            <div>
                              <button
                                style={{ color: color?.btnAccent }}
                                type="button"
                                disabled={loading}
                                onClick={() => remove("absjsj")}
                                className="disabled:cursor-not-allowed flex justify-center items-center rounded-md border border-transparent bg-red-500 px-5 py-2.5 text-sm font-medium shadow-sm hover:bg-red-700 disabled:bg-red-400 focus:outline-none mt-4"
                              >
                                <FontAwesomeIcon
                                  icon={faTrash}
                                  className="h-4 mr-1 cursor-pointer"
                                />
                                <span className="mx-1 hidden lg:block">
                                  Delete
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </Modal>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <Modal
          open={confirmCreate}
          setOpen={setConfirmCreate}
          header="Confirmation"
        >
          <div className="flex flex-col gap-6 mt-4">
            <div className="text-md">
              {showError && <div className="">{errorMessage}</div>}
              {showSuccessMessage && <div className="">{successMessage}</div>}
            </div>
            <div className="flex items-center justify-end">
              <div>
                <ButtonWrapper
                  disabled={showError}
                  onClick={() => create()}
                  classNames="flex justify-center items-center border border-transparent px-5 py-2.5 rounded-md text-sm font-medium shadow-sm focus:outline-none mt-4"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className="h-4 mr-1 cursor-pointer"
                  />
                  <span className="mx-1 hidden lg:block">
                    {showPreview
                      ? updating
                        ? "Saving.."
                        : "Save"
                      : loading
                      ? "Creating"
                      : "Create"}
                  </span>
                </ButtonWrapper>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AuthGuard(ApolloJob);
