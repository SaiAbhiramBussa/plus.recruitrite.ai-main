import Loader from "@/src/component/Loader";
import PlanCard from "@/src/component/PlanCard";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import AuthGuard from "@/src/component/AuthGuard";
import AppContext from "@/src/context/Context";
import ButtonWrapper from "@/src/component/ButtonWrapper";
import Modal from "@/src/component/Modal";
import { fetchJobs } from "@/src/component/Job/JobServices";
import { toast } from "react-toastify";
import { getCandidatesForJobs } from "@/src/services/common.service";
import PricingSlider from "@/src/component/PricingSlider";

interface Options {
  mode?: any;
  currency?: any;
  amount?: any;
  paymentMethodTypes: any;
  paymentMethodCreation: any;
}

const options: Options = {
  mode: "payment",
  currency: "usd",
  amount: 123,
  paymentMethodTypes: ["card"],
  paymentMethodCreation: "manual",
};

const SubscriptionAI = (props: any) => {
  const router = useRouter();
  const { activePlan } = props;
  const [loading, setLoading] = useState<boolean>(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [perPagingNumber, setPerPagingNumber] = useState(50);
  const [pagingNumber, setPagingNumber] = useState(1);
  const [planType, setPlanType] = useState("");
  const [jobType, setJobType] = useState("active");
  const { color } = useContext(AppContext);
  const [isRetainedRecruitmentFormOpen, setIsRetainedRecruitmentFormOpen] =  useState<boolean>(false);
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<number>(1);
  const [isContentVisible, setIsContentVisible] = useState(false);

  // Function to toggle visibility of content
  const toggleContent = () => {
    setIsContentVisible((prev) => !prev);
  };

  // const handleModalOpen = () => {
  //   setIsModalOpen(true);
  // };

  const handleModalCloses = () => {
    setIsModalOpen(false);
  };

  const stripePromise: Promise<Stripe | null> = process.env
    .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : Promise.resolve(null);

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
  const showPaymentPopup = (index: any) => {
    router.push(`/payments/${index === 1 ? "ai_silver" : "ai_gold"}`);
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
  
  const showBoth = activePlan === undefined ? true : false;

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
          {/* <div className="flex flex-col items-center lg:flex-row flex-wrap justify-center w-full mt-16">
        <PlanCard
          slug="free"
          name="Free Plan"
          tag={"Have a Free Trial on us!"}
          price={0}
          index={0}
          showPaymentPopup={showPaymentPopup}
          features={[
            "3 candidate reveals",
            `Filter through 100's of sourced candidates`,
            "See analysis of matched authenticity",
            "Gain contactable information to pursue",
            "No reveal rollovers",
          ]}
          color={color}
        />
        <PlanCard
          showBoth={showBoth}
          disclaimer={"* Includes prior plan benefits."}
          slug="ai_silver"
          active={activePlan === "ai_silver" ? true : false}
          name="AI-Silver"
          tag={"Best for 1 Job Requisition per month."}
          price={299}
          index={1}
          showPaymentPopup={showPaymentPopup}
          features={[
            "30 candidate reveals/month",
            "Export candidates into your hiring process",
            "Chat GPT matching option",
            `AI matching option (SD's proprietary technology)*`,
            "No reveal rollovers",
          ]}
          color={color}
        />
        <PlanCard
          showBoth={showBoth}
          disclaimer={"* Includes prior plan benefits."}
          slug="ai_gold"
          active={activePlan === "ai_gold" ? true : false}
          name="AI-Gold"
          tag={"Best for Multiple Job Requisitions per month."}
          price={695}
          index={2}
          showPaymentPopup={showPaymentPopup}
          features={[
            "100 candidate reveals/month",
            "Processing of Internal Company Jobs",
            "Multi-user management",
            "Volume and Enterprise solutions available",
            "Reveal rollovers (use unused credits the following months)",
          ]}
          color={color}
        />
      </div> */}
          <Modal
            open={isRetainedRecruitmentFormOpen}
            setOpen={handleModalClose}
            header="Select Job to get help with!"
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
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
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
          </Modal>
          <PricingSlider />
          <div className="flex justify-center gap-4 px-2 py-10">
            <div className="flex flex-col gap-4 w-1/2 p-4">
              {/* Modal Component */}
              <Modal
                open={isModalOpen}
                setOpen={handleModalCloses}
                header="How Do Credits Works?"
              >
                <div className="flex flex-col gap-4 p-3">
                  <p>
                    How do credits work? Credits work on a consumption basis,
                    the more credits that you purchase, the lower the cost and
                    you earn a discount, which is redeemed by giving you more
                    credits. The Lite screening plan uses 1 credit, while the
                    Plus plan uses 2 credits per screening. Credits can be used
                    to purchase Subscription AI candidates which are used for
                    additional sourcing help in your recruiting efforts.
                    <br />
                    <br />
                    <b>Lite Plan</b> - AI Matching, Multi-lingual, Advanced AI
                    Insights + Integrations <br />
                    <br />
                    <b>Plus Plan</b> - Lite Features + UI and an Administration
                    portal suite of tools <br />
                    <br />
                    <b>Subscription AI</b> - Each candidate will use 100 credits
                    and you can purchase as you need and per the job and
                    StartDate will find the most optimized candidate/s and will
                    insert them into your Job Output. Your team will review
                    the matched output and reach out to engage the candidate
                    into your hiring process. <br />
                    <br />
                    Subscription AI sources the best talent for your talent
                    needs. This service utilizes the latest AI technology in
                    matching the best candidates to your job description. We
                    match, you hire, saving you time and 99% of the average
                    recruiting cost.
                  </p>
                  <div className="flex items-center justify-center h-full w-full">
                    <ButtonWrapper
                      onClick={() => {
                        setIsRetainedRecruitmentFormOpen(true);
                        getJobPostings();
                        handleModalCloses();
                      }}
                      classNames="items-center justify-center rounded border border-transparent py-2 px-3 font-xs shadow-sm text-xs lg:text-sm focus:outline-none text-center max-w-max"
                    >
                      <span className="whitespace-nowrap text-lg">
                        Subscription AI - Sourcing the Best Talent
                      </span>
                    </ButtonWrapper>
                  </div>
                </div>
              </Modal>
            </div>
          </div>
        </div>
    );

};

export default AuthGuard(SubscriptionAI);