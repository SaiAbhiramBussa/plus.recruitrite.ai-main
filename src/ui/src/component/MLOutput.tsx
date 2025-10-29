import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import CandidateSmallCard from "./CandidateSmallCard";
import Loader from "./Loader";
import Pagination from "./Pagination";
import Modal from "./Modal";
import PublishModal from "./candidates/PublishModal";

export default function MLOutput(props: any) {
  const router = useRouter();
  const jobid =
    router.query.id && router.query.id.length > 1 ? router.query.id[2] : null;
  const {
    fetchMlOutputData,
    candidates,
    appendCandidates,
    selectAll,
    setSelectAll,
    selectAllFunction,
    refreshCount,
    candidatesData,
    loading,
    setSearch,
    selectedCandidates,
    setSelectedCandidates,
    publishCandidatesModal,
    setPublishCandidatesModal,
    setFalse,
    color,
    search,
    colors,
  } = props;
  const [pagingNumber, setPagingNumber] = useState(1);
  const [perPagingNumber, setPerPagingNumber] = useState(50);
  const [updatedCandidates, setUpdatedCandidates] = useState<any>([]);

  useEffect(() => {
    refreshCount();

    return () => {
      setSearch("");
    };
  }, []);

  useEffect(() => {
    if (selectedCandidates.length) {
      const candidatesData = candidates.filter((candidate: any) =>
        selectedCandidates.includes(candidate.candidate_id)
      );

      setUpdatedCandidates(candidatesData);
    }
  }, [selectedCandidates]);

  useEffect(() => {
    if (jobid) {
      const newUrl = router.asPath.replace(/\/[a-zA-Z0-9_-]+$/, `/ml-output`);
      router.replace(newUrl);
    }
  }, [jobid]);

  useEffect(() => {
    if (!jobid) return;

    const debounce = setTimeout(() => {
      fetchMlOutputData(pagingNumber, perPagingNumber);
    }, 50);

    return () => clearTimeout(debounce);
  }, [pagingNumber, perPagingNumber, jobid, search]);

  const handleCheckboxChange = (selectedCandidateId: any, isChecked: any) => {
    appendCandidates(selectedCandidateId, isChecked);
  };

  const PerPageNumberChange = (perPageNumber: any) => {
    setPerPagingNumber(perPageNumber);
  };

  const PageNumberChange = (pageNumber: any) => {
    setPagingNumber(pageNumber);
    setFalse();
    // handleSelectAllOnPageChange();
  };

  return (
    <div
      style={{ backgroundColor: color?.innerBg }}
      className="overflow-auto flex flex-col justify-between min-h-[calc(100vh-234px)]"
    >
      {loading && (
        <div className="flex items-center justify-center h-screen w-100">
          <Loader />
        </div>
      )}
      {!candidates.length && !loading && jobid && (
        <div
          style={{ color: color?.primaryAccent }}
          className="h-[50vh] flex justify-center items-center font-bold"
        >
          No candidates in ML Output for this profile
        </div>
      )}
      {!candidates.length && !loading && !jobid && (
        <div
          style={{ color: color?.primaryAccent }}
          className="h-[50vh] flex justify-center items-center font-bold"
        >
          Select a job
        </div>
      )}
      {candidates && candidates.length && !loading ? (
        <>
          <table className="table-auto w-full">
            <thead
              style={{ backgroundColor: color?.innerBg }}
              className="sticky top-0 border-b"
            >
              <tr>
                <th className="w-1/12">
                  <input
                    type="checkbox"
                    style={{ accentColor: color?.primaryAccent }}
                    className="h-4 w-4 mt-2"
                    checked={selectAll}
                    onChange={selectAllFunction}
                  />{" "}
                </th>
                <th className="w-1/12"></th>
                <th className="w-3/12 py-4 text-left">Name</th>
                <th className="w-3/12 text-left">Location</th>
                <th className="w-1/12 py-4 text-left pl-2">Skills</th>
                <th className="w-2/12 py-4 text-left">Source Type</th>
                <th className="w-1/12 py-4 text-left">Score</th>
                <th className="w-1/12 py-4 text-left"> </th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((item: any) => (
                <CandidateSmallCard
                  tab="ml-outout"
                  selectAll={selectAll}
                  onCheckboxChange={handleCheckboxChange}
                  page="mlOutput"
                  recommendedCandidates={candidates}
                  selectedCandidates={selectedCandidates}
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
          <div className="absolute top-0 bottom-0 right-0">
            <Modal
              open={publishCandidatesModal}
              setOpen={setPublishCandidatesModal}
              header="Publish Modal"
              section="publishModal"
            >
              {loading ? (
                <div className="w-full flex-col h-[90vh] flex items-center justify-center">
                  <Loader />
                </div>
              ) : (
                <div
                  style={{ backgroundColor: color?.innerBg }}
                  className="w-full align-bottom rounded-lg"
                >
                  <PublishModal
                    setSelectedCandidates={setSelectedCandidates}
                    selectedCandidates={updatedCandidates}
                    setPublishModal={setPublishCandidatesModal}
                    setSelectAll={setSelectAll}
                  />
                </div>
              )}
            </Modal>
          </div>
        </>
      ) : (
        <div className="flex justify-center mt-10"></div>
      )}
    </div>
  );
}
