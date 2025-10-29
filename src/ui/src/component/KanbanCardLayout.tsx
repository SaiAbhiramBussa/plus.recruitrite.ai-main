import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWarning } from "@fortawesome/free-solid-svg-icons";
import CandidateDetailModal from "./CandidateDetailModal";
import axios from "axios";
import Modal from "./Modal";
import { Doughnut } from "react-chartjs-2";
import { ChartOptions } from "chart.js";
import Loader from "./Loader";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

type Props = {
  title?: string;
  detail?: any;
  showFullData?: any;
  admin?: boolean;
  selectedCandidatesList?: Array<any>;
  removeCandidate?: any;
  selectCandidate?: any;
  color: any;
  colors: any;
};

export default function KanbanCardLayout(props: Props) {
  const {
    name,
    skills,
    email,
    phone,
    first_name,
    linked_in,
    candidate_id,
    last_name,
    picture,
    address,
    accuracy,
    recommended_skill,
    source_type,
  } = props.detail;
  const { showFullData, admin, selectedCandidatesList, color, colors } = props;
  const [revealsLeft, setRevealsLeft] = useState(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [plansModal, setPlanModal] = useState<boolean>(false);
  const [isCandidateInSelectedList, setIsCandidateInSelectedList] =
    useState<boolean>(false);

  const [mode, setMode] = useState("doughnut");

  const handleToggle = () => {
    setMode(mode === "progress" ? "doughnut" : "progress");
  };

  useEffect(() => {
    selectedCandidatesList?.includes(candidate_id)
      ? setIsCandidateInSelectedList(true)
      : setIsCandidateInSelectedList(false);
  }, [selectedCandidatesList]);

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
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        display: true,
        position: "right",
        labels: {
          font: {
            size: 8,
          },
        },
      },
    },
  };

  useEffect(() => {}, [revealsLeft]);

  const handleCardClick = (event: any) => {
    const isButtonClick = event.target.tagName === "BUTTON";
    if (isButtonClick) handleToggle();
    else setShowDetail(true);
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

  return loading ? (
    <div className="flex justify-center items-center w-full divide-y border">
      <Loader />
    </div>
  ) : (
    <div
      style={{ backgroundColor: color?.innerBg }}
      className="mb-2 flex flex-col w-full divide-y border shadow rounded"
    >
      <div className="p-2 justify-between flex">
        <Image
          src="/Images/h1-icon.png"
          width={10000}
          height={10000}
          className="w-4 h-4 mr-2 cursor-pointer"
          alt=""
          onClick={handleCardClick}
        />
        <div className="flex">
          {source_type && (
            <>
              {" "}
              {source_type == "other" ? (
                <span className="text-xs text-orange-400 font-medium px-2.5 rounded border border-orange-400">
                  Imported
                </span>
              ) : source_type == "startdate" ? (
                <span
                  style={{
                    color: color?.primaryAccent,
                    borderColor: color?.primaryAccent,
                  }}
                  className="text-xs font-medium px-2.5 rounded border"
                >
                  SD
                </span>
              ) : (
                <span className="text-xs text-green-400 font-medium px-2.5 rounded border border-green-400">
                  Applied
                </span>
              )}
            </>
          )}

          <input
            className="h-4 w-4 ml-2"
            type="checkbox"
            onChange={(e) =>
              isCandidateInSelectedList
                ? props.removeCandidate(candidate_id)
                : props.selectCandidate(candidate_id)
            }
            checked={isCandidateInSelectedList ? true : false}
          ></input>
        </div>
      </div>
      <div onClick={handleCardClick} className="cursor-pointer">
        <div className="flex justify-between p-2">
          <div className="flex items-center w-full ">
            <div className="flex w-1/6 items-center">
              <Image
                className="inline-block h-10 w-10 rounded-full"
                src={
                  picture
                    ? picture
                    : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                }
                alt=""
                width={10000}
                height={10000}
              />
            </div>
            <div className="flex justify-between w-5/6 items-center">
              <div className="w-3/6">
                <div className="font-medium text-sm truncate">
                  {first_name ? first_name : ""} {last_name ? last_name : ""}
                </div>
                <div className="font-extralight text-xs truncate">
                  {address?.address}
                </div>
              </div>
              <div className="w-3/6 pl-1">
                <div className="text-xs font-thin w-full flex items-center truncate">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-1/6 h-3 mr-1"
                  >
                    <path d="M10.5 18.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
                    <path
                      fillRule="evenodd"
                      d="M8.625.75A3.375 3.375 0 005.25 4.125v15.75a3.375 3.375 0 003.375 3.375h6.75a3.375 3.375 0 003.375-3.375V4.125A3.375 3.375 0 0015.375.75h-6.75zM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V3h1.125c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 017.5 19.875V4.125z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-xs w-5/6 font-thin truncate">
                    {phone ? phone : "-"}
                  </div>
                </div>
                <div className="text-xs w-full flex items-center font-thin">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-1/6 h-3 mt-1 mr-1"
                  >
                    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                  </svg>
                  <div className="w-5/6 truncate">
                    {email ? (
                      <a href={`mailto:${email ? email : ""}`}>{email}</a>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {!admin && (
          <div className="flex flex-col p-3">
            {!admin && recommended_skill && (
              <div className="">
                <div className="flex justify-between items-center mb-4">
                  <div className="">
                    {admin ? (
                      ""
                    ) : (
                      <div className="text-xs">
                        Avg match:{" "}
                        <span className="font-semibold">
                          {accuracy?.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="">
                    <button
                      style={{ color: color?.primaryAccent }}
                      className="mb-2 text-xs outline:none"
                      onClick={handleToggle}
                    >
                      {mode === "progress" ? "Doughnut Chart" : "Progress Bars"}
                    </button>
                  </div>
                </div>
                <div
                  className={`h-44 ${
                    mode === "progress" ? " " : "flex items-start"
                  } w-full justify-center overflow-auto`}
                >
                  {mode === "progress" ? (
                    recommended_skill?.map((item: any) => (
                      <div key={item.candidate_skill_id} className="mb-3">
                        <div
                          style={{ color: color?.primaryAccent }}
                          className="flex mt-1 justify-between mb-1"
                        >
                          <span className="text-xs font-light">
                            {item.skill}
                          </span>
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
                              backgroundColor: color?.primaryAccent,
                              width: `${item?.accuracy?.toFixed(2)}%`,
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
      </div>
      <Modal
        open={showDetail}
        setOpen={setShowDetail}
        section="companyDetail"
        header="Candidate Details"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="w-full align-bottom rounded-lg overflow-hidden"
        >
          <CandidateDetailModal
            page="profile"
            detail={props.detail}
            color={color}
            setShowDetail={setShowDetail}
            colors={colors}
          />
        </div>
      </Modal>
      <Modal
        expired={true}
        open={plansModal}
        setOpen={setPlanModal}
        section="companyDetail"
        header="Reveals"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="w-full align-bottom rounded-lg overflow-hidden justify-between"
        >
          <div className="flex p-4">
            <p>
              <h2 className="text-md font-medium w-full mb-4">
                <FontAwesomeIcon
                  icon={faWarning}
                  style={{ color: color?.primaryAccent }}
                  className="mr-3 text-2xl"
                />
                Seems like you have run out of reveals!
              </h2>
              <p className="text-sm font-light w-full">
                Please consider purchasing any plan of your choice to reveal
                more candidates.
              </p>
            </p>
          </div>
          <div className="flex items-center justify-end">
            <Link href="/profile/plans/ai_subscription">
              <ButtonWrapper classNames="flex justify-center items-center rounded-md border border-transparent px-5 py-2 text-base font-medium shadow-sm focus:outline-none mt-4">
                View Plans
              </ButtonWrapper>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
