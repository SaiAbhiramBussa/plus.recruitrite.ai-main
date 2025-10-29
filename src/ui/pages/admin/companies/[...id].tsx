import { useContext, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import countries from "i18n-iso-countries";
import { fetchCompanyJobsById } from "@/src/services/job";
import Modal from "@/src/component/Modal";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import Breadcrumbs from "@/src/component/BreadCrumbs";
import {
  faBriefcase,
  faCogs,
  faEdit,
  faLocation,
  faLocationDot,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import "react-toastify/dist/ReactToastify.css";
import Users from "@/src/component/company/Users";
import Locations from "@/src/component/company/Locations";
import Integrations from "@/src/component/company/Integrations";
import Jobs from "@/src/component/company/Jobs";
import JobCreateForm from "@/src/component/JobCreateForm";
import _ from "lodash";
import Company from "@/src/component/create-company/company";
import Image from "next/image";
import CustomizationsData from "@/src/utils/CustomizationData";
import AppContext from "@/src/context/Context";
import { colorToRGBA } from "@/src/utils/misc";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

const CompanyDetailPage = () => {
  const router = useRouter();
  const companyid = router.query.id ? router.query.id[0] : null;
  const route = router.query.id ? router.query.id[1] : null;
  const isCreateCompany = router.query.id ? router.query.id[2] : null;

  const [tab, setTab] = useState<any>("");
  const [companyData, setCompanyData] = useState("");
  const [companyInfo, setCompanyInfo] = useState<any>();
  const [isChecked, setIsChecked] = useState<boolean>();
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [showAddCompanynModal, setShowAddCompanyModal] =
    useState<boolean>(false);
  const [userForm, setUserForm] = useState<any>();
  const [locationForm, setLocationForm] = useState<any>();
  const [companyForm, setCompanyForm] = useState<any>();
  const [showNoLocationMessage, setShowNoLocationMessage] =
    useState<boolean>(false);
  const [locationFormData, setLocationFormData] = useState<any>();
  const [locationId, setLocationId] = useState<any>();
  const [error, setError] = useState<any>("");
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const customizationsData: any = CustomizationsData[7].data;
  const { color } = useContext(AppContext);

  useEffect(() => {
    !showAddUserModal && setError("");
  }, [showAddUserModal]);

  useEffect(() => {
    companyid && !showConfirmation ? fetch(companyid) : "";
  }, [companyid, showConfirmation]);

  useEffect(() => {
    companyInfo?.locations?.length === 0 && setShowNoLocationMessage(true);
  }, [companyInfo?.locations?.length]);

  useEffect(() => {
    route && setTab(route);
  }, [route]);

  const toggleSlider = () => {
    setIsChecked(!isChecked);
    setShowConfirmation(true);
  };

  const fetch = async (id: any) => {
    setCompanyData(await fetchCompanyJobsById(id));

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}`,
      {
        withCredentials: true,
      }
    );
    setCompanyInfo(response.data);
  };

  const FullServiceHandler = async () => {
    let res: any = await axios.patch(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/full-service`,
      {
        company_id: companyid,
        full_service:
          companyInfo && companyInfo.subscription_type === "full_service"
            ? false
            : true,
      },
      { withCredentials: true }
    );
    if (res.status === 200) {
      toast.success(res.data.message, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
      setShowConfirmation(false);
      return res;
    }
    setShowConfirmation(false);
  };

  const openCompanyEditModal = async (companyItem: any) => {
    setCompanyForm(companyItem);
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}`,
      {
        withCredentials: true,
      }
    );
    if (response.status === 200) {
      companyItem = response.data;
    }

    setCompanyForm(companyItem);
    setShowAddCompanyModal(true);
    setIsEdit(true);
  };

  return isCreateCompany ? (
    <JobCreateForm />
  ) : (
    <div
      style={{
        backgroundColor: color?.outerBg,
        color: color?.secondaryAccent,
      }}
      className="min-h-screen overflow-auto"
    >
      <div className="h-16">
        <DashboardHeader companyName="Admin" section="companies" />
      </div>

      <div
        style={{ backgroundColor: color?.innerBg }}
        className="flex flex-col my-6 min-h-screen flex-1 mx-6"
      >
        <div className="flex flex-col w-full h-full grow ">
          <div className="p-2 w-1/3 mb-4 flex items-center">
            {/* <Breadcrumbs title="Companies" backPage={""} link={'admincompanies'} /> */}
            <Breadcrumbs
              title={customizationsData.text}
              backPage=""
              link={"/admin/companies"}
            />
          </div>
          <div className="p-4 flex justify-between">
            {companyInfo && (
              <div className="flex w-5/6">
                <div className="logo w-4/12 md:w-2/12 xl:w-1/12">
                  {companyInfo.logo ? (
                    <Image
                      src={companyInfo.logo ? companyInfo.logo : ""}
                      alt="No Image"
                      className="w-20 mr-3 h-20 mb-1 p-1 rounded-full"
                      height={0}
                      width={0}
                    />
                  ) : (
                    <svg
                      className="w-20 mr-3 h-20 mb-1 p-1"
                      width="34"
                      height="34"
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
                        ></circle>
                        <path
                          id="company"
                          d="M4.949,18.275a2.432,2.432,0,0,1-1.784-.741,2.43,2.43,0,0,1-.74-1.783V7.928a2.433,2.433,0,0,1,.74-1.784A2.433,2.433,0,0,1,4.949,5.4h.6V4.8a2.433,2.433,0,0,1,.74-1.784,2.433,2.433,0,0,1,1.784-.74h4.694a2.43,2.43,0,0,1,1.783.74A2.432,2.432,0,0,1,15.3,4.8V8.533h.6a2.527,2.527,0,0,1,2.524,2.524v4.694A2.528,2.528,0,0,1,15.9,18.275H11.207V14.186H9.643v4.089Zm0-2.524H6.514V14.186H4.949Zm0-3.129H6.514V11.057H4.949Zm0-3.129H6.514V7.928H4.949Zm3.129,3.129H9.643V11.057H8.078Zm0-3.129H9.643V7.928H8.078Zm0-3.129H9.643V4.8H8.078Zm3.129,6.258h1.565V11.057H11.207Zm0-3.129h1.565V7.928H11.207Zm0-3.129h1.565V4.8H11.207Zm3.129,9.387H15.9V14.186H14.336Zm0-3.129H15.9V11.057H14.336Z"
                          transform="translate(1298.575 20.725)"
                          fill="#fff"
                        ></path>
                      </g>
                    </svg>
                  )}
                </div>
                <div className="company w-11/12">
                  <div className="flex items-start">
                    <p className="text-xl font-semibold capitalize">
                      {companyInfo?.website_url ? (
                        <Link href={companyInfo?.website_url} target="_blank">
                          {`${
                            companyInfo && companyInfo.name
                              ? companyInfo.name
                              : companyInfo.company_name
                          }`}
                        </Link>
                      ) : (
                        `${
                          companyInfo && companyInfo.name
                            ? companyInfo.name
                            : companyInfo.company_name
                        } `
                      )}
                    </p>
                    <button
                      className="ml-2 cursor-pointer"
                      onClick={() => openCompanyEditModal(companyInfo)}
                    >
                      <FontAwesomeIcon icon={faEdit} className="h-3" />
                    </button>
                  </div>
                  <p className="text-xs font-medium leading-4 mb-3">
                    {companyInfo?.industry?.title
                      ? companyInfo?.industry?.title
                      : "-"}
                  </p>
                  <div className="text-sm font-medium leading-4 w-full">
                    <div
                      className="text-editor-priview rounded w-full"
                      dangerouslySetInnerHTML={{
                        __html: companyInfo?.description
                          ? companyInfo?.description
                          : "-",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div>
              <div className="relative ml-10 items-center flex select-none">
                <input
                  type="checkbox"
                  className="form-toggle absolute w-full h-10 opacity-0 z-10 cursor-pointer"
                  checked={
                    companyInfo?.subscription_type === "full_service"
                      ? true
                      : false
                  }
                  onChange={toggleSlider}
                />
                <div
                  style={
                    companyInfo?.subscription_type === "full_service"
                      ? { backgroundColor: color?.primaryAccent }
                      : { backgroundColor: color?.outerBg }
                  }
                  className={`${
                    companyInfo?.subscription_type === "full_service"
                      ? "grid justify-items-end"
                      : ""
                  } form-toggle-slider h-6 w-12 rounded-full shadow-inner transition-all duration-200 ease-in-out`}
                >
                  <div
                    style={{ backgroundColor: color?.innerBg }}
                    className={`circle h-4 w-4 rounded-full shadow-sm m-1`}
                  ></div>
                </div>
                <div className="text-xs ml-2">{customizationsData.btnText}</div>
              </div>
            </div>
          </div>
          <div
            style={{
              color: colorToRGBA(color?.secondaryAccent, color?.opacity),
            }}
            className="text-sm font-medium text-center flex justify-center w-full"
          >
            <button
              type="button"
              style={
                tab === "users"
                  ? {
                      color: color?.primaryAccent,
                      borderColor: color?.primaryAccent,
                    }
                  : {
                      color: colorToRGBA(
                        color?.secondaryAccent,
                        color?.opacity
                      ),
                    }
              }
              className={`${
                tab === "users" ? "border-b-2 active" : ""
              } inline-block p-4 rounded-t-lg"`}
              onClick={() => router.push(`${companyid}/users`)}
            >
              <FontAwesomeIcon
                icon={faUser}
                className="h-4 mr-2 cursor-pointer"
              />
              Users
            </button>
            <button
              type="button"
              style={
                tab === "locations"
                  ? {
                      color: color?.primaryAccent,
                      borderColor: color?.primaryAccent,
                    }
                  : {
                      color: colorToRGBA(
                        color?.secondaryAccent,
                        color?.opacity
                      ),
                    }
              }
              className={`${
                tab === "locations" ? "border-b-2 active" : ""
              } inline-block p-4 rounded-t-lg"`}
              onClick={() => router.push(`${companyid}/locations`)}
            >
              <FontAwesomeIcon
                icon={faLocationDot}
                className="h-4 mr-2 cursor-pointer"
              />
              Locations
            </button>
            <button
              type="button"
              style={
                tab === "integrations"
                  ? {
                      color: color?.primaryAccent,
                      borderColor: color?.primaryAccent,
                    }
                  : {
                      color: colorToRGBA(
                        color?.secondaryAccent,
                        color?.opacity
                      ),
                    }
              }
              className={`${
                tab === "integrations" ? "border-b-2 active" : ""
              } inline-block p-4 rounded-t-lg"`}
              onClick={() => router.push(`${companyid}/integrations`)}
            >
              <FontAwesomeIcon
                icon={faCogs}
                className="h-4 mr-2 cursor-pointer"
              />
              Integrations
            </button>
            <button
              type="button"
              style={
                tab === "jobs"
                  ? {
                      color: color?.primaryAccent,
                      borderColor: color?.primaryAccent,
                    }
                  : {
                      color: colorToRGBA(
                        color?.secondaryAccent,
                        color?.opacity
                      ),
                    }
              }
              className={`${
                tab === "jobs" ? "border-b-2 active" : ""
              } inline-block p-4 rounded-t-lg"`}
              onClick={() => router.push(`${companyid}/jobs`)}
            >
              <FontAwesomeIcon
                icon={faBriefcase}
                className="h-4 mr-2 cursor-pointer"
              />
              Jobs
            </button>
          </div>

          <div>
            {tab === "users" && (
              <Users
                companyid={companyid}
                setIsEdit={setIsEdit}
                isEdit={isEdit}
                error={error}
                setLocationId={setLocationId}
                setError={setError}
                color={color}
              />
            )}

            {/* locations */}
            {tab === "locations" && (
              <Locations
                companyid={companyid}
                setIsEdit={setIsEdit}
                isEdit={isEdit}
                color={color}
              />
            )}

            {/* integrations */}
            {tab === "integrations" && (
              <Integrations
                setError={setError}
                setIsEdit={setIsEdit}
                isEdit={isEdit}
                companyid={companyid}
                companyInfo={companyInfo}
                setCompanyInfo={setCompanyInfo}
                error={error}
                setShowAddCompanyModal={setShowAddCompanyModal}
                userForm={userForm}
                setUserForm={setUserForm}
                color={color}
              />
            )}

            {/* jobs */}
            {tab === "jobs" && <Jobs companyid={companyid} color={color} />}
          </div>

          <Modal
            open={showConfirmation}
            setOpen={setShowConfirmation}
            header="Confirmation"
          >
            <div className="flex flex-col gap-6 mt-4">
              <div className="text-md">
                Are you sure you want to{" "}
                {companyInfo && companyInfo.subscription_type === "full_service"
                  ? "Disable"
                  : "Enable"}{" "}
                full service plan for this company?
              </div>
              <div className="flex items-center justify-end">
                <div>
                  <ButtonWrapper
                    classNames="flex justify-center items-center rounded border border-transparent px-4 py-1 text-base font-medium shadow-sm hover:opacity-75 focus:outline-none mt-4"
                    onClick={FullServiceHandler}
                  >
                    {companyInfo &&
                    companyInfo.subscription_type === "full_service"
                      ? "Disable"
                      : "Enable"}
                  </ButtonWrapper>
                </div>
              </div>
            </div>
          </Modal>
          <Modal
            overflow={true}
            open={showAddCompanynModal}
            setOpen={setShowAddCompanyModal}
            isEdit={isEdit}
            setIsEdit={setIsEdit}
            header="Update Company"
          >
            <Company
              companyInfo={companyInfo}
              isFullServiceEnabled={
                companyForm?.subscription_type === "full_service" ? true : false
              }
              setCompanyInfo={setCompanyInfo}
              responseErrors={error}
              isEdit={isEdit}
              setIsEdit={setIsEdit}
              modal={true}
              companyForm={companyForm}
              setShowAddCompanyModal={setShowAddCompanyModal}
              setCompanyForm={setCompanyForm}
              userForm={userForm}
              setUserForm={setUserForm}
            />
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailPage;
