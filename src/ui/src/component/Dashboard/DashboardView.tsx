import Link from "next/link";
import {useRouter} from "next/router";
import {Key, useContext, useEffect, useState} from "react";
import {fetchJobs} from "../Job/JobServices";
import axios from "axios";
import _ from "lodash";
import { toast } from "react-toastify";
import Loader from "../Loader";
import DashboardHeader from "./DashboardNavbar";
import Pagination from "../Pagination";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faColumns,
    faFileContract,
    faPen,
    faPlus,
    faUsers,
    faClock,
  faLocationCrosshairs,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../Modal";
import {ImportJobs} from "./ImportJobs";
import StartDateButton from "../StartDateButton";
import TargetLabelPercentage from "../targetLabel/TargetLabelPercentage";
import CustomizationsData from "@/src/utils/CustomizationData";
import AppContext from "@/src/context/Context";
import {colorToRGBA} from "@/src/utils/misc";
import dynamic from "next/dynamic";

const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
    ssr: false,
});
// const { auth } = useContext(AuthContext);
const remoteType = [
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

export default function DashboardView() {
    let user: any = JSON.parse(localStorage.getItem("user")!);

    let companyid: any = user?.company_id ? user?.company_id : null;
    let candidate_scope: any = user?.company_details?.candidate_scope;
    let company_name = user?.company_details?.name;
    const {push} = useRouter();
    const [jobs, setJobs] = useState<any>("");
    const [loading, setLoading] = useState(false);
    const [isTargetLabelFormOpen, setIsTargetLabelFormOpen] =
        useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAllJobs, setShowAllJobs] = useState(true);
    const [perPagingNumber, setPerPagingNumber] = useState(50);
    const [pagingNumber, setPagingNumber] = useState(1);
    const [selectedTab, setSelectedTab] = useState("active"); // Track the active tab
    const [jobType, setJobType] = useState(localStorage.getItem("selectedTab") || "active");
    const [clickedJobId, setClickedJobId] = useState<string>("");
    const customizationsData: any = CustomizationsData[5].data;
    const {color, selectLangauge} = useContext(AppContext);
    const [buttonEnable, setButtonEnable] = useState(false);
    const [items, setItems] = useState<any>();
    const [expandedCity, setExpandedCity] = useState<string | null>(null);
    const [cityPage, setCityPage] = useState<{ [city: string]: number }>({});

    useEffect(() => {
        if(company_name === "Imprimis Group" || company_name === "BravoTech"){
            setButtonEnable(true);
        }
        else{
            setButtonEnable(false);
        }
        getJobPostings();
    }, [perPagingNumber, pagingNumber, jobType]);

    const formatDateNew = (created_at: any) => {
        const months = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
    
        const date = new Date(created_at);
        const day = date.getDate();
        const month = months[date.getMonth()].substring(0, 3);
        const year = date.getFullYear().toString().substring(2);
    
        return `${day} ${month}'${year}`;
      };

    useEffect(() => {
        const storedTab = localStorage.getItem("selectedTab");
        if (storedTab) {
            setSelectedTab(storedTab);
            if (storedTab === "inactive") {
                localStorage.setItem("selectedTab", "inactive");
                fetchActiveJobs();
            } else if (storedTab === "active") {
                localStorage.setItem("selectedTab", "active");
                fetchInactiveJobs();
            }else if(storedTab === "fullService"){
                localStorage.setItem("selectedTab","fullService");
                fetchFullServiceJobs();
            }
        }
    }, []);


    // Group jobs by city
    const groupJobsByCity = (jobs: any) => {
        const grouped: { [city: string]: any[] } = {};
        jobs?.job_postings?.forEach((job: any) => {
            const city = job.city || "Unknown";
            if (!grouped[city]) {
                grouped[city] = [];
            }
            grouped[city].push(job);
        });
        return grouped;
    };

    const toggleAccordion = (city: string) => {
        setExpandedCity(expandedCity === city ? null : city);
    };

    const groupedJobs = groupJobsByCity(jobs);

    const handlePageChange = (city: string, newPage: number) => {
        setCityPage((prev) => ({...prev, [city]: newPage}));
    };

    const getJobPostings = async (): Promise<void> => {
        setLoading(true);
        try {
            const jobsList = await fetchJobs(jobType, perPagingNumber, pagingNumber);
            if (jobsList && jobsList.response && jobsList.response.status === 401) {
                push("/signin");
                setLoading(false);
            } else if (jobsList && Object.values(jobsList).length >= 0) {
                setLoading(false);
                setJobs(jobsList);
            } else {
                setJobs([]);
            }
            setLoading(false);
        } catch (error) {
        }
      };

    const fetchInactiveJobs = () => {
        setShowAllJobs(true);
        setJobType("active");
        localStorage.setItem("selectedTab", "active");
        setPagingNumber(1);
        setPerPagingNumber(50);
    };

    const fetchActiveJobs = () => {
        setShowAllJobs(false);
        setJobType("inactive");
        localStorage.setItem("selectedTab", "inactive");
        setPagingNumber(1);
        setPerPagingNumber(50);
    };

    const fetchFullServiceJobs = () => {
        setJobType("fullService");
        localStorage.setItem("selectedTab","fullService");
        setPagingNumber(1);
        setPerPagingNumber(50);
    }
    const PerPageNumberChange = (perPageNumber: any) => {
        setPerPagingNumber(perPageNumber);
    };

    const PageNumberChange = (pageNumber: any) => {
        setPagingNumber(pageNumber);
    };

    return (
      
            <div className="min-h-screen">
                <div className="h-16">
                    <DashboardHeader companyName={jobs.length ? jobs[0].companyName : ""}/>
                </div>
                <Modal
                    open={isModalOpen}
                    setOpen={setIsModalOpen}
                    header="Import Jobs"
                    section="Import Jobs"
                >
                    <ImportJobs setIsModalOpen={setIsModalOpen}/>
                </Modal>
                <Modal
                    open={isTargetLabelFormOpen}
                    setOpen={setIsTargetLabelFormOpen}
                    header="Target Label Weightage"
                >
                    <TargetLabelPercentage
                        jobId={clickedJobId}
                        openModal={setIsTargetLabelFormOpen}
                        color={color}
                    />
                </Modal>
                <div
                    style={{
                        backgroundColor: color?.outerBg,
                        color: color?.secondaryAccent,
                    }}
                    className="flex flex-col gap-4 w-full pl-2 pr-2 md:px-6 grow"
                >
                    <div
                        style={{
                            backgroundColor: color?.innerBg,
                        }}
                        className="flex flex-col w-full border my-6 px-2 relative min-h-screen"
                    >
                        <div className="flex items-center py-2 w-full justify-between">
                            {/* <div className="text-lg px-2 font-bold"> Job Postings </div> */}
                            <div
                                style={{
                                    borderColor: colorToRGBA(
                                        color?.secondaryAccent,
                                        color?.opacity
                                    ),
                                }}
                                className="text-sm font-medium text-center"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedTab("active"); // Set active tab
                                        fetchInactiveJobs(); // Call the relevant function
                                    }}
                                    style={{
                                        color:
                                            showAllJobs && selectedTab === "active"
                                                ? color?.primaryAccent
                                                : color?.secondaryAccent,
                                        borderColor:
                                            showAllJobs && selectedTab === "active"
                                                ? color?.primaryAccent
                                                : "transparent",
                                    }}
                                    className={`${
                                        selectedTab === "active" ? "active" : ""
                                    } inline-block p-3 border-b-4 border-transparent rounded-t-lg`}
                                >
                                    Active Jobs
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedTab("inactive"); // Set inactive tab
                                        fetchActiveJobs(); // Call the relevant function
                                    }}
                                    style={{
                                        color:
                                            !showAllJobs && selectedTab === "inactive"
                                                ? color?.primaryAccent
                                                : color?.secondaryAccent,
                                        borderColor:
                                            !showAllJobs && selectedTab === "inactive"
                                                ? color?.primaryAccent
                                                : "transparent",
                                    }}
                                    className={`${
                                        selectedTab === "inactive" ? "active" : ""
                                    } inline-block p-3 border-b-4 border-transparent rounded-t-lg`}
                                >
                                    Inactive Jobs
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedTab("fullService"); // Set full-service tab
                                        fetchFullServiceJobs();
                                    }}
                                    style={{
                                        color:
                                            selectedTab === "fullService"
                                                ? color?.primaryAccent
                                                : color?.secondaryAccent,
                                        borderColor:
                                            selectedTab === "fullService"
                                                ? color?.primaryAccent
                                                : "transparent",
                                    }}
                                    className={`${
                                        selectedTab === "fullService" ? "active" : ""
                                    } inline-block p-3 border-b-4 border-transparent rounded-t-lg`}
                                >
                                    Full Service Portal
                                </button>
                                <div className="relative inline-block">
                                    <button
                                        disabled={true}
                                        onClick={() => {
                                            setSelectedTab("workforce"); // Set full-service tab
                                        }}
                                        style={{
                                            color:
                                                selectedTab === "workforce"
                                                    ? color?.primaryAccent
                                                    : color?.secondaryAccent,
                                            borderColor:
                                                selectedTab === "workforce"
                                                    ? color?.primaryAccent
                                                    : "transparent",
                                        }}
                                        className={`${
                                            selectedTab === "workforce" ? "active" : ""
                                        } inline-block p-3 border-b-4 border-transparent rounded-t-lg`}
                                    >
                                        Workforce Planning
                                    </button>
                                    <span
                                        className="absolute top-10 right-2 text-[#006251] text-[6px] font-semibold px-2 py-1"
                                        style={{transform: "translateY(-50%)"}}
                                    >
                                    Coming Soon
                                  </span>
                                </div>

                            </div>
                            <div className="flex">
                                <div className="flex justify-between content-center mr-2">
                                <StartDateButton
                                    isDisabled={buttonEnable ? false : true}
                                    action={() => setIsModalOpen(true)}
                                    btnLabel={customizationsData.btnSecondaryText}
                                    icon={faPlus}
                                />
                                </div>

                                <div className="flex justify-between content-center mr-2">
                                    <Link href="/job/create">
                                        <ButtonWrapper
                                            classNames="px-5 py-2 rounded flex gap-2 items-center justify-center">
                                            <FontAwesomeIcon icon={faPlus}/>
                                            {customizationsData.btnPrimaryText}
                                        </ButtonWrapper>
                                    </Link>
                                </div>
                            </div>
                        </div>
                        {loading && (
                            <div className="flex items-center justify-center h-screen w-100">
                                <Loader loaderMessage={"Loading " + jobType + " Jobs..."}/>
                            </div>
                        )}
                        {jobType === 'fullService' && !loading && 
                        (
                                 <>
                                     
                                       <div className="px-2">
                                         {jobs &&
                                           jobs.job_postings.map((job: any, key: any) => (
                                             <div
                                               key={key}
                                               className={`grid grid-cols-12 items-center w-full h-14 justify-between p-1 border-b min-w-[800px]`}
                                             >
                                               <div className="col-span-2 flex flex-col p-2 truncate">
                                        
                                                   <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                                                   <Link
                                                     href={`/company/${job.company_id}/kanban/${job.id}`}
                                                     passHref
                                                   >
                                                     {job.title}
                                                     </Link>
                                                   </div>
                                                
                                               </div>
                                               <div className="col-span-1 xl:col-span-2 flex flex-col p-2 truncate">
                                                 <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                                                   {job.company_name}
                                                 </div>
                                               </div>
                                               <div className="flex items-center">
                                                 <FontAwesomeIcon
                                                   icon={faLocationCrosshairs}
                                                   style={{
                                                     color: colorToRGBA(
                                                       color?.primaryAccent,
                                                       color?.opacity
                                                     ),
                                                   }}
                                                   className="mr-1"
                                                 />
                                                 <div className="max-w-[5vw] min-w-[5vw] truncate text-sm">
                                                   {job.city ? job.city + ", " : ""}
                                                   {job.state ? job.state : ""}
                                                   {job.country ? ", " + job.country : ""}
                                                 </div>
                                                 
                                               </div>
                                               <div className="flex justify-start items-center text-left">
                                                 <FontAwesomeIcon
                                                   icon={faClock}
                                                   style={{
                                                     color: colorToRGBA(
                                                       color?.primaryAccent,
                                                       color?.opacity
                                                     ),
                                                   }}
                                                   className="mr-1"
                                                 />
                                                 <div className="w-32 truncate text-sm lowercase">
                                                   {job.work_location_type}
                                                   {job.work_location_type === "remote" &&
                                                     `(${
                                                       remoteType.find(
                                                         (type: any) => type.option === job.remote_type
                                                       )?.value
                                                     })`}
                                                 </div>
                                               </div>
                                               <div className="ml-3 col-span-2 xl:col-span-1 text-sm">
                                                 $
                                                 {Math.abs(job.compensation) > 999
                                                   ? Math.sign(job.compensation) *
                                                       Number(
                                                         (Math.abs(job.compensation) / 1000).toFixed(1)
                                                       ) +
                                                     "k"
                                                   : Math.sign(job.compensation) *
                                                     Math.abs(job.compensation)}{" "}
                                                 / year
                                               </div>
                                               <div className="flex justify-center">
                                                    <div
                                                        style={{
                                                        backgroundColor: colorToRGBA(
                                                            color?.primaryAccent,
                                                            0.2
                                                        ),
                                                        color: color?.primaryAccent,
                                                        }}
                                                        className="flex items-center justify-center p-2 h-7 rounded-xl text-xs"
                                                    >
                                                        {job.source}
                                                    </div>
                                                </div>
                                               <div className="col-span-1 flex justify-end -space-x-2 overflow-hidden">
                                                 {job &&
                                                   job.top_profile_pictures?.map(
                                                     (picture: any, index: Key) => (
                                                       <img
                                                         key={index}
                                                         className="inline-block h-7 w-7 xl:h-8 xl:w-8 rounded-full ring-2"
                                                         src={picture}
                                                         alt=""
                                                       />
                                                     )
                                                   )}
                                               </div>
                                               <div className="col-span-2 font-thin flex justify-center">
                                                 <div className="w-100 text-sm">
                                                   Posted on{" "}
                                                   <span className="font-normal">
                                                     {job?.created_at && formatDateNew(job.created_at)}
                                                   </span>
                                                 </div>
                                               </div>
                                               <div className="w-full flex justify-end pr-1">
                                                 
                                                   <Link
                                                     href={`/company/${job.company_id}/kanban/${job.id}`}
                                                     style={{
                                                       backgroundColor: colorToRGBA(
                                                         color?.primaryAccent,
                                                         0.2
                                                       ),
                                                       color: color?.primaryAccent,
                                                     }}
                                                     className="cursor-pointer mr-2 col-span-1 flex items-center justify-center hover:opacity-75 h-8 w-8"
                                                     passHref
                                                   >
                                                     <FontAwesomeIcon
                                                       icon={faColumns}
                                                       className="h-4 w-4 cursor-pointer"
                                                     />
                                                   </Link>
            
                                                 <Link
                                                   href={`/job/${job.id}`}
                                                   style={{
                                                     backgroundColor: colorToRGBA(
                                                       color?.primaryAccent,
                                                       0.2
                                                     ),
                                                     color: color?.primaryAccent,
                                                   }}
                                                   className="cursor-pointer col-span-1 flex items-center justify-center hover:opacity-75 h-8 w-8"
                                                   passHref
                                                 >
                                                   <FontAwesomeIcon
                                                     icon={faPen}
                                                     className="h-4 w-4 cursor-pointer"
                                                   />
                                                 </Link>
                                               </div>
                                             </div>
                                           ))}
                                           {jobs?.job_postings?.length == 0 && (
                                                <div
                                                style={{ color: color?.primaryAccent }}
                                                className="h-[80vh] flex items-center justify-center font-bold"
                                                >
                                                No full service jobs available
                                                </div>
                                            )}
                                       </div>
                                     {!loading && jobs?.job_postings && jobs?.total_count > 50 && (
                                       <div className="mt-4">
                                         <Pagination
                                           setCurrentPage={jobs?.current_page}
                                           totalItems={jobs?.total_count}
                                           currentPage={jobs?.current_page}
                                           itemsPerPage={jobs?.per_page}
                                           totalPages={jobs?.total_pages}
                                           PageNumberChange={PageNumberChange}
                                           PerPageNumberChange={PerPageNumberChange}
                                           setPerPagingNumber={setPerPagingNumber}
                                           perPagingNumber={perPagingNumber}
                                           setPageNumber={setPagingNumber}
                                         />
                                       </div>
                                     )}
                                     </>
                        )}
                        {jobType!=='fullService' &&
                                (!loading && groupedJobs && Object.keys(groupedJobs).length > 0 ? (
                            <div className="overflow-x-auto">
                                {Object.keys(groupedJobs).map((city) => (
                                    <div
                                        key={city}
                                        className="mb-4 border border-gray-300 rounded-md"
                                    >
                                        {/* Accordion Header */}
                                        <div
                                            className="p-3 bg-gray-100 flex justify-between items-center cursor-pointer"
                                            onClick={() => toggleAccordion(city)}
                                        >
                                            <h2
                                                className="font-semibold text-lg"
                                                style={{color: color?.secondaryAccent}}
                                            >
                                                {city} ({groupedJobs[city].length} {groupedJobs[city].length === 1 ? 'job' : 'jobs'})
                                            </h2>
                                            <span>{expandedCity === city ? "-" : "+"}</span>
                                        </div>

                                        {/* Accordion Content */}
                                        {expandedCity === city && (
                                            <div className="p-4">
                                                {groupedJobs[city].map((job: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        style={{color: color?.secondaryAccent}}
                                                        className="grid grid-cols-12 items-center w-full h-14 justify-between p-1 border-b min-w-[800px]"
                                                    >
                                                        <div className="col-span-2 flex flex-col p-2 truncate">
                                                                    <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                                                                    {job.title}
                                                                    </div>
                                                        </div>

                                                        <div
                                                            className="col-span-6 gap-3 items-center grid grid-cols-12">
                                                            <div className="col-span-5 flex items-center">
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
                                                                <div className="truncate text-sm">
                                                                    {job.city ? job.city + ", " : ""}
                                                                    {job.state ? job.state : ""}
                                                                    {job.country ? ", " + job.country : ""}
                                                                </div>
                                                            </div>
                                                            <div className="col-span-4 flex items-center justify-start">
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
                                                                <div className="w-100 text-sm">
                                                                    {job?.work_location_type?.replace(
                                                                        /^[a-z]/i,
                                                                        (str: string) => str.toUpperCase()
                                                                    )}
                                                                    {job.work_location_type === "remote" &&
                                                                        ` (${
                                                                            remoteType.find(
                                                                                (type) => type.option === job.remote_type
                                                                            )?.value
                                                                        })`}
                                                                </div>
                                                            </div>
                                                            <div className="col-span-3 flex">
                                                                <div className="ml-4 text-sm">
                                <span className="text-sm">
                                  {" "}
                                    {Math.abs(job.compensation) > 999
                                        ? Math.sign(job.compensation) *
                                        Number(
                                            (
                                                Math.abs(job.compensation) / 1000
                                            ).toFixed(1)
                                        ) +
                                        "k"
                                        : Math.sign(job.compensation) *
                                        Math.abs(job.compensation)}{" "}
                                </span>
                                                                    USD / year
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-span-2 flex justify-center -space-x-2 overflow-hidden">
                                                            {job &&
                                                                job.top_profile_pictures?.map(
                                                                    (picture: any, index: Key) => (
                                                                        <img
                                                                            key={index}
                                                                            className="inline-block h-8 w-8 rounded-full ring-2"
                                                                            src={picture}
                                                                            alt="profile"
                                                                        />
                                                                    )
                                                                )}
                                                        </div>
                                                        <div
                                                            style={{color: color?.primaryAccent}}
                                                            className="flex justify-end pr-1 gap-2"
                                                        >
                                                            <div
                                                                style={{
                                                                    backgroundColor: colorToRGBA(color?.primaryAccent, 0.2),
                                                                }}
                                                                className="cursor-pointer col-span-1 flex items-center justify-center px-2 py-1.5 rounded-md"
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={faFileContract}
                                                                    onClick={() => {
                                                                        setIsTargetLabelFormOpen(true);
                                                                        setClickedJobId(job.id);
                                                                    }}
                                                                />
                                                            </div>
                                                            {job.subscription_type === "full_service" ? (
                                                                <Link
                                                                    href={`/company/${companyid}/kanban/${job.id}`}
                                                                    style={{
                                                                        backgroundColor: colorToRGBA(color?.primaryAccent, 0.2),
                                                                    }}
                                                                    className="cursor-pointer col-span-1 flex items-center justify-center px-2 py-1.5 rounded-md"
                                                                >
                                                                    <FontAwesomeIcon icon={faColumns}/>
                                                                </Link>
                                                            ) : (
                                                                <Link
                                                                    href={`/job/detail/${job.id}`}
                                                                    style={{
                                                                        backgroundColor: colorToRGBA(color?.primaryAccent, 0.2),
                                                                    }}
                                                                    className="cursor-pointer col-span-1 flex items-center justify-center px-2 py-1.5 rounded-md"
                                                                >
                                                                    <FontAwesomeIcon icon={faUsers}
                                                                                     className="h-4 w-4"/>
                                                                </Link>
                                                            )}
                                                            <Link
                                                                href={`/job/${job.id}`}
                                                                style={{
                                                                    backgroundColor: colorToRGBA(color?.primaryAccent, 0.2),
                                                                }}
                                                                className="cursor-pointer col-span-1 flex items-center justify-center hover:opacity-80 px-2 rounded-md py-1.5"
                                                            >
                                                                <FontAwesomeIcon icon={faPen}/>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Pagination */}
                                                {groupedJobs[city].length > 50 && <Pagination
                                                    setCurrentPage={jobs?.current_page}
                                                    totalItems={groupedJobs[city].length}
                                                    currentPage={jobs?.current_page}
                                                    itemsPerPage={jobs?.per_page}
                                                    totalPages={Math.ceil(
                                                        groupedJobs[city].length / jobs?.per_page
                                                    )}
                                                    PageNumberChange={PageNumberChange}
                                                    PerPageNumberChange={PerPageNumberChange}
                                                    setPerPagingNumber={setPerPagingNumber}
                                                    perPagingNumber={perPagingNumber}
                                                    setPageNumber={setPagingNumber}
                                                />}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {!loading && jobs?.job_postings && jobs?.total_count > 50 && (
                                       <div className="mt-4">
                                         <Pagination
                                           setCurrentPage={jobs?.current_page}
                                           totalItems={jobs?.total_count}
                                           currentPage={jobs?.current_page}
                                           itemsPerPage={jobs?.per_page}
                                           totalPages={jobs?.total_pages}
                                           PageNumberChange={PageNumberChange}
                                           PerPageNumberChange={PerPageNumberChange}
                                           setPerPagingNumber={setPerPagingNumber}
                                           perPagingNumber={perPagingNumber}
                                           setPageNumber={setPagingNumber}
                                         />
                                       </div>
                                )}
                            </div>
                        ) : (
                            !loading && (
                                <div
                                style={{ color: color?.primaryAccent }}
                                className="h-[80vh] flex items-center justify-center font-bold"
                                >
                                No {jobType} jobs available
                                </div>
                            )
                        ))}
                        
                    </div>
                </div>
            </div>
    );
}