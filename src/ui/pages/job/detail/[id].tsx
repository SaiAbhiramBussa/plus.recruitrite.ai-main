import { Key, useContext, useEffect, useState } from "react";
import Breadcrumbs from "@/src/component/BreadCrumbs";
import Modal from "@/src/component/Modal";
import { useRouter } from "next/router";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import ProfileCard from "@/src/component/ProfileCard";
import Loader from "@/src/component/Loader";
import Pagination from "@/src/component/Pagination";
import {
  faCloudDownload,
  faColumns,
  faDownload,
  faEye,
  faMultiply,
  faRotateRight,
  faShare,
  faUpload,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AuthGuard from "@/src/component/AuthGuard";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BlogSection from "@/src/component/BlogSection";
import axios from "axios";
import _, { join, pick } from "lodash";
import Link from "next/link";
import ShareUrlComponent from "@/src/component/ShareUrlComponent";
import CandidateDetailModal from "@/src/component/CandidateDetailModal";
import StartDateButton from "@/src/component/StartDateButton";
import FileUpload from "@/src/component/FIleUpload";
import OtherCandidates from "@/src/component/OtherCandidates";
import { getOtherCandidate, postOtherCandidate } from "@/src/services/job";
import Select from "react-select";
import { Option } from "@/src/common/common.comp";
import AppContext from "@/src/context/Context";
import dynamic from "next/dynamic";
import { showSuccessToast } from "@/src/common/common.util";
import { getCandidatesForJobs } from "@/src/services/common.service";

const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

type Props = {
  email?: string;
  password?: string | number;
  showPreview?: boolean;
  showDetail?: boolean;
  prevState: null;
  skills?: any;
  data?: any;
};
const JobDetailPage = (props: Props) => {
  const { selectLangauge, setScreeningCredits } = useContext(AppContext);

  let user: any = JSON.parse(localStorage.getItem("user")!);
  let companyid: any = user?.company_id ? user.company_id : null;
  let companyDetails: { candidate_scope: string; minimum_reveals: number } =
    user?.company_details ? user.company_details : null;
  const router = useRouter();
  const { asPath } = router;
  const { id, candidate_id } = router.query;
  const [data, setData] = useState<Props | any>();
  const [pagingNumber, setPagingNumber] = useState(1);
  const [perPagingNumber, setPerPagingNumber] = useState(50);
  const [otherPagingNumber, setOtherPagingNumber] = useState(1);
  const [otherPerPagingNumber, setOtherPerPagingNumber] = useState(50);
  const [recommendedCandidates, setRecommendedCandidates] = useState<any>([]);
  const [subrecommendedCandidates, setSubRecommendedCandidates] = useState<any>([]);
  const [otherCandidates, setOtherCandidates] = useState<any>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Array<any>>([]);
  const [isShareLinkModalOpen, setIsShareLinkModalOpen] =
    useState<boolean>(false);
  const [plansModal, setPlanModal] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [recommendedCandidatesData, setRecommendedCandidatesData] =
    useState<any>({});
  const [subrecommendedCandidatesData, setSubRecommendedCandidatesData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [otherLoading, setOtherLoading] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState<any>("");
  const [buttonList, setButtonList] = useState<Array<any>>([]);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [isImportCandidateModalOpen, setIsImportCandidateModalOpen] =
    useState<boolean>(false);
  const [isCandidateUploading, setIsCandidateUploading] =
    useState<boolean>(false);
  const [tabName, setTabName] = useState<string>("Other Candidates");
  const [candidateCsvFile, setCandidateCsvFile] = useState<any>();
  const [candidateData, setCandidateData] = useState<any>();
  const [selectedAction, setSelectedAction] = useState<string>("");
  const { color, colors } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [candidates, setCandidates] = useState<number>(1);

  useEffect(() => {
    const user: any = localStorage.getItem("user");
    setRole(JSON.parse(user).role);
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchJobPostingData(id);
  }, [id]);

  useEffect(() => {
    const fetchData = () => {
      fetchCandidates(pagingNumber, perPagingNumber);
    };
    fetchData();
  }, [id, pagingNumber, perPagingNumber, tabName]);

  useEffect(() => {
    const fetchData = () => {
      if(id){
      fetchOtherCandidates(otherPagingNumber, otherPerPagingNumber);}
    };
    fetchData();
  }, [id, otherPagingNumber, otherPerPagingNumber]);

  useEffect(() => {
   
        const fetchData = () => {
          fetchCandidates(pagingNumber, perPagingNumber);
        };

        const interval = setInterval(() => {
          if (status !== "success") fetchData();
          if(tabName === 'Other Candidates'){
            if (status === "success" || recommendedCandidates.length > 0) {
              clearInterval(interval);
            }
          }
          if(tabName === 'Recommended Candidates'){
            if (status === "success" || subrecommendedCandidates.length > 0) {
              clearInterval(interval);
            }
          }

        }, 30000);

        return () => {
          clearInterval(interval);
        };
    
  }, [status]);

  const refreshButtonHandler = () => {
    fetchCandidates(pagingNumber, perPagingNumber);
    // fetchOtherCandidates(otherPagingNumber, otherPerPagingNumber);
  };

  useEffect(() => {
    if (candidate_id && _.size(recommendedCandidates)) {
      let hasCandidateId = _.find(
        recommendedCandidates,
        (recommendedCandidate) => {
          return recommendedCandidate.candidate_id == candidate_id;
        }
      );
      if (!hasCandidateId) fetchCandidateDetails();
    }
  }, [candidate_id, recommendedCandidates]);

  useEffect(() => {
    if (candidate_id && _.size(subrecommendedCandidates)) {
      let hasCandidateId = _.find(
        subrecommendedCandidates,
        (recommendedCandidate) => {
          return recommendedCandidate.candidate_id == candidate_id;
        }
      );
      if (!hasCandidateId) fetchCandidateDetails();
    }
  }, [candidate_id, subrecommendedCandidates]);

  const downloadCandidates = async () => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/recommended/${id}/download`,
      {
        withCredentials: true,
      }
    );

    if (response.status === 200) {
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${id}-${Date.now()}.csv`; // Default filename
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "text/csv",
        })
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.log("Something went wrong!");
    }
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setCandidates(1); 
  };

  const shareCandidate = async () => {
    if (!selectedCandidates.length) {
      toast.error("Please select candidates to share");
      return;
    }
    try {
      setButtonDisableOnLabel("Share", true);
      await axios
        .post(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/shareable/candidates/`,
          { job_posting_id: id, candidates_ids: selectedCandidates },
          {
            withCredentials: true,
          }
        )
        .then((res) => {
          setIsShareLinkModalOpen(true);
          setShareUrl(res.data?.url);
          toast.success("Shareable link generated", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
        });
    } catch (err: any) {
      toast.error(
        `error ${err?.message ? err?.message : "Something went wrong"}`,
        {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 10000,
          hideProgressBar: true,
        }
      );
    } finally {
      setButtonDisableOnLabel("Share", false);
    }
  };

  const handleSubmit = async(type: string) => {
    const urlWithoutParams = new URL(asPath, window.location.origin).pathname;
    const job_id = urlWithoutParams.split("job/detail/")[1];
    const selectedJobs = job_id
        if (selectedJobs) {
          const response = await getCandidatesForJobs({job_ids: [selectedJobs], candidates: candidates})
          if(response?.status){
            toast.success("Request sent successfully!")
            handleModalClose();
          }
        } else {
          toast.error("Please select a job before submitting.");
        }
      };

  const openAIResult = async () => {
    try {
      let payload = {
        job_posting_id: id,
      };
      setButtonDisableOnLabel("ChatGPT Result", true);
      let res: any = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/candidate_openai_push`,
        payload,
        {
          withCredentials: true,
        }
      );
      if (res.status === 200) {
        toast.success(res.data?.Message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        return res;
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message
          ? err.response?.data?.message
          : err.response?.data?.error,
        {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        }
      );
    } finally {
      setButtonDisableOnLabel("ChatGPT Result", false);
    }
  };

  const revealCandidate = async (recommendedCandidates: any) => {
    let unRevealedCandidates = recommendedCandidates
      .filter((candidate: any) => !candidate.is_revealed)
      .map((filterCandidate: any) => filterCandidate.candidate_id);
    if (unRevealedCandidates?.length > companyDetails?.minimum_reveals) {
      unRevealedCandidates = unRevealedCandidates.slice(
        0,
        companyDetails.minimum_reveals
      );
    }
    if (!unRevealedCandidates?.length) {
      toast.error("No candidates to reveal", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
      return;
    }
    try {
      setLoading(true);
      setButtonDisableOnLabel("Reveal", true);
      await axios
        .post(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/subscriptions/reveal_more_candidate/`,
          {
            job_posting_candidate_ids: unRevealedCandidates,
            job_posting_id: id,
          },
          {
            withCredentials: true,
          }
        )
        .then((res) => {
          setLoading(false);
          let user = JSON.parse(localStorage.getItem("user")!) || {};
          user.reveals_left = res.data.reveals_left;
          // user.reveals_left = res.data.reveals_left;
          setScreeningCredits(res.data.reveals_left);
          localStorage.setItem("user", JSON.stringify(user));
          toast.success("Candidates Revealed", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
          refreshButtonHandler();
        });
    } catch (err: any) {
      setLoading(false);
      if (err.response.status == 403) {
        setPlanModal(true);
      } else {
        toast.error(
          `${
            err?.response?.data?.Error
              ? err?.response?.data?.Error
              : err.message
          }`,
          {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 10000,
            hideProgressBar: true,
          }
        );
      }
    } finally {
      setButtonDisableOnLabel("Reveal", false);
    }
  };

  const selectCandidate = (candidateId: string) => {
    let updatedCandidateList = selectedCandidates;
    updatedCandidateList.push(candidateId);
    setSelectedCandidates([...updatedCandidateList]);
  };

  const removeCandidate = (candidateId: string) => {
    let updatedCandidateList = selectedCandidates;
    updatedCandidateList = updatedCandidateList.filter(
      (candidate) => candidate != candidateId
    );
    setSelectedCandidates([...updatedCandidateList]);
  };

  const fetchJobPostingData = async (id: any) => {
    setLoading(true);
    try {
      let res = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/${id}`,
        {
          withCredentials: true,
        }
      );
      let resData = res.data;
      if (resData.subscription_type === "full_service") {
        router.push(`/company/${companyid}/kanban/${id}`);
      }
      const attributesToJoin = ["city", "state", "country"];
      const separator = ", ";
      const pickedAttributes = pick(resData, attributesToJoin);
      const joinedString = join(Object.values(pickedAttributes), separator);
      resData.jobLocation = joinedString;
      setData(resData);
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const uploadCSVFile = async () => {
    if (!candidateCsvFile) return;

    let payload = new FormData();
    payload.append("other_candidates", candidateCsvFile);
    setIsCandidateUploading(true);

    await postOtherCandidate(payload, id)
      .then((response) => {
        if (response.success) {
          let data = response.data?.data;

          showSuccessToast(
            "Candidates Pushed to ML Screening Queue! Please wait for a while.",
            !data?.queued ? "error" : data?.failed ? "warning" : undefined
          );
        }
      })
      .finally(() => {
        setIsCandidateUploading(false);
        setIsImportCandidateModalOpen(false);
      });

    setCandidateCsvFile(null);
  };

  const fetchOtherCandidates = async (
    pagingNumber: any,
    perPagingNumber: number
  ) => {
    setOtherLoading(true);
    await getOtherCandidate(pagingNumber, perPagingNumber, id)
      .then((result: any) => {
        if (result.data) {
          result.data["candidates"] = result.data?.candidates?.map(
            (candidate: any) => {
              candidate.picture = candidate.picture
                ? candidate.picture
                : `https://startdate-images-1.s3.us-west-1.amazonaws.com/startdate-avatar/${
                    Math.floor(Math.random() * 6) + 1
                  }.png`;
              return candidate;
            }
          );
        }
        setOtherCandidates(result.data);
      })
      .finally(() => setOtherLoading(false));
  };

  const fetchCandidates = async (
    pagingNumber: any,
    perPagingNumber: number
  ) => {
    setLoading(true);
    try {
      setButtonDisableOnLabel("Refresh", true);
      if (id) {
        const result: any = await axios.get(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/recommended/${id}?page=${pagingNumber}&per_page=${perPagingNumber}&candidate_type=${tabName}`,
          {
            withCredentials: true,
          }
        );
        if (result) {
          setStatus(result?.data?.status);
          setStatusMsg(result?.data?.message);
          result.data["candidates"] = result.data?.candidates?.map(
            (candidate: any) => {
              candidate.picture = candidate.picture
                ? candidate.picture
                : `https://startdate-images-1.s3.us-west-1.amazonaws.com/startdate-avatar/${
                    Math.floor(Math.random() * 6) + 1
                  }.png`;
              return candidate;
            }
          );
          if(tabName == 'Other Candidates'){
          setRecommendedCandidates(result?.data["candidates"]);
          setRecommendedCandidatesData(result?.data);
          }
          else if(tabName == 'Recommended Candidates'){
          setSubRecommendedCandidates(result?.data["candidates"]);
          setSubRecommendedCandidatesData(result?.data);
          }

        }
      }
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
      setButtonDisableOnLabel("Refresh", false);
    }
  };

  const fetchCandidateDetails = async () => {
    setLoading(true);
    try {
      let res = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/recommended/${id}/candidate/${candidate_id}`,
        {
          withCredentials: true,
        }
      );
      if (res.data) {
        setLoading(false);
        setShowDetail(true);
        setCandidateData(res?.data);
      }
    } catch (err: any) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const navigateSubscriptionAI = () =>{
    setIsModalOpen(true); 
  };
  
  const navigateFullService = () =>{
    router.push("/profile/plans/full_service")
  };

  const PerPageNumberChange = (perPageNumber: any) => {
    setPerPagingNumber(perPageNumber);
  };

  const PageNumberChange = (pageNumber: any) => {
    setPagingNumber(pageNumber);
  };

  const OtherPerPageNumberChange = (perPageNumber: any) => {
    setOtherPerPagingNumber(perPageNumber);
  };

  const OtherPageNumberChange = (pageNumber: any) => {
    setOtherPagingNumber(pageNumber);
  };

  const showFullData = (candidate: any) => {
    if(tabName === 'Other Candidates'){
    if (
      recommendedCandidates.some(
        (rC: any) => rC.candidate_id == candidate.candidate_id
      )
    ) {
      let index: number = recommendedCandidates.findIndex(
        (rC: any) => rC.candidate_id == candidate.candidate_id
      );
      const newRecommendedCandidates = [...recommendedCandidates];
      newRecommendedCandidates.splice(index, 1, candidate);
      setRecommendedCandidates(newRecommendedCandidates);
    }
  }
  else if(tabName === 'Recommended Candidates'){
    if (
      subrecommendedCandidates.some(
        (rC: any) => rC.candidate_id == candidate.candidate_id
      )
    ) {
      let index: number = subrecommendedCandidates.findIndex(
        (rC: any) => rC.candidate_id == candidate.candidate_id
      );
      const newRecommendedCandidates = [...subrecommendedCandidates];
      newRecommendedCandidates.splice(index, 1, candidate);
      setSubRecommendedCandidates(newRecommendedCandidates);
    }
  }
  };

  let options: any = [
    {
      action: refreshButtonHandler,
      label: `Refresh`,
      icon: faRotateRight,
      isDisabled: false,
      value: "refresh",
    },
    {
      action: shareCandidate,
      label: `Share`,
      icon: faShare,
      isDisabled: !selectedCandidates.length,
      value: "share",
    },
    {
      action: downloadCandidates,
      label: `Download Candidates`,
      icon: faCloudDownload,
      value: "downloadUnmasked",
    },
    {
      action: navigateSubscriptionAI,
      label: `Subscription AI Hiring`,
      icon: faEye,
      value: "navigateSubscriptionAI",
    },
    {
      action: navigateFullService,
      label: `FullService Recruiting`,
      icon: faColumns,
      value: "fullServiceRecruiting",
    }
  ];

  if (companyDetails?.candidate_scope != "self") {
    options = [
      ...options,
      {
        action: openAIResult,
        label: `ChatGPT Result`,
        icon: faDownload,
        isDisabled: false,
        value: "gptResult",
      },
      {
        action: () => setIsImportCandidateModalOpen(true),
        label: `Other Candidates`,
        icon: faUpload,
        isDisabled: false,
        value: "other_candidates",
      },
    ];
  } else {
    options = [
      ...options,
      {
        action: (param1:any) => revealCandidate(param1),
        label: "Reveal",
        icon: faEye,
        isDisabled: false,
        value: "reveal",
      },
    ];
  }
  useEffect(() => {
    setButtonList([...options]);
  }, []);

  useEffect(() => {
    setButtonDisableOnLabel("Share", !selectedCandidates.length);
  }, [selectedCandidates]);


  useEffect(() => {
    setButtonDisableOnLabel("Reveal", tabName === "Recommended Candidates");
  }, [tabName]);


  const setButtonDisableOnLabel = (label: string, isDisabled: boolean) => {
    let newButtonList = _.map(options, (button: any) => {
      if (button.label == label) {
        button.isDisabled = isDisabled;
      }
      return button;
    });
    setButtonList([...newButtonList]);
  };
  
  const handleActionSelect = (selectedOption:any) => {
    setSelectedAction(selectedOption);
  
    if (selectedOption && selectedOption.action) {
      if (selectedOption.value === "reveal") {
        // Pass parameters only for "reveal"
        if(tabName === 'Other Candidates'){
        selectedOption.action(recommendedCandidates);
        }
        else if(tabName === 'Recommended Candidates'){
          selectedOption.action(subrecommendedCandidates);
        }
      } else {
        // Call other actions normally
        selectedOption.action();
      }
    }
  };



  const customStyles = {
    placeholder: (provided: any, state: any) => ({
      ...provided,
      height: 25,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: 14,
      marginTop: 2,
    }),
  };

  return (
      <div className="">
        <div className="h-16">
          <DashboardHeader />
        </div>

        <div
          style={{
            backgroundColor: color?.outerBg,
            color: color?.secondaryAccent,
          }}
          className="flex flex-col w-full px-6 py-6"
        >
          <div
            style={{ backgroundColor: color?.innerBg }}
            className="p-2 min-h-screen relative"
          >
            <div className="flex items-center justify-between">
              <div className="px-2 flex items-center">
                <Breadcrumbs
                  title={""}
                  backPage={""}
                  link={role === "admin" ? "/admin/jobs" : "/dashboard"}
                />
                <div className="font-semibold">
                  {data ? data.title : "Title"}
                  <div className="flex divide-x space-x-5 py-2">
                    <div className="flex items-center text-sm font-thin">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 mr-1"
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
                      <div className="text-sm" />
                      {data && data.city ? data.city + ", " : ""}
                      {data && data.state ? data.state : ""}
                      {data && data.country ? ", " + data.country : ""}
                    </div>
                    <div className="flex items-center font-thin">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 mr-1 ml-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-sm">
                        {data ? data.workLocation : "Work Location"}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="ml-4 text-sm font-thin">
                        <span
                          style={{ color: color?.primaryAccent }}
                          className="text-sm font-thin"
                        >
                          {" "}
                          $
                          {data
                            ? Math.abs(data.compensation) > 999
                              ? Math.sign(data.compensation) *
                                  Number(
                                    (
                                      Math.abs(data.compensation) / 1000
                                    ).toFixed(1)
                                  ) +
                                "k"
                              : Math.sign(data.compensation) *
                                Math.abs(data.compensation)
                            : "00.00"}
                        </span>{" "}
                        year
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-row px-2">
                <Select
                  options={buttonList}
                  value={selectedAction}
                  onChange={handleActionSelect}
                  placeholder="Select Action"
                  className="w-full md:w-48 lg:w-64 md:mt-0 flex justify-end md:block mr-2"
                  components={{ Option }}
                  styles={customStyles}
                />
              </div>
            </div>

            <div className="flex items-center px-2 w-full justify-between mb-4">
              <div className="text-sm  w-full font-medium text-center text-gray-500 border-b border-[#e5e7eb] dark:text-gray-400 dark:border-[#e5e7eb]">
                <button
                  className={`${
                    tabName == "Other Candidates"
                      ? "inline-block p-4 text-[#006251] border-b-2 border-[#006251] rounded-t-lg active dark:text-[#006251] dark:border-[#006251]"
                      : "inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-[#e5e7eb] dark:hover:text-gray-300 "
                  }`}
                  onClick={() => setTabName("Other Candidates")}
                >
                  Your Candidates
                </button>
                <button
                  className={`${
                    tabName == "Recommended Candidates"
                      ? "inline-block p-4 text-[#006251] border-b-2 border-[#006251]rounded-t-lg active dark:text-[#006251] dark:border-[#006251]"
                      : "inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-[#e5e7eb] dark:hover:text-gray-300 "
                  }`}
                  onClick={() => setTabName("Recommended Candidates")}
                >
                  Recommended Candidates
                </button>
              </div>
            </div>

            {tabName == "Other Candidates" && (
              <div className="tab1">
                {loading ? (
                  <div className="mt-[30vh]">
                    <Loader />
                  </div>
                ) : recommendedCandidates.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-24 gap-4 px-4 mt-6">
                    {recommendedCandidates.map((item: any, index: Key) => (
                      <ProfileCard
                        detail={item}
                        isShowCheckbox={true}
                        showFullData={showFullData}
                        key={index}
                        selectedCandidatesList={selectedCandidates}
                        selectCandidate={selectCandidate}
                        removeCandidate={removeCandidate}
                        setPlanModal={setPlanModal}
                        color={color}
                        colors={colors}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-[80vh] flex flex-col justify-center items-center">
                    <div
                      style={{ color: color?.primaryAccent }}
                      className="mb-10"
                    >
                      <div className="flex justify-center font-bold">
                        {statusMsg}
                      </div>
                    </div>
                    {status && status !== "success" && status !== "halt" && (
                      <BlogSection />
                    )}
                  </div>
                )}

                {recommendedCandidates && recommendedCandidates.length ? (
                  <div className="bottom-0 absolute w-[99%] m-auto ">
                    <Pagination
                      setCurrentPage={recommendedCandidatesData.current_page}
                      totalItems={recommendedCandidatesData.total_count}
                      currentPage={recommendedCandidatesData.current_page}
                      itemsPerPage={recommendedCandidatesData.per_page}
                      totalPages={recommendedCandidatesData.total_pages}
                      PageNumberChange={PageNumberChange}
                      PerPageNumberChange={PerPageNumberChange}
                      setPerPagingNumber={setPerPagingNumber}
                      perPagingNumber={perPagingNumber}
                      setPageNumber={setPagingNumber}
                    />
                  </div>
                ) : null}
              </div>
            )}
            {tabName == "Recommended Candidates" && (
              <div className="tab1">
                {loading ? (
                  <div className="mt-[30vh]">
                    <Loader />
                  </div>
                ) : subrecommendedCandidates.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-24 gap-4 px-4 mt-6">
                    {subrecommendedCandidates.map((item: any, index: Key) => (
                      <ProfileCard
                        detail={item}
                        isShowCheckbox={true}
                        showFullData={showFullData}
                        key={index}
                        selectedCandidatesList={selectedCandidates}
                        selectCandidate={selectCandidate}
                        removeCandidate={removeCandidate}
                        setPlanModal={setPlanModal}
                        color={color}
                        colors={colors}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-[80vh] flex flex-col justify-center items-center">
                    <div
                      style={{ color: color?.primaryAccent }}
                      className="mb-10"
                    >
                      <div className="flex justify-center font-bold">
                        {statusMsg}
                      </div>
                    </div>
                    {status && status !== "success" && status !== "halt" && (
                      <BlogSection />
                    )}
                  </div>
                )}

                {subrecommendedCandidates && subrecommendedCandidates.length ? (
                  <div className="bottom-0 absolute w-[99%] m-auto ">
                    <Pagination
                      setCurrentPage={subrecommendedCandidatesData.current_page}
                      totalItems={subrecommendedCandidatesData.total_count}
                      currentPage={subrecommendedCandidatesData.current_page}
                      itemsPerPage={subrecommendedCandidatesData.per_page}
                      totalPages={subrecommendedCandidatesData.total_pages}
                      PageNumberChange={PageNumberChange}
                      PerPageNumberChange={PerPageNumberChange}
                      setPerPagingNumber={setPerPagingNumber}
                      perPagingNumber={perPagingNumber}
                      setPageNumber={setPagingNumber}
                    />
                  </div>
                ) : null}
              </div>
            )}



          </div>
        </div>

        <Modal
          open={isShareLinkModalOpen}
          setOpen={setIsShareLinkModalOpen}
          section="shareLink"
          header="Sharable Link"
        >
          <ShareUrlComponent shareUrl={shareUrl} color={color} />
        </Modal>

        <Modal
          open={showDetail}
          setOpen={setShowDetail}
          section="candidateDetail"
          header="Candidate Details"
        >
          <div
            style={{ backgroundColor: color?.innerBg }}
            className="w-full align-bottom rounded-lg overflow-hidden"
          >
            <CandidateDetailModal
              page="profile"
              admin={role === "admin"}
              isRevealed={candidateData?.is_revealed}
              detail={candidateData}
              setShowDetail={setShowDetail}
              color={color}
              colors={colors}
            />
          </div>
        </Modal>

        <Modal
          expired={true}
          open={plansModal}
          setOpen={setPlanModal}
          section="companyDetail"
          header="Reveals"
        >
          <div
            style={{ backgroundColor: color?.innerBg }}
            className="w-full align-bottom overflow-hidden justify-between"
          >
            <div className="p-4">
              <h2 className="text-md font-medium w-full mb-4">
                <FontAwesomeIcon
                  icon={faWarning}
                  style={{ color: color?.primaryAccent }}
                  className="mr-3 text-2xl"
                />
                Seems like you have run out of reveals!
              </h2>
              <p className="text-sm font-light w-full">
                Please consider purchasing credits to reveal
                more candidates.
              </p>
            </div>
            <div className="flex items-center justify-end">
              <div>
                <Link href="/profile/plans/screening_credits">
                  <ButtonWrapper classNames="flex justify-center items-center rounded-md border border-transparent px-5 py-2 text-base font-medium shadow-sm focus:outline-none mt-4">
                     Purchase Credits
                  </ButtonWrapper>
                </Link>
              </div>
            </div>
          </div>
        </Modal>
        <Modal
          open={isModalOpen}
          setOpen={handleModalClose}
          section="subscriptionAI"
          header="Subscription AI Hiring"
        >
          <p className="text-lg font-semibold text-gray-800 mb-4">
            How many candidates would you like to reveal for this selected job?
          </p>
          <input
            type="number"
            min={1}
            max={10}
            value={candidates}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 1 && value <= 10) {
                setCandidates(value);
              }
            }}
            placeholder="Enter number of candidates (max 10)"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006251] focus:border-transparent"
          />
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={() => handleSubmit("Retained Recruiting")}
              className="text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{backgroundColor:"#006251"}}
            >
              Submit
            </button>
          </div>
        </Modal>
        <Modal
          open={isImportCandidateModalOpen}
          setOpen={setIsImportCandidateModalOpen}
          section="candidateImport"
          header="Import Candidates"
        >
          <FileUpload
            setFile={setCandidateCsvFile}
            file={candidateCsvFile}
            accept=".csv,.xlsx"
          />
          <div className="flex items-center justify-end">
            <div className="flex gap-1 mt-6">
              <StartDateButton
                isDisabled={isCandidateUploading ? true : false}
                action={uploadCSVFile}
                btnLabel={isCandidateUploading ? "Please wait..." : "Upload"}
                icon={faUpload}
              />
              <StartDateButton
                isDisabled={isCandidateUploading ? true : false}
                action={() => setCandidateCsvFile("")}
                btnLabel={"Clear"}
                icon={faMultiply}
              />
            </div>
          </div>
        </Modal>
      </div>
  );
};

export default AuthGuard(JobDetailPage);