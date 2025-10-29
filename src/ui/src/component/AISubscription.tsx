import Loader from "@/src/component/Loader";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useRouter } from "next/router";
import { use, useContext, useEffect, useState } from "react";
import AppContext from "@/src/context/Context";
import { fetchJobs } from "@/src/component/Job/JobServices";
import { toast } from "react-toastify";
import { getCandidatesForJobs } from "@/src/services/common.service";



const AISubscription = (props: any) => {
  const router = useRouter();
  const { selectLangauge} = useContext(AppContext);
  const [loading, setLoading] = useState<boolean>(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [perPagingNumber, setPerPagingNumber] = useState(50);
  const [pagingNumber, setPagingNumber] = useState(1);
  const [jobType, setJobType] = useState("active");
  const { color } = useContext(AppContext);
  const [isRetainedRecruitmentFormOpen, setIsRetainedRecruitmentFormOpen] =  useState<boolean>(false);
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<number>(1);
  const [isContentVisible, setIsContentVisible] = useState(false);



  useEffect(() => {
    getJobPostings();
  },[]);

  useEffect(() => {
    // Filter jobs when the search query changes
    const filtered = jobs.filter((job: any) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredJobs(filtered);
  }, [searchQuery, jobs]);

  const handleModalClose = () => {
    setSearchQuery('');
    setSelectedJobs([]);
    setCandidates(1); 
    setIsRetainedRecruitmentFormOpen(false);
  };

  const getJobPostings = async (): Promise<void> => {
      setLoading(true);
      try {
        const jobsList = await fetchJobs(jobType, perPagingNumber, pagingNumber);
        if (jobsList && jobsList.response && jobsList.response.status === 401) {
          setLoading(false);
        } else if (jobsList && Object.values(jobsList).length >= 0) {
          setLoading(false);
          setJobs(jobsList.job_postings);
        } else {
          setJobs([]);
        }
        setLoading(false);
      } catch (error) {}
    };

  const handleCheckboxChange = (jobId: string) => {
    setSelectedJobs((prevSelectedJobs) => {
      if (prevSelectedJobs.includes(jobId)) {
        // If the job is already selected, remove it
        return prevSelectedJobs.filter((id) => id !== jobId);
      } else {
        // If the job is not selected, add it
        return [...prevSelectedJobs, jobId];
      }
    });
  };



  const handleSubmit = async(type: string) => {
      if (selectedJobs) {
        const response = await getCandidatesForJobs({job_ids: selectedJobs, candidates: candidates})
        if(response?.status){
          toast.success("Request sent successfully!")
          setIsRetainedRecruitmentFormOpen(false);
          handleModalClose();
        }
        else
          toast.error("Failed to sent request!")
      } else {
        toast.error("Please select a job before submitting.");
      }
    };

    return loading ? (
      <div className="flex justify-center items-center w-full">
        <Loader />
      </div>
    ) : (
        <div>          
            <div className="p-6">
              {/* Header */}
              <p className="text-lg font-semibold text-gray-800 mb-4">
                Please select the job for which you want help with!
              </p>

              {/* Search Input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search jobs by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Content */}
              {loading ? (
                <p className="text-gray-500">Loading jobs...</p>
              ) : filteredJobs.length > 0 ? (
                <form className="space-y-4">
                  {/* Jobs with Scroll */}
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                    {filteredJobs.map((job: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center bg-gray-50 p-3 rounded-md shadow-sm"
                      >
                        <input
                          type="checkbox"
                          id={`job-${index}`}
                          name="jobSelection"
                          value={job.title}
                          onChange={() => handleCheckboxChange(job.id)}
                          className="mr-3 h-4 w-4 text-blue-500 focus:ring-blue-400"
                          checked={selectedJobs.includes(job.id)} // Check if the job is selected
                        />
                        <label
                          htmlFor={`job-${index}`}
                          className="text-gray-700 font-medium"
                        >
                          {job.title || "Job Title Not Available"}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-800 mb-4">
                      How many candidates would you like to reveal for this
                      selected job?
                    </p>
                    <input
                      type="number"
                      placeholder="Enter the number of candidates (max 10)"
                      min={1}
                      max={10}
                      value={candidates}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= 1 && value <= 10) {
                          setCandidates(value);
                        }
                      }}
                      className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  {/* Submit Button */}
                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={() => handleSubmit("Retained Recruiting")}
                      className="bg-[#006251] text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-gray-500">
                  No jobs available at the moment.
                </p>
              )}
            </div>
        </div>
    );

};

export default AISubscription;