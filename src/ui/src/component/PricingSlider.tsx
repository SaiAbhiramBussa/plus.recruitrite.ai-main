import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import AppContext from "@/src/context/Context";
import SliderThumb from "./SliderThumb";
import ReactSlider from "react-slider";
import { getCandidatesForJobs} from "@/src/services/common.service";
import { Typography } from "@material-tailwind/react";
import ButtonWrapper from "./ButtonWrapper";
import Modal from "./Modal";
import { fetchJobs } from "./Job/JobServices";
import { toast } from "react-toastify";
import { add } from "lodash";

const PricingSlider = (props: any) => {
  const { color } = props;
  const { setStripePricing, selectedCredits, setSelectedCredits } = useContext(AppContext);
  const [showAdminControl, setShowAdminControl] = useState(false);
  const [loading, setLoading] = useState(false);
  const [perPagingNumber, setPerPagingNumber] = useState(50);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isRetainedRecruitmentFormOpen, setIsRetainedRecruitmentFormOpen] =  useState<boolean>(false);
  const [jobType, setJobType] = useState("active");
  const [pagingNumber, setPagingNumber] = useState(1);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [candidates, setCandidates] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [price, setPrice] = useState<string>('1.50');
  const [additionalCredits, setAdditionalCredits] = useState(0);
  const [showBuyText, setShowBuyText] = useState(false);
  const [Credits, setCredits] = useState<number>(10);
  const router = useRouter();

  const m = 0.004848;
  const b = 0.7576;


    const handleModalOpen = () => {
      setIsModalOpen(true);
    };
    const handleModalCloses = () => {
        setIsModalOpen(false);
    };

  const calculateDiscount = (credits: number) => {
    if (credits < 50) {
      return 0;
    }
    return Math.round(m * credits + b);
  };


  const handleModalClose = () => {
    setSearchQuery('');
    setSelectedJobs([]);
    setCandidates(1); 
    setIsRetainedRecruitmentFormOpen(false);
  };


  useEffect(() => {
    // Filter jobs when the search query changes
    const filtered = jobs.filter((job: any) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredJobs(filtered);
  }, [searchQuery, jobs]);

  useEffect(() => {
    const basePrice = Credits * 0.19;
    const discountPercentage = calculateDiscount(Credits);
    const discountAmount = (basePrice * discountPercentage) / 100;
    const discountCredits = Math.floor(discountAmount / 0.19);

    setAdditionalCredits(discountCredits);
    setPrice(basePrice.toFixed(2));

    setStripePricing((prev: any) => ({
      ...prev,
      price: basePrice.toFixed(2),
      total_credits: Credits + discountCredits,
      quantity: Credits,
      is_custom_screening: true,
    }));
  }, [Credits]);

  useEffect(()=>{
    if(selectedCredits){
      setCredits(selectedCredits);
    }
  },[]);

  const handleSliderChange = (value: number) => {
    setSelectedCredits(value);
    setCredits(value);
    setShowBuyText(true); // Show "BUY" text when slider is moved
  };

  const showPaymentPopup = () => {
    router.push(`/payments/custom_screening`);
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

  return (
    <div className="w-4/5 mx-auto p-6 bg-slate-50 rounded-xl relative mt-10">
  {/* Discount and Credit Price Section */}
  <div className="flex flex-col items-center gap-4 mb-12 mx-auto max-w-md">
    <div className="flex items-center gap-2">
      <div className="bg-[#006251] text-lg text-white px-3 py-1 rounded-lg">
        Discount
      </div>
      <div className="text-[#006251] px-3 py-1 font-bold">
        {calculateDiscount(Credits)}%
      </div>
    </div>

        <div className="flex items-center gap-2 mb-10">
        <div
          onClick={handleModalOpen} // Trigger modal on hover
          className="cursor-pointer"
          style={{
              width: "35px",
              height: "35px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "18px",
          }}
        >
          <img src={"/Images/info-icon.svg"} alt="info icon" width={30} height={30} className="brightness-50"  />
        </div>
          <div className="text-lg text-gray-800">Credit Price</div>
          <div className="px-3 py-1 font-semibold">$0.19</div>
        </div>
      </div>

      {/* Slider Section */}
      <div className="relative w-full">
        <div className="top-2">
          <ReactSlider
            min={10}
            max={5000}
            value={Credits}
            onChange={handleSliderChange}
            className="relative h-4 flex items-center horizontal-slider"
            thumbClassName="w-6 h-6 cursor-pointer focus:outline-none"
            trackClassName="h-1 bg-gray-200 rounded-full"
            renderThumb={(props, state) => {
              return (
                <div {...props}>
                  <SliderThumb
                    className="horizontal-slider"
                    price={price}
                    credits={Credits} // Use state.valueNow instead of credits
                    additionalCredits={additionalCredits}
                    showPaymentPopup={showPaymentPopup}
                  />
                </div>
              );
            }}
          />

        </div>

        <div
                    className="absolute w-full flex justify-between"
                    style={{
                        bottom: "-3px", // Adjust to move the ticks below the slider
                        zIndex: 1, // Ensure the ticks are below the slider
                        left: "2px",
                    }}
                >
                    {[10, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000].map(
            (mark) => (
              <div key={mark} className="flex flex-col">
                <div className="h-4 w-0.5 bg-gray-300"></div>
                <span className="text-md text-dark-600 font-semibold">
                  {mark}
                </span>
              </div>
            )
          )}
                </div>
      </div>
      <div className="mt-20"></div>
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
                    credits. Each screening, either on the Lite or Plus environment, utilizes one credit and when you choose to reveal candidates, these will be revealed in increments of 25. Credits can be used
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
                    <b>Subscription AI</b> - Each candidate will use 50 credits
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
                        console.log("btn clicked")
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
                    </Modal>
            </div>
          </div>
    </div>
  );
};

export default PricingSlider;