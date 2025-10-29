import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import ProfileCard from "@/src/component/ProfileCard";
import Loader from "@/src/component/Loader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BlogSection from "@/src/component/BlogSection";
import axios from "axios";
import _ from "lodash";
import Image from "next/image";
import AppContext from "@/src/context/Context";

const ShareableCandidatesPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [recommendedCandidates, setRecommendedCandidates] = useState<any>([]);
  const [jobPostingData, setJobPostingData] = useState<any>();
  const [companyData, setCompanyData] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [shareableId, setShareableId] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [status, setStatus] = useState("");
  const { color, colors } = useContext(AppContext);

  useEffect(() => {
    if (!id) return;
    fetchCandidates();
  }, [id]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      if (id) {
        const result: any = await axios.get(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/shareable/candidates/?token=${id}`,
          {
            withCredentials: true,
          }
        );
        if (result) {
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
          setRecommendedCandidates(result?.data?.candidates);
          setJobPostingData(result?.data?.job_posting_data);
          setCompanyData(result?.data?.company);
          setShareableId(result?.data?.shareable_id);
          setStatus(result?.data?.status);
          setStatusMsg(result?.data?.message);
        }
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.Error
          ? err.response.data.Error
          : "Something went wrong!",
        {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const showFullData = (candidate: any) => {
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
  };

  return (
    <div className="">
      <div className="h-16">
        <DashboardHeader section="shared" />
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
            <div className="p-2 pl-5 w-1/3 mb-4 flex items-center text-sm md:text-lg font-bold">
              {companyData && companyData.logo ? (
                <Image
                  src={companyData.logo}
                  width={10000}
                  height={10000}
                  className="w-[200px] h-12"
                  alt=""
                />
              ) : (
                companyData?.name
              )}
            </div>
            {!loading && (
              <div className="flex justify-end">
                <div className="flex justify-end items-center">
                  <div className="flex flex-col items-start py-2 px-4 w-full justify-end">
                    <div className="flex justify-start items-left gap-4 w-full">
                      <div className="flex justify-end w-full items-center">
                        <div className="font-semibold">
                          {jobPostingData ? jobPostingData.title : "Title"}
                        </div>
                      </div>
                    </div>
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
                        <div className="text-[#060E39] text-sm" />
                        {jobPostingData && jobPostingData.city
                          ? jobPostingData.city + ", "
                          : ""}
                        {jobPostingData && jobPostingData.state
                          ? jobPostingData.state
                          : ""}
                        {jobPostingData && jobPostingData.country
                          ? ", " + jobPostingData.country
                          : ""}
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
                          {jobPostingData
                            ? jobPostingData.workLocation
                            : "Work Location"}
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
                            {jobPostingData
                              ? Math.abs(jobPostingData.compensation) > 999
                                ? Math.sign(jobPostingData.compensation) *
                                    Number(
                                      (
                                        Math.abs(jobPostingData.compensation) /
                                        1000
                                      ).toFixed(1)
                                    ) +
                                  "k"
                                : Math.sign(jobPostingData.compensation) *
                                  Math.abs(jobPostingData.compensation)
                              : "00.00"}
                          </span>{" "}
                          year
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {loading ? (
            <div className="mt-[30vh]">
              <Loader />
            </div>
          ) : recommendedCandidates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-5 gap-4 px-4">
              {recommendedCandidates.map((item: any, key: any) => (
                <ProfileCard
                  shareableId={shareableId}
                  detail={item}
                  showFullData={showFullData}
                  key={key}
                  color={color}
                  shared={true}
                  colors={colors}
                />
              ))}
            </div>
          ) : (
            <div className="h-[80vh] flex flex-col justify-center items-center">
              <div style={{ color: color?.primaryAccent }} className="mb-10">
                <div className="flex justify-center font-bold">{statusMsg}</div>
              </div>
              {status && status !== "success" && <BlogSection />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareableCandidatesPage;
