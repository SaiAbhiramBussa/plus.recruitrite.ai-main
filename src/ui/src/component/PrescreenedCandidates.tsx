import _ from "lodash";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getPreScreenedCandidates } from "../services/job";
import CandidateSmallCard from "./CandidateSmallCard";
import Loader from "./Loader";
import Pagination from "./Pagination";
export default function PrescreenedCandidates(props: any) {
  const router = useRouter();
  const jobid =
    router.query.id && router.query.id.length > 1 ? router.query.id[2] : null;
  const [candidatesData, setCandidatesData] = useState<any>({});
  const {
    selectAll,
    appendCandidates,
    populateCandidates,
    filterBySkillValue,
    selectAllFunction,
    refreshCount,
    selectedCandidates,
    handleSelectAllOnPageChange,
    setEmptyPic,
    color,
    colors,
  } = props;
  const [loading, setLoading] = useState(false);
  const [recommendedCandidates, setRecommendedCandidates] = useState<any>([]);
  const [pagingNumber, setPagingNumber] = useState(1);
  const [perPagingNumber, setPerPagingNumber] = useState(50);

  useEffect(() => {
    refreshCount();
  }, []);

  useEffect(() => {
    if (jobid) {
      const newUrl = router.asPath.replace(
        /\/[a-zA-Z0-9_-]+$/,
        `/pre-screening`
      );
      router.replace(newUrl);
    }
  }, [jobid]);

  useEffect(() => {
    if (!jobid) return;

    const debounce = setTimeout(() => {
      fetchPreScreenedCandidates(jobid, pagingNumber, perPagingNumber);
      handleSelectAllOnPageChange(false);
    }, 50);

    return () => clearTimeout(debounce);
  }, [jobid, pagingNumber, perPagingNumber, filterBySkillValue]);

  const handleCheckboxChange = (selectedCandidateId: any, isChecked: any) => {
    appendCandidates(selectedCandidateId, isChecked);
  };

  const PageNumberChange = (pageNumber: any) => {
    setPagingNumber(pageNumber);
  };

  const PerPageNumberChange = (perPageNumber: any) => {
    setPerPagingNumber(perPageNumber);
  };

  const fetchPreScreenedCandidates = async (
    jobid: any,
    pagingNumber: number,
    perPagingNumber: number
  ) => {
    setLoading(true);
    try {
      const candidateResponse: any = await getPreScreenedCandidates(
        jobid,
        pagingNumber,
        perPagingNumber
      );
      candidateResponse &&
        candidateResponse.data.candidates.map((item: any, index: any) => {
          _.update(candidateResponse, `data.candidates[${index}].picture`, () =>
            setEmptyPic(item.picture)
          );
        });
      let filteredData = candidateResponse?.data.candidates;
      if (filterBySkillValue) {
        filteredData = filteredData.filter((candidate: any) => {
          let results = candidate.skills.filter((item: any) =>
            item.skill.includes(filterBySkillValue)
          );
          return results.length > 0;
        });
      }
      setRecommendedCandidates(filteredData);
      setCandidatesData(candidateResponse?.data);
      populateCandidates(candidateResponse?.data, true);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ backgroundColor: color?.innerBg }}
      className="overflow-auto flex flex-col justify-between min-h-[calc(100vh-234px)]"
    >
      {loading && (
        <div className="flex items-center h-[50vh] justify-center w-100">
          <Loader />
        </div>
      )}
      {!recommendedCandidates?.length && !loading && jobid && (
        <div
          style={{ color: color?.primaryAccent }}
          className="flex h-[50vh] justify-center items-center font-bold"
        >
          No Pre-screened candidates for this profile
        </div>
      )}
      {!recommendedCandidates?.length && !loading && !jobid && (
        <div
          style={{ color: color?.primaryAccent }}
          className="flex h-[50vh] justify-center items-center font-bold"
        >
          Select a job
        </div>
      )}
      {recommendedCandidates && recommendedCandidates.length && !loading ? (
        <>
          <table className="table-auto overflow-y-auto">
            <thead
              style={{ backgroundColor: color?.innerBg }}
              className="sticky border-b top-0"
            >
              <tr>
                <th className="lg:w-1/12">
                  <input
                    type="checkbox"
                    style={{ accentColor: color?.primaryAccent }}
                    className="h-4 w-4 lg:ml-2 mr-1 xl:mr-2"
                    checked={selectAll}
                    onChange={selectAllFunction}
                  />{" "}
                </th>
                <th className="lg:w-1/12"> </th>
                <th className="lg:w-3/12 text-left">Name</th>
                <th className="lg:w-4/12 text-left">Location</th>
                <th className="lg:w-2/12 py-4 text-left pl-2">Skills</th>
                <th className="lg:w-1/12 py-4 text-left"> </th>
              </tr>
            </thead>
            <tbody>
              {recommendedCandidates.map((item: any) => (
                <CandidateSmallCard
                  tab="pre-screen"
                  selectAll={selectAll}
                  candidate_id={item.candidate_id}
                  first_name={item?.first_name}
                  last_name={item?.last_name}
                  skills={item.skills}
                  picture={item.picture}
                  recommendedCandidates={recommendedCandidates}
                  selectedCandidates={selectedCandidates}
                  onCheckboxChange={handleCheckboxChange}
                  pushToTrainingData={props.pushToTrainingDataHandler}
                  detail={item}
                  key={item.candidate_id}
                  color={color}
                  colors={colors}
                />
              ))}
            </tbody>
          </table>
          <div>
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
          </div>
        </>
      ) : (
        <div className="flex justify-center mt-10"></div>
      )}
    </div>
  );
}
