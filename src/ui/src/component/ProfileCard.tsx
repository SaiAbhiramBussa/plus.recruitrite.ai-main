import { Key, useEffect, useState, useContext} from "react";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import CandidateDetailModal from "./CandidateDetailModal";
import PopOverComponent from "./PopOverComponent";
import axios from "axios";
import Modal from "./Modal";
import { Doughnut } from "react-chartjs-2";
import { ChartOptions } from "chart.js";
import Loader from "./Loader";
import _ from "lodash";
import EditProfileSection from "./candidates/EditProfileSection";
import { isToShowDataBasedOnUser } from "../common/common.util";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import dynamic from "next/dynamic";
import { colorToRGBA, genrateRandomAccents } from "../utils/misc";
import AppContext from "@/src/context/Context";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

type Props = {
  title?: string;
  detail?: any;
  is_revealed?: boolean;
  showFullData?: any;
  admin?: boolean;
  changeCheckedProfiles?: any;
  checkedProfiles?: any;
  isCandidatePage?: boolean;
  isShowCheckbox?: boolean;
  selectCandidate?: any;
  removeCandidate?: any;
  selectedCandidatesList?: Array<string>;
  selectedCandidates?: any;
  setSelectedCandidates?: any;
  updateCandidateProfileCard?: any;
  shared?: any;
  setPlanModal?: any;
  shareableId?: any;
  color: any;
  colors: any;
};

export default function ProfileCard(props: Props) {
  const router = useRouter();
  const { candidate_id: candidate_id_from_url } = router.query;
  const {
    name,
    skills,
    email,
    phone,
    phone_code,
    first_name,
    credentials,
    linked_in,
    is_revealed,
    candidate_id,
    last_name,
    picture,
    address,
    accuracy,
    job_posting_candidate_id,
    recommended_skill,
    staged,
    source,
    source_type,
  } = props.detail;
  const {
    showFullData,
    admin,
    changeCheckedProfiles,
    isCandidatePage,
    setSelectedCandidates,
    selectedCandidates,
    updateCandidateProfileCard,
    selectedCandidatesList,
    shared,
    setPlanModal,
    shareableId,
    color,
    colors,
  } = props;
  const [revealsLeft, setRevealsLeft] = useState(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [
    showRequestInterviewConfirmationModal,
    setShowRequestInterviewConfirmationModal,
  ] = useState<boolean>(false);
  const [
    requestInterviewConfirmationModalCandidateSummary,
    setRequestInterviewConfirmationModalCandidateSummary,
  ] = useState<string>("");
  const [isRequestInterviewApiCalled, setIsRequestInterviewApiCalled] =
    useState<boolean>(false);
  const [isCandidateInSelectedList, setIsCandidateInSelectedList] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [editCandidateModal, openEditCandidateModal] = useState<boolean>(false);
  const [mode, setMode] = useState("doughnut");
  const [showCardMenu, setShowCardMenu] = useState<boolean>(false);
  const [showAlertToolTip, setShowAlertToolTip] = useState<boolean>(false);
  const [showViewMoreToolTip, setShowViewMoreToolTip] =
    useState<boolean>(false);
  const [user, setUser] = useState<any>();
  const [role, setRole] = useState<any>();
  const {setScreeningCredits } = useContext(AppContext);
  let companyDetails: { candidate_scope: string; minimum_reveals: number } =
    user?.company_details ? user.company_details : null;

  useEffect(() => {
    if (localStorage.getItem("user")) {
      const localuser: any = localStorage.getItem("user");
      setUser(JSON.parse(localuser));
      setRole(_.get(JSON.parse(localuser), "role"));
    }
  }, []);

  useEffect(() => {
    if (candidate_id_from_url && candidate_id == candidate_id_from_url)
      setShowDetail(true);
  }, [candidate_id_from_url]);

  useEffect(() => {
    selectedCandidatesList?.includes(candidate_id)
      ? setIsCandidateInSelectedList(true)
      : setIsCandidateInSelectedList(false);
  }, [selectedCandidatesList]);

  const handleToggle = (event: any) => {
    event?.stopPropagation();
    setMode(mode === "progress" ? "doughnut" : "progress");
  };
  const chartData = {
    labels: recommended_skill?.map((skill: any) => skill.skill),
    datasets: [
      {
        data: recommended_skill?.map((skill: any) => skill.accuracy),
        backgroundColor: colors,
        hoverBackgroundColor: color?.secondaryAccent,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    // maintainAspectRatio: false,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: "right",
        labels: {
          font: {
            size: 9,
          },
        },
      },
    },
  };

  const handleRequestInterview = (summary: string) => {
    setShowDetail(false);
    setShowRequestInterviewConfirmationModal(true);
    setRequestInterviewConfirmationModalCandidateSummary(summary);
  };

  const handleRequestInterviewSubmit = async () => {
    setIsRequestInterviewApiCalled(true);
    await axios
      .get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/shareable/candidates/request_interview?shareable_id=${shareableId}&job_posting_candidate_id=${job_posting_candidate_id}`,
        {
          withCredentials: true,
        }
      )
      .then((response) => {
        toast.success(response.data.Message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        }),
          setIsRequestInterviewApiCalled(false);
        setShowRequestInterviewConfirmationModal(false);
      })
      .catch((err) => {
        toast.error(
          err?.response?.data?.Error
            ? err?.response?.data?.Error
            : "Something went wrong",
          {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          }
        ),
          setIsRequestInterviewApiCalled(false);
      });
  };

  const skillLength = skills?.length - 2;

  const fetchReveals = async (id: any, candidate_id: any) => {
    setLoading(true);
    try {
      let res = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/subscriptions/reveal_candidate/${id}`,
        {
          withCredentials: true,
        }
      );
      showFullData(res?.data?.candidate);
      if (res.data) {
        setLoading(false);
        var user = JSON.parse(localStorage.getItem("user")!) || {};
        user.reveals_left = res.data.reveals_left;
        localStorage.setItem("user", JSON.stringify(user));
      }
      setRevealsLeft(res.data.reveals_left);
      setScreeningCredits(res.data.reveals_left);
      let data = res.data;
      return data;
    } catch (e: any) {
      if (e.response.status == 403) {
        openPlansModal();
      }
      setLoading(false);
    }
  };

  const openPlansModal = () => {
    setPlanModal(true);
  };

  const checkBoxChange = (profileLink: any, isChecked: any) => {
    if (isChecked) {
      setSelectedCandidates([...selectedCandidates, props.detail]);
    } else {
      setSelectedCandidates(
        _.remove(selectedCandidates, (candidate: any) => {
          return candidate?.candidate_id != candidate_id;
        })
      );
    }
    changeCheckedProfiles(profileLink, isChecked);
  };
  const checkedTest = () => {
    const res = selectedCandidates.some(
      (candidates: any) => candidates.candidate_id === candidate_id
    );
    return res;
  };

  const openEditModal = () => {
    openEditCandidateModal(true);
  };

  const handleMouseEnter = () => {
    setShowCardMenu(true);
  };

  const handleMouseLeave = () => {
    setShowCardMenu(false);
  };

  const handleAlertIconMouseEnter = () => {
    setShowAlertToolTip(true);
  };

  const handleAlertIconMouseLeave = () => {
    setShowAlertToolTip(false);
  };

  const handleViewMoreIconMouseEnter = () => {
    setShowViewMoreToolTip(true);
  };

  const handleViewMoreIconMouseLeave = () => {
    setShowViewMoreToolTip(false);
  };

  const handleCardClick = () => {
    if (shared) setShowDetail(true);
  };

  const CardMenu = () => {
    return (
      <div
        style={{
          backgroundColor: color?.innerBg,
          color: color?.secondaryAccent,
        }}
        className="shadow flex absolute py-2 rounded-sm right-0 top-7 ml-5"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {!shared && (
          <div className="flex text-sm items-center w-full px-4 flex-col justify-start">
            {admin ? (
              <div
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = color?.primaryAccent)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = color?.secondaryAccent)
                }
                className="flex cursor-pointer justify-start my-1 w-full"
                onClick={openEditModal}
              >
                <FontAwesomeIcon
                  icon={faEdit}
                  className="h-4 mr-2 cursor-pointer"
                />
                <div>Edit</div>
              </div>
            ) : (
              ""
            )}
            {linked_in && (
              <Link href={linked_in} target="_blank" passHref>
                <div
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = color?.primaryAccent)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = color?.secondaryAccent)
                  }
                  className="flex my-1 cursor-pointer mt-2 justify-start w-full items-center"
                >
                  <FontAwesomeIcon
                    icon={faLinkedin}
                    className="h-4 mr-2 cursor-pointer"
                  />
                  <div>LinkedIn</div>
                </div>
              </Link>
            )}
            {/* {<div className="flex cursor-pointer mt-2 justify-start w-full my-1 items-center hover:text-purple-600"><FontAwesomeIcon icon={faShareNodes} className="h-4 hover:text-purple-300 mr-2" />Share</div>} */}
          </div>
        )}
      </div>
    );
  };

  const getMobileSvgIcon = () => {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1">
        <path d="M10.5 18.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
        <path
          fillRule="evenodd"
          d="M8.625.75A3.375 3.375 0 005.25 4.125v15.75a3.375 3.375 0 003.375 3.375h6.75a3.375 3.375 0 003.375-3.375V4.125A3.375 3.375 0 0015.375.75h-6.75zM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V3h1.125c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 017.5 19.875V4.125z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const getEmailSvgIcon = () => {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1">
        <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
        <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
      </svg>
    );
  };

  const AlertIconToolTip = () => {
    return (
      <div
        style={{ backgroundColor: color?.outerBg }}
        className="bg-opacity-70 flex absolute py-2 justify-center rounded-lg -left-24 top-[-40px] w-64 ml-5"
        onMouseEnter={handleAlertIconMouseEnter}
        onMouseLeave={handleAlertIconMouseLeave}
      >
        <div className="text-xs text-center px-2">
          {(staged === "1000" || staged === "0000") && (
            <span>{`Candidate Unfit for Model (CPWS/${staged})`}</span>
          )}
          {staged[0] === "0" && staged !== "0000" && (
            <span>{`Candidate Contact is Missing (CPWS/${staged})`}</span>
          )}
        </div>
      </div>
    );
  };

  const ViewMoreIconToolTip = () => {
    return (
      <div
        style={{
          backgroundColor: color?.outerBg,
          color: color?.secondaryAccent,
        }}
        className="flex absolute py-1.5 rounded-md -left-10 top-[-44px]"
        onMouseEnter={handleViewMoreIconMouseEnter}
        onMouseLeave={handleViewMoreIconMouseLeave}
      >
        <div className="text-xs items-center w-28 px-3 justify-center flex">
          View More
        </div>
      </div>
    );
  };

  const SourceType = () => {
    return (
      source_type && (
        <>
          {source_type == "other" ? (
            <span className="text-xs text-orange-400 font-medium me-2 px-2.5 py-0.5 rounded border border-orange-400">
              Imported
            </span>
          ) : source_type == "startdate" ? (
            <span
              style={{
                color: color?.primaryAccent,
                borderColor: color?.primaryAccent,
              }}
              className="text-xs font-medium me-2 px-2.5 py-0.5 rounded border"
            >
              SD
            </span>
          ) : (
            <span className="text-xs text-green-400 font-medium me-2 px-2.5 py-0.5 rounded border border-green-400">
              Applied
            </span>
          )}
        </>
      )
    );
  };

  return loading ? (
    <div className="flex justify-center items-center w-full divide-y border">
      <Loader />
    </div>
  ) : (
    <div
      style={{ backgroundColor: color?.innerBg }}
      className={`flex flex-col w-full ${
        role === "admin" ? "relative" : ""
      } divide-y border shadow rounded ${shared ? "cursor-pointer" : ""}`}
      onClick={handleCardClick}
    >
      {/* { is_revealed && <div className={` ${is_revealed ? 'bg-[#060E39]' : 'bg-white'} h-4`}></div>} */}
      <div className="flex items-center px-3">
        <div
          className="flex justify-between items-center py-2 text-white mr-2 text-md"
          onClick={() => setShowDetail(true)}
        >
          <div
            className="relative cursor-pointer"
            onMouseEnter={handleViewMoreIconMouseEnter}
            onMouseLeave={handleViewMoreIconMouseLeave}
          >
            {showViewMoreToolTip && <ViewMoreIconToolTip />}
            <Image
              src="/Images/h1-icon.png"
              width={10000}
              height={10000}
              className="w-5 h-5"
              alt=""
            />
          </div>

          {role === "admin" &&
            staged &&
            (staged[0] === "0" || staged === "1000") && (
              <div
                onMouseEnter={handleAlertIconMouseEnter}
                onMouseLeave={handleAlertIconMouseLeave}
              >
                {staged && (staged === "1000" || staged === "0000") && (
                  <Image
                    src="https://cms-s3-startdate-1.s3.amazonaws.com/red-alert-icon.png"
                    alt=""
                    className="h-5 w-5 ml-2 cursor-pointer"
                    width={100000}
                    height={10000}
                  />
                )}
                {staged && staged[0] === "0" && staged !== "0000" && (
                  <Image
                    src="https://cms-s3-startdate-1.s3.amazonaws.com/purple-alert-icon.png"
                    alt=""
                    className="h-5 w-5 ml-2 cursor-pointer"
                    width={100000}
                    height={10000}
                  />
                )}
              </div>
            )}

          {!shared &&
            companyDetails?.candidate_scope != "self" &&
            role !== "admin" &&
            !is_revealed && (
              <div
                style={{ color: color?.primaryAccent }}
                className="flex ml-2 justify-between items-center font-semibold text-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation();
                    fetchReveals(job_posting_candidate_id, candidate_id);
                  }}
                >
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  <path
                    fillRule="evenodd"
                    d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
        </div>

        {showAlertToolTip && role === "admin" && <AlertIconToolTip />}
        {showCardMenu && role === "admin" && <CardMenu />}

        {role === "admin" && (
          <div className="flex items-center w-full justify-end">
            {source === "Gen_ai" && (
              <p
                style={{
                  backgroundColor: color?.primaryAccent,
                  color: color?.btnAccent,
                }}
                className="py-0.2 px-1 shadow-md no-underline rounded-half font-sans font-semibold text-sm border-blue"
              >
                Gen AI
              </p>
            )}
            {isCandidatePage && (
              <input
                className="h-4 w-4 ml-2"
                type="checkbox"
                style={{ accentColor: color?.primaryAccent }}
                onChange={(e) => checkBoxChange(linked_in, e.target.checked)}
                checked={checkedTest() ? true : false}
              ></input>
            )}
            {!shared && isCandidatePage && (
              <FontAwesomeIcon
                icon={faEllipsis}
                className="h-5 pl-2 mr-2 cursor-pointer"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
            )}
            <SourceType />
          </div>
        )}
        {props.isShowCheckbox ? (
          <input
            className="h-4 w-4 ml-2"
            type="checkbox"
            style={{ accentColor: color?.primaryAccent }}
            onChange={(e) =>
              isCandidateInSelectedList
                ? props.removeCandidate(candidate_id)
                : props.selectCandidate(candidate_id)
            }
            checked={isCandidateInSelectedList ? true : false}
          />
        ) : null}
        {is_revealed && role === "employer" && (
          <div className="flex items-center w-full justify-end">
            {linked_in && (
              <Link href={linked_in} target="_blank" passHref>
                <FontAwesomeIcon
                  icon={faLinkedin}
                  className="h-5 mr-2 mt-1 cursor-pointer"
                />
              </Link>
            )}
            <SourceType />
          </div>
        )}
      </div>

      <div className="flex justify-between p-2 items-center w-full">
        <div className="flex w-max items-center mr-1 p-1">
          <Image
            className="inline-block h-12 w-12 rounded-full"
            src={
              picture
                ? picture
                : `https://startdate-images-1.s3.us-west-1.amazonaws.com/startdate-avatar/${
                    Math.floor(Math.random() * 6) + 1
                  }.png`
            }
            alt=""
            width={10000}
            height={10000}
          />
        </div>
        <div className="flex justify-between w-full items-center">
          <div>
            <div
              style={{ color: color?.secondaryAccent }}
              className={`font-medium text-sm truncate ${
                isToShowDataBasedOnUser(role, is_revealed)
                  ? ""
                  : "blur brightness-50"
              } max-w-[8vw] min-w-[8vw]`}
            >
              {first_name
                ? first_name
                : shared
                ? ""
                : role === "admin"
                ? "-"
                : "Not available"}{" "}
              {last_name ? last_name : ""} {credentials && `(${credentials})`}
            </div>
            {!shared && (
              <div className="font-extralight text-xs truncate max-w-[8vw] min-w-[8vw]">
                {address?.address}
              </div>
            )}
          </div>
          {!shared && (
            <div style={{ color: color?.secondaryAccent }}>
              <div className="text-xs font-thin flex items-center truncate max-w-[8vw] min-w-[8vw]">
                {getMobileSvgIcon()}
                <div
                  className={`text-xs font-thin ${
                    !isToShowDataBasedOnUser(role, is_revealed)
                      ? "blur-sm brightness-50"
                      : ""
                  }max-w-[6vw] truncate min-w-[6vw] `}
                >
                  {isToShowDataBasedOnUser(role, is_revealed)
                    ? (phone_code ? phone_code : "") +
                      " " +
                      (phone ? phone : "-")
                    : "Not Available"}
                </div>
              </div>
              <div className="text-xs flex items-center font-thin max-w-[8vw] truncate min-w-[8vw]">
                {getEmailSvgIcon()}
                <div
                  className={`${
                    !isToShowDataBasedOnUser(role, is_revealed)
                      ? "blur-sm brightness-50"
                      : ""
                  }  max-w-[6vw] truncate min-w-[6vw]`}
                >
                  {isToShowDataBasedOnUser(role, is_revealed) ? (
                    email ? (
                      <a href={`mailto:${email}`}>{email}</a>
                    ) : (
                      "-"
                    )
                  ) : (
                    "Not Available"
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col p-3">
        <div className="flex items-center justify-start mr-4">
          <Image
            src="/Images/h1-icon.png"
            width={10000}
            height={10000}
            className="w-3 h-3 mr-2"
            alt=""
          />
          <div className="text-sm font-semibold">Skills</div>
        </div>
        <div className="flex justify-start flex-wrap items-center gap-3 max-h-40 overflow-x-hidden ">
          <div className="truncate px-1 h-12 flex mt-2 items-center flex-wrap">
            <div>
              {skills && skills.length > 0 ? (
                skills.slice(0, 2).map((skill: any, index: Key) => (
                  <button
                    key={index}
                    style={{
                      backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
                      color: color?.primaryAccent,
                    }}
                    className="w-max mr-1 cursor-default items-center justify-center h-6 md:h-6 rounded-md px-2"
                  >
                    <div className="text-xs">{skill.skill}</div>
                  </button>
                ))
              ) : (
                <div className="text-xs ml-1 font-thin">No skills to show</div>
              )}
            </div>
            {is_revealed ? (
              <PopOverComponent skills={skills} skillLength={skillLength} />
            ) : skillLength > 0 ? (
              <div className="py-2 text-xs pb-1">+ {skillLength} more</div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>

      {!admin && (
        <div className="flex flex-col p-3">
          <div className="flex items-center justify-between  mb-2">
            {!admin && (
              <div className="flex items-center">
                <Image
                  src="/Images/h1-icon.png"
                  width={10000}
                  height={10000}
                  className="w-3 h-3 mr-2"
                  alt=""
                />
                <div className="text-sm font-semibold">Statistics</div>
              </div>
            )}
            {admin ? (
              ""
            ) : (
              <div className="text-xs  ml-2">
                Avg match:{" "}
                <span className="font-semibold">{accuracy?.toFixed(2)}%</span>
              </div>
            )}
          </div>
          {!admin && recommended_skill && (
            <div className="">
              <div className="flex justify-end">
                <button
                  style={{ color: color?.primaryAccent }}
                  className="text-xs mb-2 outline:none"
                  onClick={handleToggle}
                >
                  {mode === "progress" ? "Doughnut Chart" : "Progress Bars"}
                </button>
              </div>
              <div
                className={`h-44 ${
                  mode === "progress" ? " " : "flex items-start"
                } w-full`}
              >
                {mode === "progress" ? (
                  recommended_skill?.map((item: any) => (
                    <div key={item.candidate_skill_id} className="ml-2 mb-3">
                      <div
                        style={{ color: color?.primaryAccent }}
                        className="flex mt-1 justify-between mb-1"
                      >
                        <span className="text-xs font-light">{item.skill}</span>
                        <span className="text-xs font-light">
                          {item?.accuracy?.toFixed(2)}%
                        </span>
                      </div>
                      <div
                        style={{ backgroundColor: color?.outerBg }}
                        className="w-full rounded-full h-2.5"
                      >
                        <div
                          className="h-2.5 rounded-full"
                          style={{
                            width: `${item?.accuracy?.toFixed(2)}%`,
                            backgroundColor: color?.primaryAccent,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <Doughnut data={chartData} options={options} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        open={showDetail}
        setOpen={setShowDetail}
        section="candidateDetail"
        header="Candidate Details"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="w-full align-bottom rounded-lg overflow-hidden"
        >
          <CandidateDetailModal
            page="profile"
            admin={role === "admin"}
            handleRequestInterview={handleRequestInterview}
            isRevealed={is_revealed}
            detail={props.detail}
            setShowDetail={setShowDetail}
            shared={shared}
            color={color}
            colors={colors}
          />
        </div>
      </Modal>
      <Modal
        open={editCandidateModal}
        setOpen={openEditCandidateModal}
        section="candidateDetail"
        header="Edit Candidate Details"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="w-full align-bottom rounded-lg overflow-hidden"
        >
          <EditProfileSection
            updateCandidateProfileCard={updateCandidateProfileCard}
            modal="true"
            detail={props.detail}
            openEditCandidateModal={openEditCandidateModal}
            color={color}
          />
        </div>
      </Modal>

      <Modal
        open={showRequestInterviewConfirmationModal}
        setOpen={setShowRequestInterviewConfirmationModal}
        section="publishModal"
        header="Request Interview"
      >
        <div className="p-2 mt-4 flex">
          <div className="items-center w-1/12 mr-1 p-1 gap-2 ">
            <Image
              className="inline-block h-16 w-16 rounded-full mt-1"
              src={
                picture
                  ? picture
                  : `https://startdate-images-1.s3.us-west-1.amazonaws.com/startdate-avatar/${
                      Math.floor(Math.random() * 6) + 1
                    }.png`
              }
              alt=""
              width={10000}
              height={10000}
            />
          </div>
          <div className="text-sm w-11/12">
            <div
              className={`font-medium text-sm truncate max-w-[8vw] min-w-[8vw]`}
            >
              {first_name ? first_name : "-"} {last_name ? last_name : ""}
            </div>
            <div className="line-clamp-3">
              <div
                dangerouslySetInnerHTML={{
                  __html: requestInterviewConfirmationModalCandidateSummary,
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <ButtonWrapper
            classNames="flex items-center mt-6 justify-center rounded-md border border-transparent px-5 py-2 text-sm font-medium shadow-sm focus:outline-none"
            disabled={isRequestInterviewApiCalled}
            onClick={handleRequestInterviewSubmit}
          >
            Confirm
          </ButtonWrapper>
          <ButtonWrapper
            classNames="flex justify-center items-center rounded-md border border-transparent px-5 py-2 text-sm font-medium text-white shadow-sm focus:outline-none mt-6"
            onClick={() => {
              setShowRequestInterviewConfirmationModal(false);
            }}
          >
            Cancel
          </ButtonWrapper>
        </div>
      </Modal>
    </div>
  );
}
