import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import { fetchCompanyById, fetchCompanyJobsById } from "@/src/services/job";
import { useRouter } from "next/router";
import { use, useContext, useEffect, useRef, useState } from "react";
import Tabs from "@/src/component/Tabs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import PrescreenedCandidates from "@/src/component/PrescreenedCandidates";
import MLOutput from "@/src/component/MLOutput";
import TrainingData from "@/src/component/TrainingData";
import AppContext from "@/src/context/Context";
import _ from "lodash";
import Select from "react-select";
import Breadcrumbs from "@/src/component/BreadCrumbs";
import AuthGuard from "@/src/component/AuthGuard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faColumns, faEye } from "@fortawesome/free-solid-svg-icons";
import Modal from "@/src/component/Modal";
import JobPostDetail from "@/src/component/JobPostDetail";
import Link from "next/link";
import { Option } from "@/src/common/common.comp";
import AdwerkModal from "@/src/component/AdwerkModal";
import { rankCandidates } from "@/src/services/common.service";
import { colorToRGBA } from "@/src/utils/misc";
import CandidatesTraining from "@/src/component/CandidatesTraining";

interface Context {
  companiesList?: any;
  selectedCompany?: any;
}

const AdminCompanyJob = (props: any) => {
  const router = useRouter();
  const companyid = router.query.id ? router.query.id[0] : null;
  const jobid =
    router.query.id && router.query.id.length > 1 ? router.query.id[2] : null;
  const context: Context = useContext(AppContext);

  const [data, setData] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [recommendedCandidates, setRecommendedCandidates] = useState<any>([]);
  const [selectedJob, setSelectedJob] = useState<any>();
  const [selectedCandidates, setSelectedCandidates] = useState<any>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>({});
  const [deleteCandidates, setDeleteCandidates] = useState<any>([]);
  const [rankedCandidates, setRankedCandidates] = useState<any>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deleteAll, setDeleteAll] = useState<boolean>(false);
  const [allCandidates, setAllCandidates] = useState<any>([]);
  const [companies, setCompanies] = useState(context.companiesList);
  const [showTraining, setShowTraining] = useState(false);
  const [items, setItems] = useState<any>([]);
  const [disablePushingData, setDisablePushingData] = useState<boolean>(true);
  const [disableDeleteBtn, setDisableDeleteBtn] = useState<boolean>(true);
  const [trainingCandidatesData, setTrainingCandidatesData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState<any>(context.selectedCompany);
  const [suggestions, setSuggestions] = useState([]);
  const [mlCandidates, setMlCandidates] = useState<any>([]);
  const [mlCandidatesData, setMlCandidatesData] = useState<any>({});
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [isEnableFullService, setIsEnableFullService] =
    useState<boolean>(false);
  const [filterBySkillValue, setFilterBySkillValue] = useState<any>("");
  const [showAdwerkModal, setShowAdwerkModal] = useState<boolean>(false);
  const [defaultTab, setDefaultTab] = useState<any>("Pre-screened candidates");
  const { color, customStyles, colors } = useContext(AppContext);
  const [filterRankCandidates, setFilterRankCandidates] = useState<string>("");
  const [publishCandidatesModal, setPublishCandidatesModal] =
    useState<boolean>(false);
  const [globalActiveTab, setGlobalActiveTab] = useState<any>(defaultTab);
  const [search, setSearch] = useState<string>("");
  const searchRef = useRef<any>(null);
  const [subscriptionService, setSubscriptionService] = useState<string>("");
  const subscriptionOptions = useState<any>([
    { value: "Subscription AI", label: "Subscription AI Hiring", icon: faEye },
    { value: "Full Service", label: "FullService Recruiting", icon: faColumns, },
  ]);

  const getOptionLabel = (option: any) => option.name;
  const getOptionValue = (option: any) => option.name;
  const getJobOptionLabel = (option: any) => option.title;
  const getJobOptionValue = (option: any) => option.title;
  const getSubscriptionLabel = (option: any) => option.label;
  const getSubscriptionValue = (option:any) => option.value;

  useEffect(() => {
    if (searchTerm.length > 1) {
      const debounceSearch = _.debounce(async () => {
        const result = await axios.get(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/?query=${searchTerm}`,
          {
            withCredentials: true,
          }
        );
        setCompanies(result.data.companies_data);
      }, 500);

      debounceSearch();
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (companyid) {
      fetchCompanyByIdFunc();
      fetchData(companyid);
    }
  }, [companyid]);


  // useEffect(() => {
  //   if (router.query && _.get(router, "query.id[3]", "") == "job-info") {
  //     setDefaultTab("Job Info");
  //   }
  // }, [router.query]);

  const fetchCompanyByIdFunc = async () => {
    try {
      let res = await fetchCompanyById(companyid);
      setSelectedCompany(res);
      setSearchTerm(res.name);
      return res;
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  useEffect(() => {
    refreshCount();

    if (selectedJob && selectedJob.subscription_type === "full_service")
      setIsEnableFullService(true);
    else if (selectedJob && selectedJob.subscription_type !== "full_service")
      setIsEnableFullService(false);
  }, [selectedJob]);

  useEffect(() => {
    if (selectedCandidates.length > 0) setDisablePushingData(false);
    else setDisablePushingData(true);
  }, [selectedCandidates]);

  useEffect(() => {
    if (deleteCandidates.length > 0) setDisableDeleteBtn(false);
    else setDisableDeleteBtn(true);
  }, [deleteCandidates]);

  const setFalse = () => {
    setSelectAll(false);
    setDeleteAll(false);
  };

  const showTrainingData = () => {
    setShowTraining(true);
  };

  const refreshCount = () => {
    setSelectedCandidates([]);
    setDeleteCandidates([]);
    setAllCandidates([]);
    setSelectAll(false);
  };

  const openFilterOverLay = () => {
    setShowFilter(!showFilter);
  };

  const handleSubscriptionChange = (selectedOption: any) => {
    if (selectedOption.value === "Full Service") {
      router.push("/profile/plans/full_service");
    } else {
      router.push("/profile/plans/screening_credits");

    }
    setSubscriptionService(selectedOption);
  };

  const appendCandidates = (selectedCandidateId: any, isChecked: boolean) => {
    let newSelectedCandidates = [];
    if (isChecked) {
      newSelectedCandidates = [...selectedCandidates, selectedCandidateId];
    } else {
      newSelectedCandidates = selectedCandidates.filter(
        (id: any) => id !== selectedCandidateId
      );
    }
    setSelectedCandidates(newSelectedCandidates);
    setSelectAll(
      calSelectAllCheckboxValue(newSelectedCandidates, allCandidates)
    );
    // if(newSelectedCandidates.length == allCandidates.length){
    //   setSelectAll(true)
    // }else{
    //   setSelectAll(false);
    // }
  };

  const appendtoDeleteCandidates = (
    toDeleteCandidateId: any,
    isChecked: boolean
  ) => {
    let newDeleteCandidates = [];
    if (isChecked) {
      newDeleteCandidates = [...deleteCandidates, toDeleteCandidateId];
    } else {
      newDeleteCandidates = deleteCandidates.filter(
        (id: any) => id !== toDeleteCandidateId
      );
    }
    setDeleteCandidates(newDeleteCandidates);
    setDeleteAll(calSelectAllCheckboxValue(newDeleteCandidates, items));
  };

  const appendRankedCandidates = (candidate: any) => {
    if (
      rankedCandidates.some(
        (rC: any) => rC.candidate_id == candidate.candidate_id
      )
    ) {
      let index: number = rankedCandidates.findIndex(
        (rC: any) => rC.candidate_id == candidate.candidate_id
      );
      setRankedCandidates(rankedCandidates.splice(index, 1));
    }
    setRankedCandidates([...rankedCandidates, candidate]);
  };

  const rankCandidatesHandler = async (isIndividual?: boolean) => {
    if (!rankedCandidates.length) {
      return;
    }

    if (jobid) {
      const response = await rankCandidates(jobid, {
        candidates: rankedCandidates,
      });

      if (response?.status === 200 && isIndividual) {
        let newItems: any = [];

        if (filterRankCandidates === "unranked") {
          newItems = items.filter(
            (item: any) =>
              item.candidate_id !== rankedCandidates[0].candidate_id
          );
        } else {
          newItems = items.map((item: any) => {
            if (item.candidate_id === rankedCandidates[0].candidate_id) {
              item.labels = rankedCandidates[0].labels;
            }

            return item;
          });
        }

        setItems(newItems);
      } else {
        await fetchTrainingData(
          trainingCandidatesData.current_page,
          trainingCandidatesData.per_page,
          filterRankCandidates
        );
      }

      setRankedCandidates([]);
    }
  };

  const pushToTrainingDataHandler = async () => {
    setDisablePushingData(true);
    try {
      let res = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/training_candidates`,
        {
          job_posting_id: jobid,
          candidates_id: selectedCandidates,
        },
        { withCredentials: true }
      );
      toast.success("Pushed to training data", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
      setSelectedCandidates([]);
      setSelectAll(false);
      return res;
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setDisablePushingData(false);
    }
  };

  const deleteTrainingDataHandler = async () => {
    setDisableDeleteBtn(true);
    try {
      const data = {
        job_posting_id: jobid,
        candidates_id: deleteCandidates,
      };

      let res = await axios.delete(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/training_candidates`,
        { data, withCredentials: true }
      );
      toast.success("Deleted training data", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
      setDeleteCandidates([]);
      // const updatedItems = items.filter((item: any) => !deleteCandidates.includes(item.candidate_id));
      fetchTrainingData(
        trainingCandidatesData.current_page,
        trainingCandidatesData.per_page
      );
      setFalse();
      // setAllCandidates(updatedItems);
      // setItems(updatedItems)
      return res;
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setDisableDeleteBtn(false);
    }
  };

  const deleteFromMlOutputHandler = async () => {
    setDisableDeleteBtn(true);
    try {
      const data = {
        job_posting_id: jobid,
        candidates_id: selectedCandidates,
      };

      let res = await axios.delete(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/ml_output_candidates`,
        { data, withCredentials: true }
      );
      toast.success("Deleted training data", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
      setSelectedCandidates([]);
      // const updatedItems = mlCandidates.filter((item: any) => !selectedCandidates.includes(item.candidate_id));
      // setAllCandidates(updatedItems);
      // setMlCandidates(updatedItems);
      fetchMlOutputData(
        mlCandidatesData.current_page,
        mlCandidatesData.per_page
      );
      setFalse();
      return res;
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setDisableDeleteBtn(false);
    }
  };

  const publishCandidateHandler = async (type: string) => {
    try {
      const data = {
        type: type,
        job_posting_id: jobid,
        candidates_id: selectedCandidates,
        company_id: companyid,
      };
      let res = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/candidates/published`,
        data,
        { withCredentials: true }
      );
      if (type == "un_publish") {
        const updatedItems = allCandidates.map((item: any) => {
          if (selectedCandidates.includes(item.candidate_id)) {
            item.is_published = false;
          }
          return item;
        });
        toast.success("UnPublished Candidate data", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        // setSelectedCandidates([]);
        setAllCandidates(updatedItems);
        setMlCandidates(updatedItems);
      } else if (type == "publish") {
        const updatedItems = allCandidates.map((item: any) => {
          if (selectedCandidates.includes(item.candidate_id)) {
            item.is_published = true;
          }
          return item;
        });
        toast.success("Published Candidate data", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        setAllCandidates(updatedItems);
        setMlCandidates(updatedItems);
      }
      setSelectedCandidates([]);
      setFalse();
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const downloadTrainingDataHandler = async (ext: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/training_candidates/${jobid}/download-${ext}`,
        {
          responseType: "blob",
          withCredentials: true,
        }
      );

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${jobid}.${ext}`; // Default filename
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: ext === "csv" ? "text/csv" : "application/zip",
        })
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const downloadPrescreenedDataHandler = async (ext: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/prescreen_candidates/${jobid}/download-${ext}`,
        {
          responseType: "blob",
          withCredentials: true,
        }
      );

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${jobid}.${ext}`; // Default filename
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: ext === "csv" ? "text/csv" : "application/zip",
        })
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const handleJobChange = (selectedJobValue: any) => {
    setSelectedJob(selectedJobValue);
    const currentQuery = router.query;
    const newQuery = { ...currentQuery, jobid: selectedJobValue.job_id };
    const segments = router.asPath.split("/");
    segments[segments.length - 2] = selectedJobValue.job_id;
    const newUrl = segments.join("/");
    router.replace(newUrl);
  };

  const fetchData = async (id: any) => {
    try {
      const jobListResponse = await fetchCompanyJobsById(id);
      const jobListData = jobListResponse;
      setData(jobListData);
      if (jobListData.length > 0) {
        if (jobid) {
          // const newUrl = `${companyid}/job_posting/${jobid}/pre-screening`;
          // router.replace(newUrl);
          setSelectedJob(jobListData.find((obj: any) => obj.job_id === jobid));
        } else {
          // const newUrl = `${companyid}/job_posting/${jobListData[0].job_id}/pre-screening`;
          // router.replace(newUrl);
          setSelectedJob(jobListData[0]);
        }
      } else {
        // router.push(`${router.asPath}/pre-screening`);
      }
    } catch (error) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (inputValue: any) => {
    setSearchTerm(inputValue);
  };

  const handleSelectAll = (event: any) => {
    if (!selectAll) {
      // allCandidates.map((item: any) => {
      setSelectedCandidates((prevState: any) => {
        let candidates = [...prevState];
        allCandidates.map((item: any) => {
          candidates.push(item.candidate_id);
        });
        candidates = Array.from(new Set(candidates));
        return candidates;
      });
      // })
    } else {
      setSelectedCandidates([]);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectAllInMLOutput = (event: any) => {
    if (!selectAll) {
      // allCandidates.map((item: any) => {
      setSelectedCandidates((prevState: any) => {
        let candidates = [...prevState];
        mlCandidates.map((item: any) => {
          candidates.push(item.candidate_id);
        });
        candidates = Array.from(new Set(candidates));
        return candidates;
      });
      // })
    } else {
      setSelectedCandidates([]);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectAllOnPageChange = (val: any) => {
    setSelectAll(val);
  };

  const fetchTrainingData = async (
    pagingNumber: any,
    perPagingNumber: number,
    filter?: string
  ) => {
    try {
      setLoading(true);
      let result = await axios.get(
        `${
          process.env.NEXT_PUBLIC_DOMAIN
        }/api/machine_learning/training_candidates/${jobid}?page=${pagingNumber}&per_page=${perPagingNumber}${
          filter ? `&filter=${filter}` : ""
        }${search ? `&search=${search}` : ""}`,
        {
          withCredentials: true,
        }
      );
      result &&
        result.data.candidates.map((item: any, index: any) => {
          _.update(result, `data.candidates[${index}].picture`, () =>
            setEmptyPic(item.picture)
          );
        });
      setItems(result.data.candidates);
      setTrainingCandidatesData(result.data);
      setDeleteAll(
        calSelectAllCheckboxValue(deleteCandidates, result.data.candidates)
      );
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const setEmptyPic = (picureURL: string): string => {
    return picureURL
      ? picureURL
      : `https://startdate-images-1.s3.us-west-1.amazonaws.com/startdate-avatar/${
          Math.floor(Math.random() * 6) + 1
        }.png`;
  };

  const fetchMlOutputData = async (
    pagingNumber: any,
    perPagingNumber: number
  ) => {
    setLoading(true);
    try {
      let result = await axios.get(
        `${
          process.env.NEXT_PUBLIC_DOMAIN
        }/api/machine_learning/ml_output_candidates/${jobid}?page=${pagingNumber}&per_page=${perPagingNumber}${
          search ? `&search=${search}` : ""
        }`,
        {
          withCredentials: true,
        }
      );
      result &&
        result.data.candidates.map((item: any, index: any) => {
          _.update(result, `data.candidates[${index}].picture`, () =>
            setEmptyPic(item.picture)
          );
        });
      setMlCandidates(result.data.candidates);
      setMlCandidatesData(result.data);
      setAllCandidates(result.data.candidates);
      setSelectAll(
        calSelectAllCheckboxValue(selectedCandidates, result.data.candidates)
      );
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const calSelectAllCheckboxValue = (
    selectedCandidates: Array<string>,
    allCandidates: Array<string>
  ) => {
    return _.every(allCandidates, (element: any) =>
      _.includes(selectedCandidates, element.candidate_id)
    );
  };

  const handleDeleteAll = (event?: any) => {
    if (!deleteAll) {
      setDeleteCandidates((prevState: any) => {
        let candidates = [...prevState];
        items.map((item: any) => {
          candidates.push(item.candidate_id);
        });
        candidates = Array.from(new Set(candidates));
        return candidates;
      });
    } else {
      setDeleteCandidates([]);
    }
    setDeleteAll(!deleteAll);
  };

  const populateCandidates = (candidatesData: any, isPageChange: false) => {
    const candidates = candidatesData.candidates;
    setAllCandidates(candidates);
    storeIdsFromObject(candidates, selectAll, isPageChange);
  };

  const reprocessHandler = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/refresh/${jobid}`,
        {
          withCredentials: true,
        }
      );
      if (response.status === 200) {
        toast.success(response.data.message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
    } catch (error: any) {
      toast.error(error.response.data.message, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const enableFullService = async () => {
    try {
      let res: any = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/subscriptions/full_service/${jobid}`,
        {
          job_posting_id: jobid,
        },
        { withCredentials: true }
      );
      if (res.status === 200) {
        setIsEnableFullService(true);
        toast.success(res.data.Message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        return res;
      }
    } catch (err: any) {
      toast.error(err.response.data.Message, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const disableFullService = async () => {
    try {
      let res: any = await axios.delete(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/subscriptions/full_service/${jobid}`,
        { withCredentials: true }
      );
      if (res.status === 200) {
        setIsEnableFullService(false);
        toast.success(res.data.Message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        return res;
      }
    } catch (err: any) {
      toast.error(err.response.data.Message, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const storeIdsFromObject = (
    prescreenedCandidates: any,
    selectAll: boolean,
    isPageChange: boolean
  ) => {
    if (!isPageChange) {
      if (selectAll) {
        prescreenedCandidates.map((item: any) => {
          selectedCandidates.push(item.candidate_id);
        });
      } else {
        setSelectedCandidates([]);
      }
    }
  };

  const handleCompanyChange = (selectedOption: any) => {
    if (selectedCompany.id != selectedOption.id) {
      const newUrl = `/admin/company/${selectedOption.id}`;
      router.replace(newUrl);
      setSelectedCompany(selectedOption);
      setSearchTerm(selectedOption.name);
    }
  };

  const handleRankCandidates = async (filter: string) => {
    const page = trainingCandidatesData.current_page;
    const perPage = trainingCandidatesData.per_page;

    await fetchTrainingData(page, perPage, filter);
  };

  const filterBySkill = (skill: any) => {
    // const filteredData = recommendedCandidates.filter((item: any) => item.skills.includes(skill));
    // setRecommendedCandidates(filteredData)
    setFilterBySkillValue(skill);
  };

  const pushToAdwerk = async () => {
    setShowAdwerkModal(true);
  };

  return (
    <div
      style={{ backgroundColor: color?.outerBg }}
      className="min-h-screen flex flex-col"
    >
      <div className="h-16">
        <DashboardHeader />
      </div>

      <div className="flex flex-grow">
        {/* Filter by feature - To be utilised later on */}

        {/* <div className={`${showFilter ? 'flex top-60 z-10 inset-2  bg-gray-900 bg-opacity-75': 'hidden'} w-1/6 border bg-white lg:flex flex-col relative`}>
        <div className="fixed w-1/6">
          <Filter filterBySkill={filterBySkill} />
        </div>
      </div> */}
        <div className="w-full lg:w-full p-3 md:p-6 flex flex-col relative">
          <div
            style={{ backgroundColor: color?.innerBg }}
            className="md:flex justify-between"
          >
            <div className="p-2 flex justify-between items-center">
              <Breadcrumbs title="Jobs" link="/admin/jobs" backPage="" />
            </div>
            <div className="flex h-14 my-2 w-full items-center justify-end p-2 md:p-0">
              {/* {isEnableFullService && <button className="w-max hidden md:block mr-4 cursor-default items-center justify-center h-6 md:h-8 rounded-md bg-[#5820d010] px-2"><div className="text-xs text-[#006251]">Full Service</div></button>} */}
              {isEnableFullService && (
                <div style={{ color: color?.primaryAccent }} className="flex">
                  <Link
                    href={`/company/${companyid}/kanban/${jobid}`}
                    style={{
                      backgroundColor: colorToRGBA(color?.primaryAccent, 0.2),
                      color: color?.primaryAccent,
                    }}
                    className="cursor-pointer mr-2 col-span-1 flex items-center justify-center h-8 w-8"
                    passHref
                  >
                    <FontAwesomeIcon
                      icon={faColumns}
                      className="h-4 w-4 cursor-pointer"
                    />
                  </Link>
                  <button
                    style={{
                      backgroundColor: colorToRGBA(color.primaryAccent, 0.2),
                    }}
                    className="w-max hidden md:block mr-4 cursor-default items-center justify-center h-6 md:h-8 rounded-md px-2"
                  >
                    <div className="text-xs">Full Service</div>
                  </button>
                </div>
              )}
              {["ML Output", "Training Data", "Rank Candidates"].includes(
                globalActiveTab
              ) ? (
                <input
                  type="text"
                  ref={searchRef}
                  style={{
                    borderColor: colorToRGBA(color?.outerBg, color?.opacity),
                  }}
                  className="h-[38px] md:w-48 lg:w-56 py-1 px-2 text-sm border-2 focus:ring-inherit focus:border-inherit rounded mr-4"
                  placeholder="Search"
                  onKeyDown={(e: any) => {
                    if (e.keyCode === 13) setSearch(e.target.value);
                  }}
                />
              ) : null}
              <div className="md:w-48 lg:w-56 w-1/2 md:mx-4">
                <Select
                  options={subscriptionOptions}
                  className=""
                  styles={customStyles}
                  value={subscriptionService}
                  placeholder={"Get help in Hiring"}
                  components={{ Option }}
                  onChange={(e) => handleSubscriptionChange(e)}
                  // onInputChange={handleInputChange}
                />
              </div>
              <div className="md:w-48 lg:w-56 w-1/2">
                <Select
                  options={companies}
                  getOptionLabel={getOptionLabel}
                  getOptionValue={getOptionValue}
                  className=""
                  styles={customStyles}
                  value={searchTerm}
                  placeholder={selectedCompany.name}
                  components={{ Option }}
                  onChange={(e) => handleCompanyChange(e)}
                  onInputChange={handleInputChange}
                />
              </div>
              <div className="relative md:w-48 lg:w-56 w-1/2 ml-2 md:mx-4">
                <Select
                  options={data}
                  getOptionLabel={getJobOptionLabel}
                  getOptionValue={getJobOptionValue}
                  styles={customStyles}
                  isDisabled={data && data.length > 0 ? false : true}
                  value={selectedJob?.title}
                  components={{ Option }}
                  placeholder={
                    data && data.length > 0
                      ? selectedJob?.title
                      : "No jobs available"
                  }
                  onChange={handleJobChange}
                />
                {suggestions.map((suggestion: any) => (
                  <div key={suggestion.id}>{suggestion.name}</div>
                ))}
              </div>
              <Modal
                open={showAdwerkModal}
                setOpen={setShowAdwerkModal}
                header="Select Users"
                section="adwerkModal"
              >
                <div className="w-full font-light align-bottom rounded-lg mt-10">
                  Select the users you want to send an email notification to -
                  <div
                    style={{
                      backgroundColor: color?.innerBg,
                    }}
                    className="w-full align-bottom rounded-lg"
                  >
                    <AdwerkModal
                      jobid={jobid}
                      setShowAdwerkModal={setShowAdwerkModal}
                      companyid={companyid}
                      setSelectedCandidates={setSelectedCandidates}
                      selectedCandidates={selectedCandidates}
                      color={color}
                    />
                  </div>
                </div>
              </Modal>
            </div>
          </div>
          {data && (
            <div className="w-full h-full relative">
              <div
                style={{ backgroundColor: color?.innerBg }}
                className="md:px-4 px-2 col-span-12 lg:col-span-5 flex-1 h-full"
              >
                <Tabs
                  selectAllFunction={handleSelectAll}
                  deleteAllFunction={handleDeleteAll}
                  disablePushingData={disablePushingData}
                  disableDeleteBtn={disableDeleteBtn}
                  selectAll={selectAll}
                  openFilterOverLay={openFilterOverLay}
                  setFalse={setFalse}
                  setGlobalActiveTab={setGlobalActiveTab}
                  pushToTrainingData={pushToTrainingDataHandler}
                  deleteTrainingData={deleteTrainingDataHandler}
                  deleteFromMlOutputHandler={deleteFromMlOutputHandler}
                  publishCandidateHandler={publishCandidateHandler}
                  setPublishCandidatesModal={setPublishCandidatesModal}
                  downloadTrainingData={downloadTrainingDataHandler}
                  downloadPrescreenedData={downloadPrescreenedDataHandler}
                  count={selectedCandidates.length}
                  searchRef={searchRef}
                  reprocessHandler={reprocessHandler}
                  deleteCount={deleteCandidates.length}
                  enableFullService={enableFullService}
                  disableFullService={disableFullService}
                  rankCandidates={rankCandidatesHandler}
                  showEnableBtn={
                    selectedJob?.subscription_type === "full_service"
                      ? true
                      : false
                  }
                  isEnableFullService={isEnableFullService}
                  mlCandidates={mlCandidates}
                  pushToAdwerk={pushToAdwerk}
                  selectedCandidates={selectedCandidates}
                  tabContents={[
                    <JobPostDetail
                      key={jobid}
                      selectedJob={selectedJob}
                      color={color}
                    />,
                    <PrescreenedCandidates
                      setEmptyPic={setEmptyPic}
                      selectedCandidates={selectedCandidates}
                      handleSelectAllOnPageChange={handleSelectAllOnPageChange}
                      filterBySkillValue={filterBySkillValue}
                      jobid={jobid}
                      selectAll={selectAll}
                      setFalse={setFalse}
                      key={jobid}
                      path={router.pathname}
                      pushToTrainingData={pushToTrainingDataHandler}
                      populateCandidates={populateCandidates}
                      selectAllFunction={handleSelectAll}
                      refreshCount={refreshCount}
                      appendCandidates={appendCandidates}
                      color={color}
                      colors={colors}
                    />,
                    <MLOutput
                      key={""}
                      candidates={mlCandidates}
                      fetchMlOutputData={fetchMlOutputData}
                      loading={loading}
                      appendCandidates={appendCandidates}
                      selectAll={selectAll}
                      setSelectAll={setSelectAll}
                      publishCandidatesModal={publishCandidatesModal}
                      setPublishCandidatesModal={setPublishCandidatesModal}
                      populateCandidates={populateCandidates}
                      setSelectedCandidates={setSelectedCandidates}
                      selectAllFunction={handleSelectAllInMLOutput}
                      refreshCount={refreshCount}
                      search={search}
                      setSearch={setSearch}
                      candidatesData={mlCandidatesData}
                      handleSelectAllOnPageChange={handleSelectAllOnPageChange}
                      selectedCandidates={selectedCandidates}
                      setFalse={setFalse}
                      color={color}
                      colors={colors}
                    />,
                    <TrainingData
                      jobid={jobid}
                      deleteAll={deleteAll}
                      key={jobid}
                      deleteAllFunction={handleDeleteAll}
                      appendtoDeleteCandidates={appendtoDeleteCandidates}
                      appendRankedCandidates={appendRankedCandidates}
                      fetchTrainingData={fetchTrainingData}
                      handleSelectAllOnPageChange={handleSelectAllOnPageChange}
                      candidates={items}
                      deleteCandidates={deleteCandidates}
                      loading={loading}
                      search={search}
                      setSearch={setSearch}
                      refreshCount={refreshCount}
                      candidatesData={trainingCandidatesData}
                      setFalse={setFalse}
                      color={color}
                      publishCandidatesModal={publishCandidatesModal}
                      setPublishCandidatesModal={setPublishCandidatesModal}
                      setSelectAll={setSelectAll}
                      setSelectedCandidates={setSelectedCandidates}
                      colors={colors}
                    />,
                    <CandidatesTraining
                      key={jobid}
                      selectedJob={selectedJob}
                      color={color}
                      jobid={jobid}
                      deleteAll={deleteAll}
                      search={search}
                      setSearch={setSearch}
                      appendRankedCandidates={appendRankedCandidates}
                      fetchTrainingData={fetchTrainingData}
                      candidates={items}
                      loading={loading}
                      refreshCount={refreshCount}
                      candidatesData={trainingCandidatesData}
                      setFalse={setFalse}
                      rankCandidates={rankCandidatesHandler}
                      filterRankCandidates={filterRankCandidates}
                      setFilterRankCandidates={setFilterRankCandidates}
                      handleRankCandidates={handleRankCandidates}
                      colors={colors}
                    />,
                  ]}
                  jobid={jobid}
                  viewTrainingData={showTrainingData}
                  setLoading={setLoading}
                  customStyles={customStyles}
                  recommendedCandidates={recommendedCandidates}
                  setFilterRankCandidates={setFilterRankCandidates}
                  tabs={[
                    "Job Info",
                    "Pre-screened candidates",
                    "ML Output",
                    "Training Data",
                    "Rank Candidates",
                  ]}
                  defaultTab={defaultTab}
                  color={color}
                  colors={colors}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthGuard(AdminCompanyJob);
