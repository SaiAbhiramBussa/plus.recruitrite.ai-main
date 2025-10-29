import React, { useContext, useEffect, useState } from "react";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import KanbanCardLayout from "@/src/component/KanbanCardLayout";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "@/src/component/Droppable";
import {
  faAnglesRight,
  faCloudDownload,
  faDownload,
  faGear,
  faMultiply,
  faRotateRight,
  faShare,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "@/src/component/Modal";
import KanbanSettings from "@/src/component/KanbanSettings";
import Breadcrumbs from "@/src/component/BreadCrumbs";
import axios from "axios";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getCandidatesBySkills,
  getOtherCandidate,
  postOtherCandidate,
} from "@/src/services/job";
import _, { join, pick } from "lodash";
import ShareUrlComponent from "@/src/component/ShareUrlComponent";
import OtherCandidates from "@/src/component/OtherCandidates";
import Pagination from "@/src/component/Pagination";
import Loader from "@/src/component/Loader";
import FileUpload from "@/src/component/FIleUpload";
import StartDateButton from "@/src/component/StartDateButton";
import Select from "react-select";
import { Option } from "@/src/common/common.comp";
import AppContext from "@/src/context/Context";
import { colorToRGBA } from "@/src/utils/misc";
import { showSuccessToast } from "@/src/common/common.util";

export default function KanbanBoard() {
  const router = useRouter();
  const companyid = router.query.id ? router.query.id[0] : null;
  const jobid =
    router.query.id && router.query.id.length > 1 ? router.query.id[2] : null;
  const { color, colors } = useContext(AppContext);
  const [boardData, setBoardData] = useState<any>();
  const [data, setData] = useState<any>();
  const [listColumns, setListColumns] = useState<any>();
  const [showKanbanSettings, setShowKanbanSettings] = useState(false);
  const [kanbanColumns, setKanbanColumns] = useState<any>();
  const [kanbanData, setKanbanData] = useState<any>();
  const [maxHeight, setMaxHeight] = useState<any>();
  const [otherPagingNumber, setOtherPagingNumber] = useState(1);
  const [otherPerPagingNumber, setOtherPerPagingNumber] = useState(50);
  const [companyName, setCompanyName] = useState<any>("");
  const [selectedCandidates, setSelectedCandidates] = useState<Array<any>>([]);
  const [isShareButtonDisabled, setIsShareButtonDisabled] =
    useState<boolean>(false);
  const [isShareLinkModalOpen, setIsShareLinkModalOpen] =
    useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [tab, setTab] = useState<string>("Kanban");
  const [otherLoading, setOtherLoading] = useState<boolean>(false);
  const [otherCandidates, setOtherCandidates] = useState<any>();
  const [isImportCandidateModalOpen, setIsImportCandidateModalOpen] =
    useState(false);
  const [isCandidateUploading, setIsCandidateUploading] =
    useState<boolean>(false);
  const [candidateCsvFile, setCandidateCsvFile] = useState<any>();
  const [role,setRole] = useState<any>();

  const OtherPerPageNumberChange = (perPageNumber: any) => {
    setOtherPerPagingNumber(perPageNumber);
  };

  const OtherPageNumberChange = (pageNumber: any) => {
    setOtherPagingNumber(pageNumber);
  };

  useEffect(() => {
    getCompanyName();
  }, []);

  useEffect(() => {
    if (!jobid) return;
    fetchJobPostingData(jobid);
  }, [jobid]);

  useEffect(() => {
    if (companyid) {
      fetchKanbanColumns();
    }
  }, [showKanbanSettings, companyid]);

  useEffect(() => {
    if (!jobid) {
      return;
    }
    fetchCandidates();
    fetchOtherCandidates(otherPagingNumber, otherPerPagingNumber);
  }, [jobid, otherPagingNumber, otherPerPagingNumber]);

  useEffect(() => {
    if (boardData) traverseCandidates();
  }, [kanbanColumns, boardData]);

  const fetchJobPostingData = async (id: any) => {
    // setLoading(true);
    try {
      let res = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/${id}`,
        {
          withCredentials: true,
        }
      );
      let resData = res.data;
      if (resData.subscription_type === "full_service") {
        router.push(`/company/${companyid}/kanban/${jobid}`);
      }
      const attributesToJoin = ["city", "state", "country"];
      const separator = ", ";
      const pickedAttributes = pick(resData, attributesToJoin);
      const joinedString = join(Object.values(pickedAttributes), separator);
      resData.jobLocation = joinedString;
      setData(resData);
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      // setLoading(false);
    }
  };

  const setEmptyPic = (picureURL: string): string => {
    return picureURL
      ? picureURL
      : `https://startdate-images-1.s3.us-west-1.amazonaws.com/startdate-avatar/${
          Math.floor(Math.random() * 6) + 1
        }.png`;
  };

  const fetchKanbanColumns = async () => {
    let result = await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/kanban-board`,
      {
        withCredentials: true,
      }
    );
    const sortedStages =
      result &&
      result.data &&
      result.data.sort((a: any, b: any) => a.stage_order - b.stage_order);
    setKanbanColumns(sortedStages);
    setKanbanData(sortedStages);
  };

  const uploadCSVFile = async () => {
    if (!candidateCsvFile) return;

    let payload = new FormData();
    payload.append("other_candidates", candidateCsvFile);
    setIsCandidateUploading(true);

    await postOtherCandidate(payload, jobid)
      .then((response) => {
        if (response.success) {
          let data = response.data?.data;

          showSuccessToast(
            "Candidates Pushed to ML Screening Queue! Please wait for a while.",
            !data?.queued ? "error" : data?.failed ? "warning" : undefined
          );
        }
      })
      .finally(() => {
        setIsCandidateUploading(false);
        setIsImportCandidateModalOpen(false);
      });

    setCandidateCsvFile(null);
  };

  const fetchOtherCandidates = async (
    pagingNumber: any,
    perPagingNumber: number
  ) => {
    setOtherLoading(true);
    await getOtherCandidate(pagingNumber, perPagingNumber, jobid, true)
      .then((result: any) => {
        if (result.data) {
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
        }
        setOtherCandidates(result.data);
      })
      .finally(() => setOtherLoading(false));
  };

  const fetchCandidates = async () => {
    try {
      if (jobid) {
        const result: any = await getCandidatesBySkills(jobid);
        if (result) {
          result &&
            result.data.candidates &&
            result?.data?.candidates.map((item: any, index: any) => {
              _.update(result, `data.candidates[${index}].picture`, () =>
                setEmptyPic(item.picture)
              );
            });
          setBoardData(result?.data["candidates"]);
        }
      }
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
    }
  };

  useEffect(() => {
    const mHeight = calculateMaxHeight();
    setMaxHeight(mHeight);
  }, [kanbanColumns, kanbanData]);

  const traverseCandidates = () => {
    if (kanbanColumns && kanbanData) {
      const updatedArray = kanbanData.map((object: any) => {
        return {
          ...object,
          candidates: [], // Replace "value" with the desired value for the new attribute
        };
      });

      boardData &&
        boardData.forEach((candidate: any) => {
          const stage = updatedArray.find(
            (stage: any) => stage.stage_id === candidate.hiring_stage_id
          );
          if (stage) {
            stage.candidates.push(candidate);
          }
        });

      setKanbanData(updatedArray);

      kanbanColumns.map((col: any, key: any) => {
        const filteredObjects =
          boardData &&
          boardData.filter(
            (candidate: any) => candidate.hiring_stage_id === col.stage_id
          );
      });
    }
  };

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId, type } = result;
    // const cardData = JSON.parse(event.dataTransfer.getData('text/plain'));
    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    if (type === "list") {
      const newLists = Array.from(listColumns);
      const [draggedList] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, draggedList);

      setListColumns(newLists);
    } else if (type === "card") {
      if (destination.droppableId === source.droppableId) {
        let temp: any = listColumns.find(
          (list: any) => list.id === source.droppableId
        );
        let selected = Array.from(temp.candidates);
        const [draggedCard] = selected.splice(source.index, 1);
        selected.splice(destination.index, 0, draggedCard);
        const newLists = listColumns.map((list: any) => {
          if (list.id === source.droppableId) {
            return { ...list, candidates: selected };
          } else if (list.id === destination.droppableId) {
            return { ...list, candidates: selected };
          }
          return list;
        });
        const jsonString = JSON.stringify(newLists);
        localStorage.setItem("kanban", jsonString);
        setListColumns(newLists);
        return;
      }
      // Handle dragging cards

      const sourceList: any = kanbanData.find(
        (list: any) => list.stage_order === parseInt(source.droppableId) + 1
      );

      const destinationList: any = kanbanData.find(
        (list: any) =>
          list.stage_order === parseInt(destination.droppableId) + 1
      );

      const newSourceCards = Array.from(sourceList.candidates);

      let [draggedCard]: any = newSourceCards.splice(source.index, 1);
      const newListType: any = kanbanData.find(
        (item: any) =>
          item.stage_order === parseInt(destination.droppableId) + 1
      );
      draggedCard.hiring_stage_id = newListType.stage_id;

      const newDestinationCards = Array.from(destinationList.candidates);

      newDestinationCards.splice(destination.index, 0, draggedCard);

      const newLists = kanbanData.map((list: any) => {
        if (list.stage_order === parseInt(source.droppableId) + 1) {
          return { ...list, candidates: newSourceCards };
        } else if (list.stage_order === parseInt(destination.droppableId) + 1) {
          return { ...list, candidates: newDestinationCards };
        }
        return list;
      });

      const updatedBoardData =
        boardData &&
        boardData.map((candidate: any) => {
          if (candidate.candidate_id === draggedCard.id) {
            return { ...candidate, hiring_stage_id: destinationList.stage_id };
          }
          return candidate;
        });

      try {
        const res = await axios.put(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/${jobid}/kanban-board-candidate`,
          {
            hiring_stage_id: destinationList.stage_id,
            job_posting_candidate_id: draggedCard.job_posting_candidate_id,
          },
          { withCredentials: true }
        );
        if (res.status === 200) {
          toast.success(res.data.Message, {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
          setBoardData(updatedBoardData);
          setKanbanData(newLists);
        }
      } catch (err: any) {
        toast.warn(err.response.data.Message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
    }
  };

  const closeKanbanSettings = () => {
    setShowKanbanSettings(false);
  };

  const moveToKanban = async () => {
    if (!selectedCandidates.length) {
      toast.error("Please select candidates to move to Kanban");
      return;
    }
    try {
      setIsShareButtonDisabled(true);
      await axios
        .put(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/${jobid}/other_candidates`,
          { candidates_id: selectedCandidates },
          {
            withCredentials: true,
          }
        )
        .then((res) => {
          fetchCandidates();
          setSelectedCandidates([]);
          // console.log(otherCandidates?.candidates.filter((item: any)=> !selectedCandidates.includes(item.candidate_id)))
          setOtherCandidates({
            ...otherCandidates,
            candidates: otherCandidates?.candidates.filter(
              (item: any) => !selectedCandidates.includes(item.candidate_id)
            ),
          });
          toast.success("Moved to Kanban", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
        });
    } catch (err: any) {
      console.log(err);
      toast.error(
        `${
          err?.response.data.Error
            ? err?.response.data.Error
            : "Something went wrong"
        }`,
        {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 10000,
          hideProgressBar: true,
        }
      );
    } finally {
      setIsShareButtonDisabled(false);
    }
  };

  const shareCandidate = async () => {
    if (!selectedCandidates.length) {
      toast.error("Please select candidates to share");
      return;
    }
    try {
      setIsShareButtonDisabled(true);
      await axios
        .post(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/shareable/candidates/`,
          { job_posting_id: jobid, candidates_ids: selectedCandidates },
          {
            withCredentials: true,
          }
        )
        .then((res) => {
          setIsShareLinkModalOpen(true);
          setShareUrl(res.data?.url);
          toast.success("Shareable link generated", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
        });
    } catch (err: any) {
      toast.error(
        `${
          err?.response.data.Error
            ? err?.response.data.Error
            : "Something went wrong"
        }`,
        {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 10000,
          hideProgressBar: true,
        }
      );
    } finally {
      setIsShareButtonDisabled(false);
    }
  };

  const refreshButtonHandler = () => {
    tab === "Imported Candidates"
      ? fetchOtherCandidates(otherPagingNumber, otherPerPagingNumber)
      : fetchCandidates();
  };

  const selectCandidate = (candidateId: string) => {
    let updatedCandidateList = selectedCandidates;
    updatedCandidateList.push(candidateId);
    setSelectedCandidates([...updatedCandidateList]);
  };

  const removeCandidate = (candidateId: string) => {
    let updatedCandidateList = selectedCandidates;
    updatedCandidateList = updatedCandidateList.filter(
      (candidate) => candidate != candidateId
    );
    setSelectedCandidates([...updatedCandidateList]);
  };

  const openKanbanSettings = () => {
    setShowKanbanSettings(true);
  };

  const updateKanban = (list: any) => {
    setKanbanColumns(list);
  };

  const calculateMaxHeight = () => {
    if (boardData) {
      let maxHeight = 1;
      kanbanColumns &&
        kanbanColumns.forEach((column: any) => {
          const filteredCards: any =
            boardData &&
            boardData.filter(
              (card: any) => card.hiring_stage_id === column.stage_id
            );
          if (filteredCards?.length > maxHeight) {
            maxHeight = filteredCards.length;
          }
        });
      return maxHeight;
    }
  };

  const getCompanyName = () => {
    let user = localStorage.getItem("user");
    if (user) {
      let userJson = JSON.parse(user);
      setCompanyName(userJson?.first_name ? userJson.first_name : "");
      setRole(userJson?.role);
    }
  };

  const openAIResult = async () => {
    try {
      let payload = {
        job_posting_id: jobid,
      };
      let res: any = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/candidate_openai_push`,
        payload,
        {
          withCredentials: true,
        }
      );
      if (res.status === 200) {
        toast.success(res.data?.Message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        return res;
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message
          ? err.response?.data?.message
          : err.response?.data?.error,
        {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        }
      );
    }
  };

  const handleDownloadCandidates = async () => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/recommended/${jobid}/download`,
      {
        withCredentials: true,
      }
    );

    if (response.status === 200) {
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${jobid}-${Date.now()}.csv`; // Default filename
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "text/csv",
        })
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.log("Something went wrong!");
    }
  };

  let options = [
    {
      action: refreshButtonHandler,
      label: `Refresh`,
      icon: faRotateRight,
      isDisabled: false,
      value: "refresh",
    },
    {
      action: openAIResult,
      label: `ChatGPT Result`,
      icon: faDownload,
      isDisabled: false,
      value: "gptResult",
    },
    {
      action: shareCandidate,
      label: `Share`,
      icon: faShare,
      isDisabled: !selectedCandidates.length || isShareButtonDisabled,
      value: "share",
    },
    {
      action: () => setIsImportCandidateModalOpen(true),
      label: `Import Candidates `,
      icon: faUpload,
      isDisabled: false,
      value: "other_candidates",
    },
    {
      action: handleDownloadCandidates,
      label: `Download Candidates`,
      icon: faCloudDownload,
      isDisabled: false,
      value: "downloadCandidates",
    },
  ];

  const [actionList, setActionList] = useState<Array<any>>(options);
  const [selectedAction, setSelectedAction] = useState<any>();

  useEffect(() => {
    tab === "Imported Candidates"
      ? setActionList([
          ...options,
          {
            action: moveToKanban,
            label: `Move To Kanban `,
            icon: faAnglesRight,
            isDisabled: !selectedCandidates.length || isShareButtonDisabled,
            value: "moveToKanban",
          },
        ])
      : setActionList([
          ...options,
          {
            action: openKanbanSettings,
            label: `Setting `,
            icon: faGear,
            isDisabled: false,
            value: "setting",
          },
        ]);
  }, [tab, selectedCandidates, isShareButtonDisabled]);

  const handleActionSelect = (event: any) => {
    setSelectedAction(event?.value);
    event.action();
  };

  const customStyles = {
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

  return (
    <div>
      <DashboardHeader companyName={companyName} section="companies" />
      <br />
      <br />
      <div
        style={{
          backgroundColor: color?.outerBg,
          color: color?.secondaryAccent,
        }}
        className="px-6 pb-6 pt-10"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="p-2 relative"
        >
          <div className="flex justify-between">
            <div className="p-2 flex items-center">
              <Breadcrumbs title={""} link={role === "admin" ? "/admin/jobs" : "/dashboard"} backPage="" />
              <div>
                <div className="font-semibold">
                  {data ? data.title : "Title"}
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
                    <div className="text-sm" />
                    {data && data.city ? data.city + ", " : ""}
                    {data && data.state ? data.state : ""}
                    {data && data.country ? ", " + data.country : ""}
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
                      {data ? data.workLocation : "Work Location"}
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
                        {data
                          ? Math.abs(data.compensation) > 999
                            ? Math.sign(data.compensation) *
                                Number(
                                  (Math.abs(data.compensation) / 1000).toFixed(
                                    1
                                  )
                                ) +
                              "k"
                            : Math.sign(data.compensation) *
                              Math.abs(data.compensation)
                          : "00.00"}
                      </span>{" "}
                      year
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-row items-center mt-3 mb-5">
              <Select
                options={actionList}
                value={selectedAction}
                onChange={handleActionSelect}
                placeholder="Select Action"
                className="w-full md:w-48 lg:w-64 md:mt-0 flex justify-end md:block mr-2"
                components={{ Option }}
                styles={customStyles}
              />
            </div>
          </div>
          <Modal
            open={isImportCandidateModalOpen}
            setOpen={setIsImportCandidateModalOpen}
            section="candidateImport"
            header="Import Candidates"
          >
            <FileUpload
              setFile={setCandidateCsvFile}
              file={candidateCsvFile}
              accept=".csv,.xlsx"
            />
            <div className="flex items-center justify-end">
              <div className="flex gap-1 mt-6">
                <StartDateButton
                  isDisabled={isCandidateUploading ? true : false}
                  action={uploadCSVFile}
                  btnLabel={isCandidateUploading ? "Please wait..." : "Upload"}
                  icon={faUpload}
                />
                <StartDateButton
                  isDisabled={isCandidateUploading ? true : false}
                  action={() => setCandidateCsvFile("")}
                  btnLabel={"Clear"}
                  icon={faMultiply}
                />
              </div>
            </div>
          </Modal>

          <div className="flex items-center px-2 w-full justify-between mb-4">
            <div
              style={{
                borderColor: colorToRGBA(
                  color?.secondaryAccent,
                  color?.opacity
                ),
              }}
              className="text-sm  w-full font-medium text-center border-b"
            >
              <button
                style={
                  tab == "Kanban"
                    ? {
                        color: color?.primaryAccent,
                        borderColor: color?.primaryAccent,
                      }
                    : {
                        color: color?.secondaryAccent,
                      }
                }
                className={`${
                  tab == "Kanban"
                    ? "inline-block p-4 border-b-2 rounded-t-lg active"
                    : "inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:opacity-75"
                }`}
                onClick={() => {
                  setTab("Kanban");
                  setSelectedCandidates([]);
                }}
              >
                Kanban
              </button>
              <button
                style={
                  tab == "Imported Candidates"
                    ? {
                        color: color?.primaryAccent,
                        borderColor: color?.primaryAccent,
                      }
                    : {
                        color: color?.secondaryAccent,
                      }
                }
                className={`${
                  tab == "Imported Candidates"
                    ? "inline-block p-4 border-b-2 rounded-t-lg active"
                    : "inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:opacity-75"
                }`}
                onClick={() => {
                  setTab("Imported Candidates");
                  setSelectedCandidates([]);
                }}
              >
                Imported Candidates
              </button>
            </div>
          </div>

          {tab === "Kanban" && (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex overflow-auto h-[65vh] min-h-[75vh]">
                {kanbanColumns &&
                  kanbanData?.map((board: any, bIndex: any) => {
                    if (
                      board.stage_name === "Revealed Candidates" &&
                      board.candidates &&
                      board.candidates.length === 0
                    )
                      return;
                    else
                      return (
                        <div key={bIndex}>
                          <StrictModeDroppable
                            droppableId={bIndex.toString()}
                            type="card"
                          >
                            {(provided, snapshot) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                              >
                                <div
                                  style={{
                                    backgroundColor: color?.kanbanBgAccent,
                                  }}
                                  className={`w-80 mr-5 rounded-md shadow-md ${
                                    snapshot.isDraggingOver && "bg-green-100"
                                  }`}
                                >
                                  <div
                                    style={{
                                      backgroundColor: color?.outerBg,
                                      color: color?.primaryAccent,
                                    }}
                                    className="p-3 flex justify-between items-center text-sm sticky top-0 z-0"
                                  >
                                    {board.stage_name} (
                                    {board.candidates
                                      ? board.candidates.length
                                      : 0}
                                    )
                                  </div>
                                  <div
                                    className="px-2 z-10 pt-2"
                                    style={{
                                      height: `${maxHeight * 350}px`,
                                      minHeight: `550px`,
                                    }}
                                  >
                                    <div className="h-[72vh]">
                                      {/* {BoardData.length > 0 && BoardData.filter((obj: any) => obj.stage_id === board.stage_id) */}
                                      {board.candidates &&
                                        board.candidates.length > 0 &&
                                        board.candidates.map(
                                          (item: any, iIndex: any) => {
                                            return (
                                              <Draggable
                                                key={item.candidate_id}
                                                draggableId={item.candidate_id}
                                                index={iIndex}
                                              >
                                                {(provided) => (
                                                  <div
                                                    className="kanban-card"
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    ref={provided.innerRef}
                                                  >
                                                    <KanbanCardLayout
                                                      detail={item}
                                                      key={item.candidate_id}
                                                      selectedCandidatesList={
                                                        selectedCandidates
                                                      }
                                                      selectCandidate={
                                                        selectCandidate
                                                      }
                                                      removeCandidate={
                                                        removeCandidate
                                                      }
                                                      color={color}
                                                      colors={colors}
                                                    />
                                                  </div>
                                                )}
                                              </Draggable>
                                            );
                                          }
                                        )}
                                      {provided.placeholder}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </StrictModeDroppable>
                        </div>
                      );
                  })}
              </div>
            </DragDropContext>
          )}

          {tab === "Imported Candidates" && (
            <div className="tab2">
              {otherLoading ? (
                <div className="mt-[30vh] mb-[30vh]">
                  <Loader />
                </div>
              ) : (
                <OtherCandidates
                  candidates={otherCandidates.candidates}
                  selectedCandidatesList={selectedCandidates}
                  selectCandidate={selectCandidate}
                  color={color}
                  removeCandidate={removeCandidate}
                  colors={colors}
                />
              )}
              {!otherLoading &&
                otherCandidates.candidates &&
                otherCandidates.candidates.length > 0 && (
                  <div className="bottom-0 absolute w-[99%] m-auto ">
                    <Pagination
                      setCurrentPage={otherCandidates.current_page}
                      totalItems={otherCandidates.total_count}
                      currentPage={otherCandidates.current_page}
                      itemsPerPage={otherCandidates.per_page}
                      totalPages={otherCandidates.total_pages}
                      PageNumberChange={OtherPageNumberChange}
                      PerPageNumberChange={OtherPerPageNumberChange}
                      setPerPagingNumber={setOtherPerPagingNumber}
                      setPageNumber={setOtherPagingNumber}
                      perPagingNumber={otherPerPagingNumber}
                    />
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
      <Modal
        open={showKanbanSettings}
        setOpen={setShowKanbanSettings}
        header="Customize Your Kanban Board!"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="w-full align-bottom rounded-lg overflow-hidden"
        >
          <KanbanSettings
            updateKanban={updateKanban}
            closeKanbanSettings={closeKanbanSettings}
            listColumns={kanbanColumns}
            companyid={companyid}
            color={color}
          />
        </div>
      </Modal>
      <Modal
        open={isShareLinkModalOpen}
        setOpen={setIsShareLinkModalOpen}
        section="shareLink"
        header="Sharable Link"
      >
        <ShareUrlComponent shareUrl={shareUrl} color={color} />
      </Modal>
    </div>
  );
}
