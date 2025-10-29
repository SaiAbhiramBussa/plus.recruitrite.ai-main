import {
  faAngleLeft,
  faAngleRight,
  faArrowRight,
  faClipboard,
  faDollarSign,
  faGear,
  faGlobe,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import _ from "lodash";
import { useRouter } from "next/router";
import { Key, useEffect, useState } from "react";
import { colorToRGBA } from "../utils/misc";
import Pagination from "./Pagination";
import Loader from "./Loader";
import CandidateTraining from "./CandidateTraining";

export default function CamdidatesTraining(props: any) {
  const router = useRouter();
  const {
    selectedJob,
    candidates,
    fetchTrainingData,
    refreshCount,
    candidatesData,
    loading,
    deleteCandidates,
    appendRankedCandidates,
    setFalse,
    color,
    rankCandidates,
    search,
    setSearch,
    filterRankCandidates,
    handleRankCandidates,
    setFilterRankCandidates,
  } = props;
  const jobid =
    router.query.id && router.query.id.length > 1 ? router.query.id[2] : null;
  const [pagingNumber, setPagingNumber] = useState(1);
  const [perPagingNumber, setPerPagingNumber] = useState(50);
  const remoteType = [
    {
      key: "0",
      value: "Within State",
      option: "state",
      lower: "within state",
    },
    {
      key: "1",
      value: "Within country",
      option: "country",
      lower: "within country",
    },
    {
      key: "2",
      value: "Global",
      option: "any_region",
      lower: "any region",
    },
  ];
  const [candidate, setCandidate] = useState<any>(null);
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const labels = {
    future_title: 0,
    recent_title: 0,
    recent_skip_title: 0,
    exists_anywhere: 0,
    summary: 0,
  };
  const [labelCounts, setLabelCounts] = useState(labels);

  useEffect(() => {
    refreshCount();

    return () => {
      setSearch("");
    };
  }, []);

  useEffect(() => {
    if (jobid) {
      const newUrl = router.asPath.replace(
        /\/[a-zA-Z0-9_-]+$/,
        `/rank-candidates`
      );
      router.replace(newUrl);
    }
  }, [jobid]);

  useEffect(() => {
    if (candidates?.length) {
      setCandidate(candidates[candidateIndex]);
    }
  }, [candidates, candidateIndex]);

  useEffect(() => {
    let labelCounts: any = labels;

    candidates?.forEach((candidate: any) => {
      Object.keys(labels).forEach((label: string) => {
        if (candidate.labels[label]) {
          labelCounts[label] += 1;
        }
      });
    });

    setLabelCounts(labelCounts);
  }, [candidates]);

  useEffect(() => {
    if (!jobid) return;

    const debounce = setTimeout(() => {
      fetchTrainingData(pagingNumber, perPagingNumber, filterRankCandidates);
    }, 50);

    return () => clearTimeout(debounce);
  }, [pagingNumber, perPagingNumber, jobid, search]);

  const PerPageNumberChange = (perPageNumber: any) => {
    setPerPagingNumber(perPageNumber);
  };

  const handleRankChangeCandidates = (e: any) => {
    if (e.target.checked) {
      setFilterRankCandidates("unranked");
      handleRankCandidates("unranked");
    } else {
      setFilterRankCandidates("");
      handleRankCandidates("");
    }

    setCandidateIndex(0);
  };

  const PageNumberChange = (pageNumber: any) => {
    setPagingNumber(pageNumber);
    setCandidateIndex(0);
    setFalse();
  };

  return (
    <div>
      <div
        style={{ backgroundColor: color.innerBg, color: color.secondaryAccent }}
        className="flex gap-4 my-2"
      >
        <div className="w-[48vw] max-h-[90vh] flex-1 overflow-y-auto">
          <div className="font-semibold mx-2">{selectedJob?.title}</div>
          <div className="content flex flex-wrap justify-start ml-1 my-3">
            <span
              style={{
                color: colorToRGBA(color.secondaryAccent, color.opacity),
              }}
              className="mr-2 pr-4 border-r-2"
            >
              <FontAwesomeIcon className=" mx-1 h-4 w-4" icon={faGlobe} />
              {selectedJob?.state}
            </span>
            <span
              style={{
                color: colorToRGBA(color.secondaryAccent, color.opacity),
              }}
              className="ml-1 pr-4 mr-2 border-r-2"
            >
              <FontAwesomeIcon className=" mx-1 h-4 w-4" icon={faDollarSign} />
              {selectedJob && selectedJob.compensation
                ? Math.abs(selectedJob?.compensation) > 999
                  ? Math.sign(selectedJob.compensation) *
                      Number(
                        (Math.abs(selectedJob.compensation) / 1000).toFixed(1)
                      ) +
                    "k"
                  : Math.sign(selectedJob?.compensation) *
                    Math.abs(selectedJob?.compensation)
                : "-"}
            </span>
            <span
              style={{
                color: colorToRGBA(color.secondaryAccent, color.opacity),
              }}
              className="ml-1 pr-2"
            >
              <FontAwesomeIcon className=" mx-1 h-4 w-4" icon={faLocationDot} />
              {selectedJob && selectedJob.work_location_type}
              {selectedJob &&
                selectedJob.work_location_type === "remote" &&
                ` (${
                  _.find(
                    remoteType,
                    (type) => type.option === selectedJob.remote_type
                  )?.lower
                })`}
            </span>
          </div>
          <div
            style={{ backgroundColor: color.innerBg }}
            className="rounded-md"
          >
            <div>
              <div className="flex items-center justify-start">
                <FontAwesomeIcon
                  style={{
                    color: colorToRGBA(color.secondaryAccent, color.opacity),
                  }}
                  className="mx-2"
                  icon={faClipboard}
                />
                <h3 className="font-semibold text-base">Job Description</h3>
              </div>
              <div className="mx-5 my-3 font-light text-sm flex">
                <div
                  className="text-editor-priview text-justify flex-1"
                  dangerouslySetInnerHTML={{ __html: selectedJob?.description }}
                />
              </div>
            </div>
            <div>
              <div className="mt-10 flex items-center justify-start">
                <FontAwesomeIcon
                  style={{
                    color: colorToRGBA(color.secondaryAccent, color.opacity),
                  }}
                  className="mx-2"
                  icon={faGear}
                />
                <h3 className="font-semibold text-base">Mandatory Skillset</h3>
              </div>
              <div>
                <div className="ml-5 flex flex-wrap my-3 gap-2">
                  {selectedJob?.skills &&
                    selectedJob.skills.map((skill: any, index: Key) => (
                      <span
                        key={index}
                        style={{
                          color: color.primaryAccent,
                          backgroundColor: colorToRGBA(
                            color.primaryAccent,
                            0.1
                          ),
                        }}
                        className="rounded-md px-3 py-1.5 text-xs"
                      >
                        {skill.name}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          style={{ backgroundColor: color.outerBg }}
          className="w-1 h-[95vh] my-auto"
        />
        <div className="w-[51vw]">
          <div
            style={{ color: color.primaryAccent }}
            className="flex gap-5 items-center my-2"
          >
            <div
              className={`${
                candidatesData.total_pages - 1 ? "flex-wrap" : ""
              } flex items-center gap-3 w-full`}
              style={{
                backgroundColor: color.innerBg,
                justifyContent:
                  candidatesData.total_pages - 1 ? "space-between" : "flex-end",
              }}
            >
              {candidatesData.total_pages - 1 ? (
                <Pagination
                  setCurrentPage={candidatesData.current_page}
                  totalItems={candidatesData.total_count}
                  currentPage={candidatesData.current_page}
                  itemsPerPage={candidatesData.per_page}
                  totalPages={candidatesData.total_pages}
                  PageNumberChange={PageNumberChange}
                  PerPageNumberChange={PerPageNumberChange}
                  setPerPagingNumber={setPerPagingNumber}
                  perPagingNumber={perPagingNumber}
                  setPageNumber={setPagingNumber}
                />
              ) : null}
              {candidatesData.total_count ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    style={{ accentColor: color?.primaryAccent }}
                    className="w-4 h-4 rounded-md"
                    onChange={handleRankChangeCandidates}
                  />
                  <label>Unranked candidates only</label>
                </div>
              ) : null}
              {candidatesData.total_count && candidates.length ? (
                <div className="flex gap-4">
                  <span className="mx-4">
                    {candidatesData.total_count
                      ? (candidatesData.current_page - 1) *
                          candidatesData.per_page +
                        candidateIndex +
                        1
                      : 0}{" "}
                    of{" "}
                    {(candidatesData.current_page - 1) *
                      candidatesData.per_page +
                      candidatesData.total_count -
                      (candidatesData.total_count - candidates.length)}
                  </span>
                  <button
                    type="button"
                    disabled={candidateIndex === 0}
                    title="Previous"
                    onClick={() => {
                      setCandidateIndex(candidateIndex - 1);
                      rankCandidates(true);
                    }}
                    className="hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FontAwesomeIcon className="w-5 h-5" icon={faAngleLeft} />
                  </button>
                  <button
                    type="button"
                    disabled={
                      candidateIndex === candidates.length - 1 ||
                      !candidates.length
                    }
                    title="Next"
                    onClick={() => {
                      setCandidateIndex(candidateIndex + 1);
                      rankCandidates(true);
                    }}
                    className="hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FontAwesomeIcon className="w-5 h-5" icon={faAngleRight} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="relative flex w-full max-h-[87vh] px-3 overflow-y-scroll flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-[85vh] w-full">
                <Loader />
              </div>
            ) : !candidates.length ? (
              jobid ? (
                <div
                  style={{ color: color.primaryAccent }}
                  className="flex justify-center items-center w-full h-[85vh] font-bold"
                >
                  No candidates in training data for this profile
                </div>
              ) : (
                <div
                  style={{ color: color.primaryAccent }}
                  className="h-[50vh] flex justify-center items-center w-full font-bold"
                >
                  Select a job
                </div>
              )
            ) : candidate ? (
              <div className="flex flex-col gap-3 flex-1">
                <CandidateTraining
                  key={candidate.candidate_id}
                  recommendedCandidates={candidates}
                  selectedCandidates={deleteCandidates}
                  data={candidate}
                  color={color}
                  appendRankedCandidates={appendRankedCandidates}
                  rankCandidates={rankCandidates}
                  labelCounts={labelCounts}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
