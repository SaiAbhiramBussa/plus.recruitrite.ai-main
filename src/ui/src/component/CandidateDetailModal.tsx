import { Key, useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import axios from "axios";
import {
  faAddressBook,
  faBriefcase,
  faChevronDown,
  faChevronUp,
  faEnvelope,
  faFile,
  faGraduationCap,
  faPhone,
  faPlayCircle,
  faRankingStar,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import _, { set } from "lodash";
import TargetLabelForm from "./TargetLabelForm";
import { TargetLabelFormModel } from "../common/common.util";
import { colorToRGBA, genrateRandomAccents } from "../utils/misc";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

ChartJS.register(ArcElement, Tooltip, Legend);

export const data = {
  labels: ["Skill 02", "Skill 01", "Skill 03"],
  datasets: [
    {
      label: "# of Votes",
      data: [12, 19, 3],
      backgroundColor: ["#9E5EF8", "#006251", "#060E39"],
      borderColor: ["#9E5EF8", "#006251", "#060E39"],
      borderWidth: 1,
    },
  ],
};

const options: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "right",
      labels: {
        font: {
          size: 10,
        },
      },
    },
  },
};

type Props = {
  title?: string;
  detail?: any;
  page?: any;
  role?: any;
  admin?: any;
  setShowDetail?: any;
  isRevealed?: boolean;
  isShowTargetLabelForm?: boolean;
  shared?: boolean;
  handleRequestInterview?: any;
  setIsTargetLabelFormValue?: any;
  isTargetLabelFormValue?: TargetLabelFormModel;
  color: any;
  colors: any;
};

export default function CandidateDetailModal(props: Props) {
  const router = useRouter();
  const jobid = router?.query?.id?.[2];
  const {
    first_name,
    last_name,
    candidate_id,
    credentials,
    skills,
    recommended_skill,
    email,
    phone_code,
    phone,
    picture,
    address,
    accuracy,
    work_history,
    education_history,
    linked_in,
    summary,
    resumes,
  } = props.detail;
  const {
    page,
    admin,
    isRevealed,
    shared,
    handleRequestInterview,
    isShowTargetLabelForm,
    setIsTargetLabelFormValue,
    isTargetLabelFormValue,
    color,
    colors,
  } = props;

  const [mode, setMode] = useState("doughnut");
  const [disablePushingData, setDisablePushingData] = useState(false);
  const [toggle, setToggle] = useState({
    skills: true,
    workHistory: true,
    educationHistory: true,
    insights: true,
    moreSkills: false,
  });
  const [expandedWork, setExpandedWork] = useState<any>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [updatedWorkHistory, setUpdatedWorkHistory] = useState<any>([]);

  useEffect(() => {
    if (!work_history) return;

    const filterCallback = (a: any, b: any) => {
      const aCondition = !a.from_date || (!a.from_date && !a.to_date);
      const bCondition = !b.from_date || (!b.from_date && !b.to_date);

      if (aCondition && !bCondition) {
        return 1; // a should come after b
      } else if (!aCondition && bCondition) {
        return -1; // b should come before a
      } else {
        return 0; // no change in order
      }
    };

    const sortedWorkHistory = work_history.sort(filterCallback);
    setUpdatedWorkHistory(sortedWorkHistory);
  }, [work_history]);

  useEffect(() => {
    if (contentRef.current) {
      setIsOverflowing(
        contentRef.current.scrollHeight > contentRef.current.clientHeight
      );
    }
  }, [skills]);

  const pushToTrainingDataHandler = async () => {
    setDisablePushingData(true);
    try {
      let res = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/training_candidates`,
        {
          job_posting_id: jobid,
          candidates_id: [candidate_id],
        },
        { withCredentials: true }
      );
      toast.success("Pushed to training data", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });

      return res;
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setDisablePushingData(false);
    }
  };

  const handleToggle = () => {
    setMode(mode === "progress" ? "doughnut" : "progress"); // Toggle between 'progress' and 'doughnut'
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

  const getReorderedArray = (array: Array<any>, cb: Function): Array<any> => {
    const partitionedArray = array.reduce(
      (acc, item) => {
        if (cb(item)) {
          acc[0].push(item);
        } else {
          acc[1].push(item);
        }
        return acc;
      },
      [[], []]
    );
    return [...partitionedArray[0], ...partitionedArray[1]];
  };

  return (
    <div
      style={{ backgroundColor: color?.innerBg, color: color?.secondaryAccent }}
      className="flex flex-col w-full divide-y max-h-[64vh]"
    >
      <div className="overflow-y-auto">
        <div className="flex justify-between items-center">
          <div className="flex flex-col lg:flex-row justify-between w-full p-4 gap-3">
            <div className="flex gap-2">
              <Image
                height={0}
                width={0}
                className="inline-block h-14 w-14 rounded-full"
                src={
                  picture
                    ? picture
                    : `https://startdate-images-1.s3.us-west-1.amazonaws.com/startdate-avatar/${
                        Math.floor(Math.random() * 6) + 1
                      }.png`
                }
                alt=""
              />
              <div>
                <div>
                  <div className="flex justify-between items-center">
                    <div
                      style={
                        !admin &&
                        page === "profile" &&
                        !first_name &&
                        !isRevealed
                          ? { color: color?.primaryAccent }
                          : {}
                      }
                      className={`font-medium ${
                        !admin &&
                        page === "profile" &&
                        !first_name &&
                        !isRevealed
                          ? "blur-sm brightness-125"
                          : ""
                      }`}
                    >
                      {`${
                        page === "profile" && !first_name
                          ? shared
                            ? ""
                            : "Not available"
                          : first_name
                      } ${last_name ? last_name : ""}`}{" "}
                      {credentials && `(${credentials})`}
                    </div>
                    {page !== "training" && page !== "profile" && (
                      <button
                        style={{
                          backgroundColor: color?.primaryAccent,
                          color: color?.btnAccent,
                        }}
                        onClick={pushToTrainingDataHandler}
                        disabled={disablePushingData}
                        className="disabled:cursor-not-allowed disabled:opacity-40 rounded border border-transparent px-2 py-1 text-sm font-xs shadow-sm hover:opacity-80 focus:outline-none"
                      >
                        Push to training data
                      </button>
                    )}
                  </div>
                  {!shared && (
                    <>
                      <div className="font-extralight text-sm">
                        {address.address}
                      </div>
                      <div className="flex items-center gap-2.5 flex-wrap text-xs mt-2">
                        {phone !== null ? (
                          <div className="flex items-center justify-start gap-2">
                            <FontAwesomeIcon
                              icon={faPhone}
                              className="w-3.5 h-3.5"
                            />
                            <div
                              style={{ color: color?.primaryAccent }}
                              className={`text-sm font-extralight ${
                                page === "profile" &&
                                phone === null &&
                                !isRevealed
                                  ? "blur-sm brightness-50"
                                  : ""
                              } `}
                            >
                              {phone !== null
                                ? phone === ""
                                  ? "-"
                                  : phone_code
                                  ? phone_code + phone
                                  : phone
                                : "Not Available"}
                            </div>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-start gap-2">
                          <FontAwesomeIcon
                            icon={faEnvelope}
                            className="w-4 h-4"
                          />
                          <div
                            style={{ color: color?.primaryAccent }}
                            className={`text-xs md:text-sm font-extralight ${
                              page === "profile" &&
                              email === null &&
                              !admin &&
                              !isRevealed
                                ? "blur-sm brightness-50"
                                : ""
                            }`}
                          >
                            {email ? email : admin ? "-" : "N/A"}
                          </div>
                        </div>
                        <div className="flex items-center justify-start gap-2">
                          <FontAwesomeIcon
                            icon={faLinkedin}
                            className="w-4 h-4"
                          />
                          <div
                            style={{ color: color?.primaryAccent }}
                            className={`text-xs md:text-sm font-extralight ${
                              page === "profile" &&
                              linked_in === null &&
                              !admin &&
                              !isRevealed
                                ? "blur-sm brightness-50"
                                : ""
                            }`}
                          >
                            {linked_in ? (
                              <Link href={linked_in} target="_blank">
                                {linked_in}
                              </Link>
                            ) : page === "profile" && admin ? (
                              "-"
                            ) : (
                              "Not Available"
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div
                  className="text-editor-priview text-justify max-h-40 pr-2 mt-2 xl:max-w-full text-xs md:text-sm overflow-x-hidden"
                  dangerouslySetInnerHTML={{ __html: summary }}
                />
              </div>
            </div>
            <div className="flex flex-row mt-5">
              {!shared && (
                <div style={{ color: color?.primaryAccent }}>
                  {resumes &&
                    _.size(resumes) > 0 &&
                    resumes?.map((resume: any) =>
                      resume.resume_type === "doc" ? (
                        <span key={resume.resume_id} className="mr-2">
                          <FontAwesomeIcon icon={faFile} className="mr-2" />
                          <Link
                            href={resume.resume_url}
                            className="mr-2 text-sm"
                            target="_blank"
                          >
                            Download Resume
                          </Link>
                        </span>
                      ) : (
                        <span key={resume.resume_id}>
                          <FontAwesomeIcon
                            icon={faPlayCircle}
                            className="mr-2"
                          />
                          <Link
                            href={resume.resume_url}
                            className="mr-2 text-sm"
                            target="_blank"
                          >
                            Download Video Resume
                          </Link>
                        </span>
                      )
                    )}
                </div>
              )}
            </div>
            {!shared && isShowTargetLabelForm && (
              <div>
                <div className="flex mb-2 items-center justify-start mr-4">
                  <Image
                    src="/Images/h1-icon.png"
                    width={10000}
                    height={10000}
                    className="w-3 h-3 mr-2"
                    alt=""
                  />
                  <div className="text-base font-semibold">Target Label</div>
                </div>
                <div className="ml-5 w-44">
                  <TargetLabelForm
                    targetLabelFormInputObj={isTargetLabelFormValue}
                    setIsTargetLabelFormValue={setIsTargetLabelFormValue}
                    color={color}
                  />
                </div>
              </div>
            )}
            {shared && (
              <div className="lg:w-2/5 flex justify-end">
                <ButtonWrapper
                  classNames="rounded border border-transparent px-4 py-3 text-sm font-medium shadow-sm hover:opacity-70 focus:outline-none h-12"
                  onClick={() => {
                    handleRequestInterview(summary);
                  }}
                >
                  Request Interview
                </ButtonWrapper>
              </div>
            )}
          </div>
        </div>
        <div className={recommended_skill ? "grid grid-cols-2" : ""}>
          <div className="flex flex-col p-3 gap-6">
            <div className="flex items-center justify-between w-full mr-4">
              <div className="flex items-center justify-start">
                <FontAwesomeIcon
                  style={{ color: color?.primaryAccent }}
                  icon={faWandMagicSparkles}
                  className="mr-2"
                />
                <div className="text-base font-semibold">Skills</div>
              </div>
              <button
                type="button"
                onClick={() => setToggle({ ...toggle, skills: !toggle.skills })}
              >
                {toggle.skills ? (
                  <FontAwesomeIcon icon={faChevronUp} title="Collapse" />
                ) : (
                  <FontAwesomeIcon icon={faChevronDown} className="Expand" />
                )}
              </button>
            </div>
            <div
              className={`flex ml-5 justify-start flex-wrap items-center gap-3 mb-2`}
            >
              {!skills.length ? (
                <div className="text-xs ml-1 font-extralight">
                  No skills to show
                </div>
              ) : toggle.skills ? (
                <>
                  <div
                    ref={contentRef}
                    className={`${
                      toggle.moreSkills ? "" : "max-h-40 overflow-y-hidden"
                    } flex flex-wrap gap-3`}
                  >
                    {skills.map((item: any, index: Key) => (
                      <span
                        key={index}
                        style={{
                          backgroundColor: colorToRGBA(
                            color?.primaryAccent,
                            0.1
                          ),
                          color: color?.primaryAccent,
                        }}
                        className="rounded-xl px-3 py-1.5 text-sm font-medium"
                      >
                        {item.skill}
                      </span>
                    ))}
                  </div>
                  {isOverflowing && (
                    <button
                      type="button"
                      onClick={() =>
                        setToggle({ ...toggle, moreSkills: !toggle.moreSkills })
                      }
                      style={{
                        backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
                        color: color?.primaryAccent,
                      }}
                      className="flex items-center justify-center py-1.5 w-full rounded-xl px-3"
                    >
                      {toggle.moreSkills ? (
                        <span className="text-sm flex items-center gap-3">
                          <FontAwesomeIcon icon={faChevronUp} /> Show Less
                        </span>
                      ) : (
                        <span className="text-sm flex items-center gap-3">
                          <FontAwesomeIcon icon={faChevronDown} /> Show More
                        </span>
                      )}
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>
          {recommended_skill && (
            <div className="flex flex-col p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <FontAwesomeIcon
                      icon={faRankingStar}
                      className="mr-2"
                      style={{ color: color?.primaryAccent }}
                    />
                    <div className="text-base font-semibold">Insights</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setToggle({ ...toggle, insights: !toggle.insights })
                    }
                  >
                    {toggle.insights ? (
                      <FontAwesomeIcon icon={faChevronUp} title="Collapse" />
                    ) : (
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="Expand"
                      />
                    )}
                  </button>
                </div>
              </div>
              {toggle.insights ? (
                <>
                  {accuracy && (
                    <div className="text-xs mt-2 px-6">
                      Avg match:{" "}
                      <span className="font-semibold">
                        {accuracy.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="flex justify-end">
                      <button
                        style={{ color: color?.primaryAccent }}
                        className="text-xs mb-2 outline:none"
                        onClick={handleToggle}
                      >
                        {mode === "progress"
                          ? "Doughnut Chart"
                          : "Progress Bars"}
                      </button>
                    </div>
                    <div
                      className={`h-44 ${
                        mode === "progress"
                          ? "grid grid-cols-3 gap-2"
                          : "flex items-start justify-center mb-8"
                      } w-[90%]`}
                    >
                      {mode === "progress" ? (
                        recommended_skill?.map((item: any) => (
                          <div
                            key={item.candidate_skill_id}
                            className="ml-2 mb-3"
                          >
                            <div
                              style={{ color: color?.primaryAccent }}
                              className="flex mt-1 justify-between mb-1"
                            >
                              <span className="text-xs font-light">
                                {item.skill}
                              </span>
                              <span className="text-xs font-light">
                                {item.accuracy.toFixed(2)}%
                              </span>
                            </div>
                            <div
                              style={{ backgroundColor: color?.outerBg }}
                              className="w-full rounded-full h-2.5"
                            >
                              <div
                                className="h-2.5 rounded-full"
                                style={{
                                  width: `${item.accuracy.toFixed(2)}%`,
                                  backgroundColor: colorToRGBA(
                                    color?.primaryAccent,
                                    0.2
                                  ),
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
                </>
              ) : null}
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center justify-start mr-4">
              <FontAwesomeIcon
                icon={faBriefcase}
                className="mr-2"
                style={{ color: color?.primaryAccent }}
              />
              <div className="text-base font-semibold">Work history</div>
            </div>
            <button
              type="button"
              onClick={() =>
                setToggle({ ...toggle, workHistory: !toggle.workHistory })
              }
            >
              {toggle.workHistory ? (
                <FontAwesomeIcon icon={faChevronUp} title="Collapse" />
              ) : (
                <FontAwesomeIcon icon={faChevronDown} className="Expand" />
              )}
            </button>
          </div>
          {toggle.workHistory && (
            <ol className="mb-2 mt-3 px-6 flex flex-col gap-5">
              {updatedWorkHistory?.length
                ? getReorderedArray(
                    updatedWorkHistory,
                    (item: any) => !item.to_date && item.from_date
                  ).map((item: any, index: Key) => (
                    <div key={index}>
                      <div
                        style={
                          !admin &&
                          page === "profile" &&
                          !item.title &&
                          !isRevealed
                            ? { color: color?.primaryAccent }
                            : {}
                        }
                        className={`text-sm font-semibold ${
                          !admin &&
                          page === "profile" &&
                          !item.title &&
                          !isRevealed
                            ? "blur brightness-50"
                            : ""
                        }`}
                      >
                        {page === "profile" && !item.title
                          ? "Not Available"
                          : item.title}
                      </div>
                      <div className="font-extralight text-sm">
                        {item.from_date && item.to_date
                          ? `${item.from_date} to ${item.to_date}`
                          : item.from_date
                          ? `${item.from_date} to Present`
                          : item.to_date
                          ? `N/A to ${item.to_date}`
                          : null}
                      </div>
                      <div
                        style={
                          !admin &&
                          page === "profile" &&
                          !item.company &&
                          !isRevealed
                            ? { color: color?.primaryAccent }
                            : {}
                        }
                        className={`text-sm font-extralight ${
                          !admin &&
                          page === "profile" &&
                          !item.company &&
                          !isRevealed
                            ? "blur-sm"
                            : ""
                        }`}
                      >
                        {page === "profile" && !item.company
                          ? "Not Available"
                          : item.company}
                      </div>
                      <div className="text-[13px] text-justify mt-1">
                        {!item.description ||
                        expandedWork.includes(item.id) ||
                        item.description?.split(" ")?.length <= 60 ? (
                          <p>{item.description}</p>
                        ) : (
                          <p className="relative">
                            {item.description
                              ?.split(" ")
                              ?.slice(0, 60)
                              ?.join(" ")}
                            {" ..."}
                            <button
                              type="button"
                              style={{ color: color?.primaryAccent }}
                              onClick={() =>
                                setExpandedWork([...expandedWork, item.id])
                              }
                              className="absolute right-0"
                            >
                              {expandedWork.includes(item.id)
                                ? null
                                : "Read more"}
                            </button>
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                : "No work history available."}
            </ol>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center justify-start mr-4">
              <FontAwesomeIcon
                icon={faGraduationCap}
                className="mr-2"
                style={{ color: color?.primaryAccent }}
              />
              <div className="text-base font-semibold">Education history</div>
            </div>
            <button
              type="button"
              onClick={() =>
                setToggle({
                  ...toggle,
                  educationHistory: !toggle.educationHistory,
                })
              }
            >
              {toggle.educationHistory ? (
                <FontAwesomeIcon icon={faChevronUp} title="Collapse" />
              ) : (
                <FontAwesomeIcon icon={faChevronDown} className="Expand" />
              )}
            </button>
          </div>
          {toggle.educationHistory && (
            <ol className="mb-2 mt-3 px-8 flex flex-col gap-5">
              {education_history?.length
                ? education_history.map((item: any, index: Key) => (
                    <div key={index}>
                      <div className="text-sm font-semibold">
                        {item.degree ? item.degree : "School"}
                      </div>
                      <div
                        style={
                          !admin &&
                          page === "profile" &&
                          !item.school &&
                          !isRevealed
                            ? { color: color?.primaryAccent }
                            : {}
                        }
                        className={` ${
                          !admin &&
                          page === "profile" &&
                          !item.name &&
                          !isRevealed
                            ? "blur text-sm brightness-50"
                            : "text-sm font-extralight"
                        }`}
                      >
                        {page === "profile" && !item.name
                          ? "Not Available"
                          : item.name}
                      </div>
                    </div>
                  ))
                : "No education history available."}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
