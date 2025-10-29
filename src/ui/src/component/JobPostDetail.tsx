import {
  faClipboard,
  faDollarSign,
  faGear,
  faGlobe,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import _ from "lodash";
import { useRouter } from "next/router";
import { Key, useEffect } from "react";
import { colorToRGBA } from "../utils/misc";

export default function JobPostDetail(props: any) {
  const router = useRouter();
  const { selectedJob, color } = props;
  const jobid =
    router.query.id && router.query.id.length > 1 ? router.query.id[2] : null;

  let remoteType = [
    {
      key: "0",
      value: "Within State",
      option: "state",
      lower: "within state",
    },
    {
      key: "1",
      value: "Within country",
      option: "country",
      lower: "within country",
    },
    {
      key: "2",
      value: "Global",
      option: "any_region",
      lower: "any region",
    },
  ];

  useEffect(() => {
    if (jobid) {
      const newUrl = router.asPath.replace(/\/[a-zA-Z0-9_-]+$/, `/job-info`);
      router.replace(newUrl);
    }
  }, [jobid]);

  return (
    <div
      style={{ backgroundColor: color?.innerBg, color: color?.secondaryAccent }}
      className="overflow-x-scroll min-h-[74vh] justify-between"
    >
      <div className="flex gap-3 items-center my-3">
        {/* <FontAwesomeIcon
          style={{
            color: colorToRGBA(color?.secondaryAccent, color?.opacity),
          }}
          className="h-4 w-4"
          icon={faClipboardUser}
        /> */}
        <h3 className="font-semibold text-base">{selectedJob?.title}</h3>
      </div>
      <div className="content flex flex-wrap justify-start mb-4">
        <span
          style={{ color: colorToRGBA(color?.secondaryAccent, color?.opacity) }}
          className="mr-2 pr-4 border-r-2"
        >
          <FontAwesomeIcon className=" mx-1 h-4 w-4" icon={faGlobe} />
          {selectedJob?.state}
        </span>
        <span className="text-[#a9a9b2] ml-1 pr-4 mr-2 border-r-2">
          <FontAwesomeIcon className=" mx-1 h-4 w-4" icon={faDollarSign} />
          {selectedJob && selectedJob.compensation
            ? Math.abs(selectedJob?.compensation) > 999
              ? Math.sign(selectedJob.compensation) *
                  Number(
                    (Math.abs(selectedJob.compensation) / 1000).toFixed(1)
                  ) +
                "k"
              : Math.sign(selectedJob?.compensation) *
                Math.abs(selectedJob?.compensation)
            : "~"}
        </span>
        <span
          style={{ color: colorToRGBA(color?.secondaryAccent, color?.opacity) }}
          className="ml-1 pr-2"
        >
          <FontAwesomeIcon className=" mx-1 h-4 w-4" icon={faLocationDot} />
          {selectedJob && selectedJob.work_location_type}
          {selectedJob &&
            selectedJob.work_location_type === "remote" &&
            ` (${
              _.find(
                remoteType,
                (type) => type.option === selectedJob.remote_type
              )
                ? _.find(
                    remoteType,
                    (type) => type.option === selectedJob.remote_type
                  )?.lower
                : "~"
            })`}
        </span>
      </div>

      <div
        style={{ backgroundColor: color?.innerBg }}
        className="rounded-md ml-1"
      >
        <div>
          <div className="flex items-center justify-start">
            <FontAwesomeIcon
              style={{
                color: colorToRGBA(color?.secondaryAccent, color?.opacity),
              }}
              className="mx-2"
              icon={faClipboard}
            />
            <h3 className="font-semibold text-base">Job Description</h3>
          </div>
          <div className="ml-5 font-light my-5 text-sm">
            <div
              className="text-editor-priview"
              dangerouslySetInnerHTML={{
                __html: selectedJob?.description || "N/A",
              }}
            />
          </div>
        </div>
        <div>
          <div className="mt-10 flex items-center justify-start">
            <FontAwesomeIcon
              style={{
                color: colorToRGBA(color?.secondaryAccent, color?.opacity),
              }}
              className="mx-2"
              icon={faGear}
            />
            <h3 className="font-semibold text-base mb-2">Mandatory Skillset</h3>
          </div>
          <div className="ml-5 flex font-light flex-wrap my-2 text-sm gap-2">
            {selectedJob?.skills?.length
              ? selectedJob.skills.map((skill: any, index: Key) => (
                  <ul
                    key={index}
                    style={{
                      color: color?.primaryAccent,
                      backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
                    }}
                    className="rounded-md px-3 py-1.5"
                  >
                    <li className="text-xs">{skill.name}</li>
                  </ul>
                ))
              : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}
