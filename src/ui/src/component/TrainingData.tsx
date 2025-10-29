import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import CandidateSmallCard from "./CandidateSmallCard";
import Loader from "./Loader";
import Pagination from "./Pagination";
import Modal from "./Modal";
import PublishModal from "./candidates/PublishModal";

export default function TrainingData(props: any) {
  const router = useRouter();
  const jobid =
    router.query.id && router.query.id.length > 1 ? router.query.id[2] : null;
  const [updatedCandidates, setUpdatedCandidates] = useState<any>([]);

  const {
    deleteAll,
    appendtoDeleteCandidates,
    candidates,
    fetchTrainingData,
    refreshCount,
    deleteAllFunction,
    candidatesData,
    loading,
    search,
    setSearch,
    deleteCandidates,
    setFalse,
    color,
    publishCandidatesModal,
    setPublishCandidatesModal,
    setSelectAll,
    setSelectedCandidates,
    colors,
  } = props;

  const [pagingNumber, setPagingNumber] = useState(1);
  const [perPagingNumber, setPerPagingNumber] = useState(50);

  useEffect(() => {
    refreshCount();

    return () => {
      setSearch("");
    };
  }, []);

  useEffect(() => {
    if (!jobid) return;

    const debounce = setTimeout(() => {
      fetchTrainingData(pagingNumber, perPagingNumber);
    }, 50);

    return () => clearTimeout(debounce);
  }, [pagingNumber, perPagingNumber, jobid, search]);

  useEffect(() => {
    if (deleteCandidates.length) {
      const candidatesData = candidates.filter((candidate: any) =>
        deleteCandidates.includes(candidate.candidate_id)
      );

      setUpdatedCandidates(candidatesData);
    }
  }, [deleteCandidates]);

  useEffect(() => {
    if (jobid) {
      // router.replace(`${router.asPath}/ml-output`);
      const newUrl = router.asPath.replace(
        /\/[a-zA-Z0-9_-]+$/,
        `/training-data`
      );
      router.replace(newUrl);
    }
  }, [jobid]);

  const handleCheckboxChange = (toDeleteCandidateId: any, isChecked: any) => {
    appendtoDeleteCandidates(toDeleteCandidateId, isChecked);
  };

  const func = (cand_obj: any) => {
    props.appendRankedCandidates(cand_obj);
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
      {loading ? (
        <div className="flex items-center justify-center w-100 h-[72vh]">
          <Loader />
        </div>
      ) : !candidates?.length ? (
        jobid ? (
          <div
            style={{ color: color?.primaryAccent }}
            className="h-[50vh] flex justify-center items-center font-bold"
          >
            No candidates in training data for this profile
          </div>
        ) : (
          <div
            style={{ color: color?.primaryAccent }}
            className="h-[50vh] flex justify-center items-center font-bold"
          >
            Select a job
          </div>
        )
      ) : (
        <>
          <table className="table-auto w-full">
            <thead
              style={{ backgroundColor: color?.innerBg }}
              className="sticky border-b top-0"
            >
              <tr>
                <th className="w-1/12">
                  <input
                    type="checkbox"
                    className="h-4 w-4 lg:ml-3 mr-2 xl:mr-2"
                    checked={deleteAll}
                    onChange={deleteAllFunction}
                  />{" "}
                </th>
                <th className="w-1/12"> </th>
                <th className="w-3/12 py-4 text-left">Name</th>
                <th className="w-3/12 text-left">Location</th>
                <th className="w-1/12 py-4 text-left pl-2">Skills</th>
                <th className="w-2/12 py-4 text-left pl-2">Target Label</th>
                <th className="w-1/12 py-4 text-left"> </th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((item: any) => (
                <CandidateSmallCard
                  page="training"
                  tab="training"
                  func={func}
                  deleteAll={deleteAll}
                  onCheckboxChange={handleCheckboxChange}
                  recommendedCandidates={candidates}
                  selectedCandidates={deleteCandidates}
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
          </div>
        </>
      )}
    </div>
  );
}
