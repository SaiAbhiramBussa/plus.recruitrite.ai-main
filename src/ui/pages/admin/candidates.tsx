import React, { useContext, useEffect, useState } from "react";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import axios from "axios";
import Loader from "@/src/component/Loader";
import ProfileCard from "@/src/component/ProfileCard";
import Pagination from "@/src/component/Pagination";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthGuard from "@/src/component/AuthGuard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faRotateRight,
  faSearch,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { faLinkedin, faSearchengin } from "@fortawesome/free-brands-svg-icons";
import Modal from "@/src/component/Modal";
import PublishModal from "@/src/component/candidates/PublishModal";
import { useRouter } from "next/router";
import CandidateDetailModal from "@/src/component/CandidateDetailModal";
import AdvanceSearch from "@/src/component/candidates/AdvanceSearch";
import Select from "react-select";
import _ from "lodash";
import { Option } from "@/src/common/common.comp";
import { colorToRGBA } from "@/src/utils/misc";
import dynamic from "next/dynamic";
import AppContext from "@/src/context/Context";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

const AdminCandidatesDashboard = () => {
  const [perPagingNumber, setPerPagingNumber] = useState(50);
  const [pagingNumber, setPagingNumber] = useState(1);
  const [keywordQuery, setKeywordQuery] = useState("");
  const [isAdvancedSearch, setIsAdvancedSearch] = useState<boolean>(false);
  const [advanceSearchQuery, setAdvanceSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems]: any = useState([]);
  const [checkedProfiles, setCheckedProfiles]: any = useState([]);
  const [isCandidatePage, setIsCandidatePage] = useState<boolean>(true);
  const [publishModal, setPublishModal] = useState<boolean>(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [candidate, setCandidate] = useState({});
  const [advanceSearch, setAdvanceSearch] = useState<boolean>(false);
  const [selectedAction, setSelectedAction] = useState("");
  const [advSearchFilters, setAdvSearchFilters] = useState<any>();
  const [displayFilters, setDisplayFilters] = useState<any>({});
  const router = useRouter();
  const { color, customStyles, colors } = useContext(AppContext);
  const [companies, setCompanies] = useState([]);
  const [searchTerm,setSearchTerm]= useState("");

  useEffect(() => {
    if (router.query?.id) {
      getCandidateById(router.query.id);
    }
  }, [router.isReady]);

  const getCandidateById = async (id: any) => {
    setLoading(true);
    await axios
      .get(`${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/${id}`, {
        withCredentials: true,
      })
      .then((res) => {
        setCandidateModalOpen(true);
        setCandidate(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      getCandidatesForAdmin(
        isAdvancedSearch || advanceSearchQuery
          ? advanceSearchQuery
          : keywordQuery
      );
    }, 500);

    return () => clearTimeout(debounce);
  }, [pagingNumber, perPagingNumber]);

  const setEmptyPic = (picureURL: string): string => {
    return picureURL
      ? picureURL
      : `https://startdate-images-1.s3.us-west-1.amazonaws.com/startdate-avatar/${
          Math.floor(Math.random() * 6) + 1
        }.png`;
  };


  const getCandidatesForAdmin = async (query: any) => {
    try {
      setLoading(true);
      await axios
        .get(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/view?page=${pagingNumber}&per_page=${perPagingNumber}&keyword=${query}`,
          {
            withCredentials: true,
          }
        )
        .then((result) => {
          result &&
            result.data.candidates_data?.map((item: any, index: any) => {
              _.update(result, `data.candidates_data[${index}].picture`, () =>
                setEmptyPic(item.picture)
              );
            });
          setItems(result.data);
        });
    } catch (err: any) {
      toast.error(err?.message, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };
  const PerPageNumberChange = (perPageNumber: any) => {
    setPerPagingNumber(perPageNumber);
  };

  const PageNumberChange = (pageNumber: any) => {
    setPagingNumber(pageNumber);
  };

  const handleSearch = (event: any) => {
    event.preventDefault();
    getCandidatesForAdmin(isAdvancedSearch ? advanceSearchQuery : keywordQuery);
  };

  const refreshButtonHandler = () => {
    getCandidatesForAdmin(isAdvancedSearch ? advanceSearchQuery : keywordQuery);
    setCheckedProfiles([]);
    setAdvSearchFilters({});
    setSelectedCandidates([]);
  };

  const options: any = [
    { value: "refresh", label: `Refresh`, icon: faRotateRight },
    {
      value: "scrape",
      label: `Scrape (${checkedProfiles.length})`,
      icon: faLinkedin,
      isDisabled: checkedProfiles.length > 0 ? false : true,
    },
    {
      value: "publish",
      label: `Publish (${checkedProfiles.length})`,
      icon: faUpload,
      isDisabled: checkedProfiles.length > 0 ? false : true,
    },
    { value: "advance_search", label: `Advance Search`, icon: faSearchengin },
  ];

  const changeCheckedProfiles = (profileLink: any, isChecked: any) => {
    if (isChecked) {
      setCheckedProfiles([...checkedProfiles, profileLink]);
    } else {
      setCheckedProfiles(
        checkedProfiles.filter((link: any) => link !== profileLink)
      );
    }
  };

  const handleSendMessage = (profiles: any) => {
    chrome.runtime.sendMessage("ploppifmdbakcbhegknmoafjokmmegda", {
      message: "scrapeProfile",
      profile_link: profiles,
    });
    setCheckedProfiles([]);
  };

  const openPublishModal = (profiles: any) => {
    setPublishModal(true);
    // const data = {'message': 'scrapeProfile', 'profile_link': profiles};
    // const extensionIds = ['dlekdiihloidboifgfkjnblcgfaompdc','fmmhkfjeddbkinophlbdjjkipjpcdpab','jkijeimlmgiodmmeckejnkmigddfonoa','bojahnmblmmjlpgfebpeoekfjmbgedje']
    // extensionIds.map((extensionId: any) => chrome.runtime.sendMessage(extensionId, data))
    // setCheckedProfiles([])
  };

  const openAdvanceSearch = () => {
    if (advanceSearch) {
      setAdvanceSearch(false);
    } else {
      setAdvanceSearch(true);
    }
  };

  const closeAdvanceSearch = () => {
    setIsAdvancedSearch(false);
    setAdvanceSearch(false);
  };

  const handleActionSelect = (event: any) => {
    const selectedValue = event.value;
    setSelectedAction(selectedValue);
    if (selectedValue === "refresh") {
      refreshButtonHandler();
    } else if (selectedValue === "scrape") {
      handleSendMessage(checkedProfiles);
    } else if (selectedValue === "publish") {
      openPublishModal(checkedProfiles);
    } else if (selectedValue === "advance_search") {
      openAdvanceSearch();
    }
  };

  const updateCandidateProfileCard = (data: any) => {
    const candidate_id = data.candidate_id;

    const updatedCandidates = items?.candidates_data.map((candidate: any) => {
      if (candidate.candidate_id === candidate_id) {
        return data;
      }
      return candidate;
    });

    const updatedItems = {
      ...items,
      candidates_data: updatedCandidates,
    };

    setItems(updatedItems);
  };

  const removeFilter = (item: any) => {
    const updatedObject = { ...displayFilters };
    delete updatedObject[item];
    setDisplayFilters(updatedObject);
    const keys = Object.keys(updatedObject);
    const values = Object.values(updatedObject);
    const test = keys.map((key, index) => {
      const val = key + "=" + values[index];
      return val;
    });
    let queryString = test.join("&");
    (queryString = "&advanced_search=true&" + queryString),
      setAdvanceSearchQuery(queryString);
    getCandidatesForAdmin(queryString);
  };

  return (
    <div className="min-h-screen">
      <div className="h-16">
        <DashboardHeader companyName="Admin" section="candidates" />
      </div>

      <div
        style={{
          backgroundColor: color?.outerBg,
          color: color?.secondaryAccent,
        }}
        className="flex flex-col w-full grow min-h-full px-6"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="flex flex-col px-4 w-full h-full min-h-[89vh] relative my-6 rounded-sm"
        >
          <div className="flex w-full justify-between items-center my-4">
            <div className="text-lg font-bold cursor-pointer">Candidates</div>
            {displayFilters && (
              <div className="flex ml-4 flex-wrap">
                {Object.keys(displayFilters).length > 0 &&
                  Object.keys(displayFilters).map(
                    (key, index) =>
                      displayFilters[key] && (
                        <div key={index}>
                          <div
                            key={key}
                            className="inline-flex items-center hustify-center rounded-full py-1 px-1"
                          >
                            <button
                              style={{
                                backgroundColor: colorToRGBA(
                                  color?.primaryAccent,
                                  0.1
                                ),
                                color: color?.primaryAccent,
                              }}
                              className="w-max mr-1 cursor-default items-center justify-center h-6 md:h-6 rounded-md px-2"
                            >
                              <div className="text-xs">
                                {displayFilters[key]}{" "}
                                <span
                                  onClick={() => removeFilter(key)}
                                  className="cursor-pointer"
                                >
                                  x
                                </span>
                              </div>
                            </button>
                          </div>
                        </div>
                      )
                  )}
              </div>
            )}
            <div className="flex flex-wrap sm:flex-nowrap w-full items-center justify-end ">
              {/* <h2 className="font-semibold text-base justify-start">Candidates</h2> */}
              <Select
                options={options}
                value={selectedAction}
                onChange={handleActionSelect}
                placeholder="Select Action"
                className="w-full text-sm font-normal md:w-48 lg:w-64 md:mt-0 flex justify-end md:block mr-2"
                components={{ Option }}
                styles={customStyles}
              />
              <div
                style={{ borderColor: color?.outerBg }}
                className="flex gap-3 items-center border mr-4 rounded"
              >
                <FontAwesomeIcon
                  icon={faSearch}
                  style={{ borderColor: color?.outerBg }}
                  className="px-3 border-r"
                />
                <input
                  style={{ backgroundColor: color?.innerBg }}
                  type="text"
                  className="text-sm border-0 focus:border-0 focus:outline-0 mr-4 py-2 pr-3 rounded"
                  placeholder="Keyword Search"
                  value={keywordQuery}
                  onChange={(e) => setKeywordQuery(e.target.value)}
                  onKeyDown={(e: any) => {
                    if (e.keyCode === 13) handleSearch(e);
                  }}
                />
              </div>
              <ButtonWrapper
                onClick={handleSearch}
                classNames="flex items-center justify-center rounded border border-transparent px-5 py-2 text-sm font-medium shadow-sm focus:outline-none"
              >
                <FontAwesomeIcon className="mx-1" icon={faMagnifyingGlass} />
                <span className="mx-1 hidden lg:block">Search</span>
              </ButtonWrapper>
            </div>
          </div>
          {loading === true ? (
            <div className="mt-[10%] h-screen">
              <Loader />
            </div>
          ) : items?.candidates_data && items.candidates_data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-2 gap-4 mt-2">
              {items?.candidates_data?.map((item: any) => (
                <ProfileCard
                  updateCandidateProfileCard={updateCandidateProfileCard}
                  isCandidatePage={isCandidatePage}
                  checkedProfiles={checkedProfiles}
                  changeCheckedProfiles={changeCheckedProfiles}
                  detail={item}
                  key={item.candidate_id}
                  admin={true}
                  selectedCandidates={selectedCandidates}
                  setSelectedCandidates={setSelectedCandidates}
                  color={color}
                  colors={colors}
                />
              ))}
            </div>
          ) : (
            <div
              style={{ color: color?.primaryAccent }}
              className="h-[80vh] flex items-center justify-center font-bold"
            >
              No candidates found
            </div>
          )}
          {loading ? null : items?.candidates_data?.length ? (
            <div className="mt-4">
              <Pagination
                setCurrentPage={items?.current_page}
                totalItems={items?.total_count}
                currentPage={items?.current_page}
                itemsPerPage={items?.per_page}
                totalPages={items?.total_pages}
                PageNumberChange={PageNumberChange}
                PerPageNumberChange={PerPageNumberChange}
                setPerPagingNumber={setPerPagingNumber}
                perPagingNumber={perPagingNumber}
                setPageNumber={setPagingNumber}
              />
            </div>
          ) : null}
        </div>
      </div>
      <div className="absolute top-0 bottom-0 right-0">
        <Modal
          open={publishModal}
          setOpen={setPublishModal}
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
                setCheckedProfiles={setCheckedProfiles}
                selectedCandidates={selectedCandidates}
                setPublishModal={setPublishModal}
              />
            </div>
          )}
        </Modal>
        <Modal
          open={candidateModalOpen}
          setOpen={setCandidateModalOpen}
          section="companyDetail"
          header="Candidate Details"
        >
          <div
            style={{ backgroundColor: color?.innerBg }}
            className="w-full align-bottom rounded-lg overflow-hidden"
          >
            <CandidateDetailModal
              page="profile"
              admin={true}
              detail={candidate}
              color={color}
              colors={colors}
            />
          </div>
        </Modal>
      </div>
      {advanceSearch ? (
        <AdvanceSearch
          setDisplayFilters={setDisplayFilters}
          displayFilters={displayFilters}
          advSearchFilters={advSearchFilters}
          setAdvSearchFilters={setAdvSearchFilters}
          close={closeAdvanceSearch}
          setIsAdvancedSearch={setIsAdvancedSearch}
          getCandidatesForAdmin={getCandidatesForAdmin}
          keywordQuery={keywordQuery}
          setAdvanceSearchQuery={setAdvanceSearchQuery}
          setKeywordQuery={setKeywordQuery}
        />
      ) : (
        ""
      )}
    </div>
  );
};

export default AuthGuard(AdminCandidatesDashboard);
