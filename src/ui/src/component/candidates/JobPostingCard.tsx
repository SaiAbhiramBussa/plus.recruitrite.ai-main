import {
  faClipboard,
  faDollarSign,
  faGear,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import _ from "lodash";
import { Key, useState } from "react";
import Modal from "../Modal";
import { colorToRGBA } from "@/src/utils/misc";

export default function JobPostingCard(props: any) {
  const { job, color } = props;
  const [openModal, setOpenModal] = useState<boolean>(false);

  const showDescription = () => {
    setOpenModal(true);
  };
  return (
    <div className="p-2">
      <div
        style={{
          backgroundColor: color?.outerBg,
          color: colorToRGBA(color?.secondaryAccent, color?.opacity),
        }}
        className="w-full p-2 h-[150px] rounded-md border hover:shadow-md cursor-pointer transition"
        onClick={showDescription}
      >
        <div className="head flex flex-wrap p-2 justify-between">
          <div className="font-bold w-3/6 truncate">
            {_.get(job, "title", "")}
          </div>
          <div className="content py-1 flex flex-wrap justify-start">
            <span className="font-thin ml-1 pr-2 border-r-2">
              <FontAwesomeIcon className="mx-1" icon={faLocationDot} />
              {job?.state}
            </span>
            <span className="font-thin ml-1 pr-2">
              <FontAwesomeIcon className="mx-1" icon={faDollarSign} />
              {Math.abs(job.compensation) > 999
                ? Math.sign(job.compensation) *
                    Number((Math.abs(job.compensation) / 1000).toFixed(1)) +
                  "k"
                : Math.sign(job.compensation) * Math.abs(job.compensation)}{" "}
            </span>
          </div>
        </div>
        <div className="skills truncate">
          <div className="flex">
            {job?.skills &&
              job.skills.map((skill: any, key: any) => (
                // eslint-disable-next-line react/jsx-key
                <>
                  {key < 3 ? (
                    <div
                      key={key}
                      style={{ color: color?.secondaryAccent }}
                      className="text-sm p-2 mx-1 flex items-center justify-between"
                    >
                      <div>{skill.name}</div>
                      <div
                        style={{
                          backgroundColor: colorToRGBA(
                            color?.secondaryAccent,
                            color?.opacity
                          ),
                        }}
                        className="rounded-full ml-1 w-1 h-1"
                      ></div>{" "}
                    </div>
                  ) : null}
                </>
              ))}
          </div>
        </div>
        <div className=" font-extralight text-sm p-2 h-8 line-clamp-1">
          <FontAwesomeIcon
            style={{
              backgroundColor: colorToRGBA(
                color?.secondaryAccent,
                color?.opacity
              ),
            }}
            className="mx-1"
            icon={faClipboard}
          />
          {job?.description}
        </div>
      </div>
      <Modal
        open={openModal}
        setOpen={setOpenModal}
        isFull={true}
        header="Job Description"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="p-5 scroll-m-1 overflow-y-scroll h-[70vh] rounded-md mt-4"
        >
          <h1 className=" text-xl font-bold mb-5">{_.get(job, "title", "")}</h1>
          <div className="content flex flex-wrap justify-end mb-3">
            <span className="font-thin ml-1 pr-2 border-r-2">
              <FontAwesomeIcon
                style={{
                  backgroundColor: colorToRGBA(
                    color?.secondaryAccent,
                    color?.opacity
                  ),
                }}
                className="mx-1"
                icon={faLocationDot}
              />
              {job?.state}
            </span>
            <span className="font-thin ml-1 pr-2">
              <FontAwesomeIcon
                style={{
                  backgroundColor: colorToRGBA(
                    color?.secondaryAccent,
                    color?.opacity
                  ),
                }}
                className="mx-1"
                icon={faDollarSign}
              />
              {Math.abs(job.compensation) > 999
                ? Math.sign(job.compensation) *
                    Number((Math.abs(job.compensation) / 1000).toFixed(1)) +
                  "k"
                : Math.sign(job.compensation) * Math.abs(job.compensation)}{" "}
            </span>
          </div>
          <div
            style={{
              backgroundColor: color?.innerBg,
              color: color?.secondaryAccent,
            }}
            className="font-thin text-base p-3 rounded-md"
          >
            <div>
              <div className="flex items-center justify-start">
                <FontAwesomeIcon className="mx-1" icon={faClipboard} />
                <h3 className="font-semibold text-base">Job Description</h3>
              </div>
              <div className="ml-5 my-5">{job?.description}</div>
            </div>
            <div>
              <div className=" mt-3 flex items-center justify-start">
                <FontAwesomeIcon className="mx-1" icon={faGear} />
                <h3 className="font-semibold text-base">Mandatory Skillset</h3>
              </div>
              <div>
                <div className="ml-5 flex flex-wrap my-3">
                  {job?.skills &&
                    job.skills.map((skill: any, index: Key) => (
                      <ul
                        key={index}
                        style={{
                          color: color?.primaryAccent,
                          backgroundColor: colorToRGBA(
                            color?.primaryAccent,
                            0.2
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
      </Modal>
    </div>
  );
}
