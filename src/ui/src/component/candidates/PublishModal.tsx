import _ from "lodash";
import { ToastContainer, toast } from "react-toastify";
import CandidateInfoCard from "./CandidateInfoCard";
import { useContext, useEffect, useState } from "react";
import AppContext from "@/src/context/Context";
import axios from "axios";
import { useRouter } from "next/router";
import { fetchCompanyJobsById } from "@/src/services/job";
import Select from "react-select";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

interface Context {
  companiesList?: any;
  selectedCompany?: any;
}

export default function PublishModal(props: any) {
  const {
    selectedCandidates,
    setPublishModal,
    setCheckedProfiles,
    setSelectedCandidates,
    setSelectAll,
  } = props;
  const context: Context = useContext(AppContext);
  const router = useRouter();
  const [companies, setCompanies] = useState(context.companiesList);
  const [searchTerm, setSearchTerm] = useState<any>(context.selectedCompany);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState<any>({});
  const [selectedJob, setSelectedJob] = useState<any>();
  const getOptionLabel = (option: any) => option.name;
  const getOptionValue = (option: any) => option.name;
  const getJobOptionLabel = (option: any) => option.title;
  const getJobOptionValue = (option: any) => option.title;
  const [data, setData] = useState<any>([]);
  const [loading, setLoading] = useState<any>();
  const [isCompanyLoading, setIsCompanyLoading] = useState<any>(false);
  const [cancelTokenSource, setCancelTokenSource] = useState<any>();

  const fetchCompanies = async (cancelToken: any) => {
    setIsCompanyLoading(true);
    try {
      const result = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/?query=${searchTerm}`,
        {
          withCredentials: true,
          cancelToken: cancelToken.token,
        }
      );
      setCompanies(result.data.companies_data);
      setCancelTokenSource("");
    } catch (err) {
    } finally {
      setIsCompanyLoading(false);
    }
  };
  const debouncedFetchCompanies = _.debounce(fetchCompanies, 700);

  useEffect(() => {
    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }
    let token = axios.CancelToken.source();
    setCancelTokenSource(token);
    debouncedFetchCompanies(token);
  }, [searchTerm]);

  useEffect(() => {
    if (!_.isUndefined(selectedCompany?.id)) fetchData(selectedCompany?.id);
  }, [selectedCompany?.id]);

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: 35,
      height: 35,
    }),
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

  const handleCompanyChange = (selectedOption: any) => {
    if (selectedCompany.id != selectedOption.id) {
      setSelectedCompany(selectedOption);
      setSelectedJob(undefined);
      setIsCompanyLoading(true);
      setSearchTerm(selectedOption.name);
    }
  };

  const handleInputChange = (inputValue: any) => {
    setSearchTerm(inputValue);
  };

  const fetchData = async (id: any) => {
    try {
      const jobListResponse = await fetchCompanyJobsById(id);
      const jobListData = jobListResponse;
      setData(jobListData);
    } catch (error) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      // setLoading(false);
    }
  };

  const handleJobChange = (selectedJobValue: any) => {
    setSelectedJob(selectedJobValue);
  };

  const publishData = async () => {
    let payload = {
      candidates: _.map(selectedCandidates, "candidate_id"),
      job_posting: selectedJob?.id,
    };
    setLoading(true);
    try {
      let res: any = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/candidate_ml_push`,
        payload,
        {
          withCredentials: true,
        }
      );
      if (res) {
        toast.success(res.data?.Message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        setPublishModal(false);
        setSelectedCandidates([]);
        if (setCheckedProfiles) {
          setCheckedProfiles([]);
        } else if (setSelectAll) {
          setSelectAll(false);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[77vh] md:h-auto overflow-auto">
      <div className="grid grid-cols-12 w-full pb-4">
        <div className="w-full max-h-96 overflow-x-hidden mt-4 mr-4 col-span-12 md:col-span-7">
          {selectedCandidates && selectedCandidates?.length > 0 ? (
            <div className="grid grid-rows-1 mb-2 mt-2 gap-4">
              {selectedCandidates?.map((item: any, key: any) => (
                <CandidateInfoCard candidateData={item} key={key} />
              ))}
            </div>
          ) : (
            ""
          )}
        </div>
        <div className="w-full flex justify-center content-center flex-wrap col-span-12 md:col-span-5">
          <div className="w-full m-4">
            <div className="font-medium text-sm mb-2">Company</div>
            <Select
              options={companies}
              getOptionLabel={getOptionLabel}
              getOptionValue={getOptionValue}
              styles={customStyles}
              value={searchTerm}
              isLoading={isCompanyLoading}
              placeholder={
                selectedCompany.name ? selectedCompany.name : "Search..."
              }
              onChange={(e: any) => handleCompanyChange(e)}
              onInputChange={handleInputChange}
            />
          </div>
          <div className="w-full m-4">
            <div className="font-medium text-sm mb-2">Job</div>
            <Select
              options={data}
              getOptionLabel={getJobOptionLabel}
              getOptionValue={getJobOptionValue}
              className=""
              styles={customStyles}
              isDisabled={data && data.length > 0 ? false : true}
              value={selectedJob ? selectedJob?.title : ""}
              placeholder={
                _.isUndefined(selectedCompany?.id)
                  ? "Select company first"
                  : data && data.length > 0
                  ? selectedJob?.title
                  : "No jobs available"
              }
              onChange={handleJobChange}
            />
          </div>
        </div>
      </div>
      <div className="gap-4 bottom-0 flex items-center">
        <div>
          <ButtonWrapper
            classNames="flex justify-center items-center rounded-md border border-transparent px-5 py-2 text-base font-medium shadow-sm focus:outline-none mt-4"
            onClick={publishData}
            disabled={!selectedJob || !selectedCompany || loading}
          >
            {loading ? "Publishing..." : "Publish"}
          </ButtonWrapper>
        </div>
      </div>
    </div>
  );
}
