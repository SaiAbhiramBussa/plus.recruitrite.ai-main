import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAnglesRight,
  faCheck,
  faEdit,
  faWarning,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "./Modal";
import CandidateDetailModal from "./CandidateDetailModal";
import PopOverComponent from "./PopOverComponent";
import EditProfileSection from "./candidates/EditProfileSection";
import _ from "lodash";
import {
  TargetLabelFormModel,
  keyLabelTargetLabelMapObj,
} from "../common/common.util";
import StartDatePopOverComponent from "./StartDatePopOverComponent";
import { colorToRGBA } from "../utils/misc";

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

export const options = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: "right" as const,
      labels: {
        boxWidth: 15,
        color: "#CBCCD3",
        padding: 5,
      },
    },
  },
};

export default function CandidateSmallCard(props: any) {
  const {
    first_name,
    last_name,
    candidate_id,
    work_history,
    skills,
    candidate_accuracy,
    picture,
    address,
    is_published,
    source_type,
    labels,
  } = props.detail;
  const {
    onCheckboxChange,
    page,
    selectAll,
    func,
    deleteAll,
    selectedCandidates,
    color,
    colors,
  } = props;
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [editCandidateModal, openEditCandidateModal] = useState<boolean>(false);
  const [isTargetLabelFormValue, setIsTargetLabelFormValue] =
    useState<TargetLabelFormModel>(labels);

  const handleCheckboxChange = (candidate_id: any, isChecked: any) => {
    onCheckboxChange(candidate_id, isChecked);
  };

  useEffect(() => {
    if (!_.isEqual(isTargetLabelFormValue, labels) && !showDetail) {
      handleRankChange();
    }
  }, [showDetail]);

  const GetTargetLabel = () => {
    return (
      <div className="flex">
        <StartDatePopOverComponent
          ChildElement={
            <div className="grid grid-cols-5 w-9/12 hover:opacity-75 p-1 rounded-sm pl-3">
              {Object.keys(isTargetLabelFormValue).map(
                (key: string, index: number) => {
                  return (
                    <div key={index}>
                      <FontAwesomeIcon
                        icon={
                          _.get(isTargetLabelFormValue, key) ? faCheck : faXmark
                        }
                        className="h-4 mr-2 cursor-pointer"
                      />
                    </div>
                  );
                }
              )}
            </div>
          }
          popOverText={
            <div>
              {Object.keys(isTargetLabelFormValue).map(
                (key: string, index: number) => {
                  return (
                    <div key={index} className="flex justify-between p-1">
                      {_.get(keyLabelTargetLabelMapObj, key)}
                      <FontAwesomeIcon
                        icon={
                          _.get(isTargetLabelFormValue, key) ? faCheck : faXmark
                        }
                        className="h-4 mr-2 cursor-pointer ml-2"
                      />
                    </div>
                  );
                }
              )}
            </div>
          }
        />
        {page === "training" && !_.isEqual(labels, isTargetLabelFormValue) ? (
          <div className="content-center">
            <FontAwesomeIcon
              icon={faWarning}
              className="h-4 mr-4 text-red-700"
            />
          </div>
        ) : (
          <></>
        )}
      </div>
    );
  };

  const handleRankChange = () => {
    const cand_obj = {
      candidate_id: candidate_id,
      labels: isTargetLabelFormValue,
    };
    func(cand_obj);
  };

  const openEditModal = () => {
    openEditCandidateModal(true);
  };

  const skillLength = skills.length - 2;

  return (
    <tr
      className={`h-12 items-center table-row w-full ${
        page === "mlOutput" && is_published && "bg-green-100"
      } border-b`}
    >
      <td className={`pl-4 lg:pl-0 flex justify-center truncate`}>
        {/* <input type="checkbox" id={candidate_id} value={candidate_id} checked={singleSelected} onChange={e => {setIsSelected(!isSelected); handleCheckboxChange(candidate_id, e.target.checked)}} className="form-checkbox cursor-pointer h-4 w-4" /> */}
        <input
          type="checkbox"
          style={{ accentColor: color?.primaryAccent }}
          id={candidate_id}
          checked={
            selectAll
              ? selectAll
              : deleteAll
              ? deleteAll
              : selectedCandidates && selectedCandidates.includes(candidate_id)
          }
          onChange={(e) => handleCheckboxChange(candidate_id, e.target.checked)}
          className="cursor-pointer h-4 w-4 mr-5 lg:mr-0"
        />
      </td>
      <td className="truncate lg:max-w-[2vw] lg:min-w-[2vw]">
        <img
          className="inline-block h-10 w-10 my-1 rounded-full"
          src={picture ? picture : null}
          alt=""
        />
      </td>
      <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
        <div className="flex-col">
          {first_name} {last_name}
          <div className="text-xs truncate lg:max-w-[16vw] lg:min-w-[16vw] font-light">
            {work_history[0]?.title}, {work_history[0]?.company} | 2+
          </div>
        </div>
      </td>
      {/* </div> */}
      <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[10vw] lg:min-w-[10vw]">
        {address.address}
      </td>
      {/* <td className="text-sm px-1 truncate max-w-[6vw] min-w-[6vw]">{work_history[0]?.title}, {work_history[0]?.company}</td> */}
      <td className="truncate px-1 flex mt-2 items-center lg:max-w-[28vw] lg:min-w-[28vw]">
        <div>
          {skills.length > 0 ? (
            skills.slice(0, 2).map((skill: any, id: any) => (
              <button
                key={id}
                style={{
                  color: color?.primaryAccent,
                  backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
                }}
                className="w-max mr-1 cursor-default items-center justify-center h-6 md:h-8 rounded-md px-2"
              >
                <div className="text-xs">{skill.skill}</div>
              </button>
            ))
          ) : (
            <div>-</div>
          )}
        </div>
        <PopOverComponent skills={skills} skillLength={skillLength} />
      </td>
      {page === "training" && (
        <td className="h-full truncate items-center mt-2 px-1">
          {isTargetLabelFormValue ? <GetTargetLabel /> : <></>}
        </td>
      )}
      {page === "mlOutput" && (
        <td className="h-full truncate items-center mt-2 px-1">
          <div className="truncate px-1 text-sm max-w-[8vw] min-w-[8vw]">
            {source_type}
          </div>
        </td>
      )}
      {page === "mlOutput" && (
        <td className="h-full truncate items-center mt-2 px-1">
          <div className="truncate px-1 text-sm max-w-[8vw] min-w-[8vw]">
            {_.ceil(candidate_accuracy, 3)}
          </div>
        </td>
      )}
      <td className="text-right">
        <FontAwesomeIcon
          icon={faEdit}
          className="h-4 cursor-pointer"
          onClick={openEditModal}
        />
      </td>
      <td
        className="transition truncate pr-3 pl-6 ease-in-out hover:delay-200 hover:translate-x-2 cursor-pointer"
        onClick={() => {
          setShowDetail(true);
        }}
      >
        <FontAwesomeIcon icon={faAnglesRight} />
      </td>
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
            page={page}
            role="admin"
            detail={props.detail}
            setShowDetail={setShowDetail}
            isShowTargetLabelForm={page === "training"}
            setIsTargetLabelFormValue={setIsTargetLabelFormValue}
            isTargetLabelFormValue={isTargetLabelFormValue}
            color={color}
            colors={colors}
          />
        </div>
      </Modal>
      <Modal
        open={editCandidateModal}
        setOpen={openEditCandidateModal}
        section="companyDetail"
        header="Edit Candidate Details"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="w-full align-bottom rounded-lg overflow-hidden"
        >
          <EditProfileSection
            modal="true"
            detail={props.detail}
            openEditCandidateModal={openEditCandidateModal}
            color={color}
          />
        </div>
      </Modal>
    </tr>
  );
}
