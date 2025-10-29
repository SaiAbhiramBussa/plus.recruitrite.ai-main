import Image from "next/image";
import { useState, useEffect } from "react";
import CrispChat from "./CrispChat";
import StepsCard from "./StepsCard";
import dynamic from "next/dynamic";
import { fetchJobs } from "./Job/JobServices";
import { getHelpWithJobs } from "../services/common.service";
import Modal from "./Modal";
import { toast } from "react-toastify";

const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

export default function FullServiceSubPage() {
  const [openChat, setOpenChat] = useState<boolean>(false);
  const [isRetainedRecruitmentFormOpen, setIsRetainedRecruitmentFormOpen] =  useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [perPagingNumber, setPerPagingNumber] = useState(50);
  const [pagingNumber, setPagingNumber] = useState(1);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobType, setJobType] = useState("active");
  const [selectedJob, setSelectedJob] = useState<string>(""); // State to store selected job ID or title

  const [isContingentRecruitmentFormOpen, setIsContingentRecruitmentFormOpen] =  useState<boolean>(false);
  
  const openChatHandler = () => {
    setOpenChat(true);
    window.$crisp.push(["do", "chat:open"]);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredJobs, setFilteredJobs] = useState(jobs);

  useEffect(() => {
    // Filter jobs when the search query changes
    const filtered = jobs.filter((job: any) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredJobs(filtered);
  }, [searchQuery, jobs]);

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
  
  const handleRadioChange = (jobTitle: string) => {
    setSelectedJob(jobTitle);
  };

  const handleSubmit = async(type: string) => {
    if (selectedJob) {
      const response = await getHelpWithJobs({job_title: selectedJob, help_type: type})
      if(response?.status){
        toast.success("Request sent successfully!")
        setIsRetainedRecruitmentFormOpen(false);
        setIsContingentRecruitmentFormOpen(false);
      }
      else
        toast.error("Failed to sent request!")
    } else {
      toast.error("Please select a job before submitting.");
    }
  };

  const handleChatClosed = () => {
    setOpenChat(false);
  };

  return (
    <div>
      <Modal
        open={isRetainedRecruitmentFormOpen}
        setOpen={setIsRetainedRecruitmentFormOpen}
        header="Retained Recruiting"
      >
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
                      type="radio"
                      id={`job-${index}`}
                      name="jobSelection"
                      value={job.title}
                      onChange={() => handleRadioChange(job.title)}
                      className="mr-3 h-4 w-4 text-blue-500 focus:ring-blue-400"
                      checked={selectedJob === job.title}
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

              {/* Submit Button */}
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
            </form>
          ) : (
            <p className="text-gray-500">No jobs available at the moment.</p>
          )}
        </div>
      </Modal>

      <Modal
        open={isContingentRecruitmentFormOpen}
        setOpen={setIsContingentRecruitmentFormOpen}
        header="Contingent Recruiting"
      >
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
                      type="radio"
                      id={`job-${index}`}
                      name="jobSelection"
                      value={job.title}
                      onChange={() => handleRadioChange(job.title)}
                      className="mr-3 h-4 w-4 text-blue-500 focus:ring-blue-400"
                      checked={selectedJob === job.title}
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

              {/* Submit Button */}
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => handleSubmit("Contingent Recruiting")}
                  className="text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{backgroundColor:"#006251"}}
                >
                  Submit
                </button>
              </div>
            </form>
          ) : (
            <p className="text-gray-500">No jobs available at the moment.</p>
          )}
        </div>
      </Modal>

      <div className=" flex justify-between items-end">
        <div className="pl-12 mt-20 flex flex-col justify-between">
          <div className=" font-bold flex">
            <span className="text-4xl">Full Service Recruiting</span>
            <Image
              className="ml-4 mb-5"
              src={"/Images/h1-icon.png"}
              alt="company logo"
              height={4}
              width={20}
            />
          </div>
          <div className="leading-8 mt-20">
            RecruitRite is great at snagging Game Changers and specializes in
            critical leadership transition. We excel at sourcing the best talent
            in the market for your team. We have an uncanny ability to locate,
            vet, and entice the best. We utilize the same AI technology in
            sourcing the most optimized talent for your requisition. Our goal is
            to place the best talent into organizations with meticulous
            scrutiny, vetting thoroughly, and providing lasting guarantees.
          </div>
          <div className="flex justify-between gap-8 px-2 py-6">
            <div className="flex flex-col gap-4 w-1/2 border rounded-md p-4 shadow-sm">
              <ButtonWrapper
                onClick={() => {
                  setIsRetainedRecruitmentFormOpen(true);
                  getJobPostings();
                }}
                classNames="h-12 cursor-pointer md:flex items-center justify-center rounded border border-transparent py-10 md:px-8 font-xs shadow-sm text-xs lg:text-sm focus:outline-none text-center"
              >
                <div className="flex flex-col">
                  <span className="whitespace-nowrap font-bold text-lg">
                    Retained Recruiting
                  </span>
                  <p className="text-sm">
                    (submit your job for an immediate start)
                  </p>
                </div>
              </ButtonWrapper>
              <div className="flex items-center gap-2 h-12">
                <img src="/Images/h1-icon.png" alt="icon" className="h-6 w-6" />
                <p>RecruitRite will deliver candidates until a successful hire</p>
              </div>
              <div className="flex items-center gap-2 h-12">
                <img src="/Images/h1-icon.png" alt="icon" className="h-6 w-6" />
                <p>Long guarantees</p>
              </div>
              <div className="flex items-center gap-2 h-12">
                <img src="/Images/h1-icon.png" alt="icon" className="h-6 w-6" />
                <p>10% of agreed annual salary (multi-discounts available)</p>
              </div>
              <div className="flex items-center gap-2 h-12">
                <img src="/Images/h1-icon.png" alt="icon" className="h-6 w-6" />
                <p>½ Invoiced now, ½ upon a successful start date</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-1/2 border rounded-md p-4 shadow-sm">
              <ButtonWrapper
                onClick={() => {
                  setIsContingentRecruitmentFormOpen(true);
                  getJobPostings();
                }}
                classNames="h-12 cursor-pointer md:flex items-center justify-center rounded border border-transparent py-10 md:px-8 font-xs shadow-sm text-xs lg:text-sm focus:outline-none text-center"
              >
                <div className="flex flex-col">
                  <span className="whitespace-nowrap font-bold text-lg">
                    Contingent Recruiting
                  </span>
                  <p className="text-sm">
                    (submit your job for an immediate start)
                  </p>
                </div>
              </ButtonWrapper>
              <div className="flex items-center gap-2 h-12">
                <img src="/Images/h1-icon.png" alt="icon" className="h-6 w-6" />
                <p>RecruitRite will deliver candidates until a successful hire</p>
              </div>
              <div className="flex items-center gap-2 h-12">
                <img src="/Images/h1-icon.png" alt="icon" className="h-6 w-6" />
                <p>Long guarantees</p>
              </div>
              <div className="flex items-center gap-2 h-12">
                <img src="/Images/h1-icon.png" alt="icon" className="h-6 w-6" />
                <p>Negotiated rates “Chat Now”</p>
              </div>
              <div className="flex items-center gap-2 h-12">
                <img src="/Images/h1-icon.png" alt="icon" className="h-6 w-6" />
                <p>Invoiced upon a successful start date</p>
              </div>
            </div>
          </div>
          <ButtonWrapper
            onClick={openChatHandler}
            classNames="mb-24 mt-10 h-12 w-3/5 cursor-pointer md:flex items-center justify-center rounded border border-transparent py-2 md:px-8 font-xs shadow-sm text-xs lg:text-sm focus:outline-none"
          >
            <span className="mx-1 hidden lg:block">
              Inquire about our Full Service Recruiting
            </span>
          </ButtonWrapper>
        </div>
        <Image
          className="ml-4 w-[40%] h-[70%]"
          src={"/Images/infobox-triangle-fullservice-sm.png"}
          alt="company logo"
          height={8}
          width={100}
        />
      </div>
      <hr />
      <div className="px-12 my-24 flex flex-col justify-center">
        <div className="font-bold text-4xl flex mb-12">The Process</div>
        <StepsCard />
      </div>
      <hr />
      {openChat && <CrispChat handleChatClosed={handleChatClosed} />}
    </div>
  );
}
