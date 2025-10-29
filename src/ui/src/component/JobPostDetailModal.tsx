import {
  faClipboard,
  faDollarSign,
  faGear,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import _ from "lodash";
import { Key, useContext } from "react";
import AppContext from "../context/Context";
import { colorToRGBA } from "../utils/misc";

export default function JobPostDetailModal(props: any) {
  const { selectedJob } = props;
  const { color } = useContext(AppContext);

  return (
    <div
      style={{ backgroundColor: color?.outerBg }}
      className="p-5 scroll-m-1 overflow-y-scroll h-[74vh] rounded-md"
    >
      <h1 className=" text-xl font-bold mb-5">
        {_.get(selectedJob, "title", "")}
      </h1>

      <div className="content flex flex-wrap justify-start mb-3">
        <span className="font-thin ml-1 pr-2 border-r-2">
          <FontAwesomeIcon
            style={{
              color: colorToRGBA(color?.secondaryAccent, color?.opacity),
            }}
            className="mx-1"
            icon={faLocationDot}
          />
          {selectedJob?.state}
        </span>
        <span className="font-thin ml-1 pr-2">
          <FontAwesomeIcon
            style={{
              color: colorToRGBA(color?.secondaryAccent, color?.opacity),
            }}
            className="mx-1"
            icon={faDollarSign}
          />
          {Math.abs(selectedJob.compensation) > 999
            ? Math.sign(selectedJob.compensation) *
                Number((Math.abs(selectedJob.compensation) / 1000).toFixed(1)) +
              "k"
            : Math.sign(selectedJob.compensation) *
              Math.abs(selectedJob.compensation)}{" "}
        </span>
      </div>

      <div
        style={{ backgroundColor: color?.innerBg }}
        className="font-thin text-base p-3 rounded-md"
      >
        <div>
          <div className="flex items-center justify-start">
            <FontAwesomeIcon
              style={{
                color: colorToRGBA(color?.secondaryAccent, color?.opacity),
              }}
              className="mx-1"
              icon={faClipboard}
            />
            <h3 className="font-semibold text-base">Job Description</h3>
          </div>
          <div className="ml-5 my-5">{selectedJob?.description}</div>
        </div>
        <div>
          <div className=" mt-3 flex items-center justify-start">
            <FontAwesomeIcon
              style={{
                color: colorToRGBA(color?.secondaryAccent, color?.opacity),
              }}
              className="mx-1"
              icon={faGear}
            />
            <h3 className="font-semibold text-base">Mandatory Skillset</h3>
          </div>
          <div>
            <div className="ml-5 flex flex-wrap my-3">
              {selectedJob?.skills &&
                selectedJob.skills.map((skill: any, index: Key) => (
                  <ul
                    key={index}
                    style={{
                      color: color?.primaryAccent,
                      backgroundColor: colorToRGBA(
                        color?.primaryAccentm,
                        color?.opacity
                      ),
                    }}
                    className="p-1 w-max mx-2 my-3 cursor-default items-center justify-center h-7 rounded-md px-2"
                  >
                    <li className="text-xs">{skill.name}</li>
                  </ul>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
