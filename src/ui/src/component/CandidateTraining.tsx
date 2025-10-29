import React, { Key, useEffect, useState } from "react";
import { TargetLabelFormModel } from "../common/common.util";
import Image from "next/image";
import TargetLabelForm from "./TargetLabelForm";
import { colorToRGBA } from "../utils/misc";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import _ from "lodash";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

function CandidateTraining(props: any) {
  const { data, color, appendRankedCandidates, rankCandidates, labelCounts } =
    props;
  const {
    first_name,
    last_name,
    candidate_id,
    skills,
    email,
    phone_code,
    phone,
    picture,
    work_history,
    education_history,
    linked_in,
    labels,
    summary,
  } = data;
  const [isTargetLabelFormValue, setIsTargetLabelFormValue] =
    useState<TargetLabelFormModel>(labels);
  const [updatedWorkHistory, setUpdatedWorkHistory] = useState<any>([]);

  useEffect(() => {
    setIsTargetLabelFormValue(labels);
  }, [labels]);

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
    if (!_.isEqual(isTargetLabelFormValue, labels)) {
      handleRankChange();
    }
  }, [isTargetLabelFormValue, labels]);

  const func = (cand_obj: any) => {
    appendRankedCandidates(cand_obj);
  };

  const handleRankChange = () => {
    const cand_obj = {
      candidate_id: candidate_id,
      labels: isTargetLabelFormValue,
    };

    func(cand_obj);
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
    <div className="flex relative flex-col gap-3">
      <div
        style={{ backgroundColor: color.innerBg }}
        className="flex flex-col sticky top-0"
      >
        <div className="flex gap-2 items-center">
          <Image
            src="/Images/h1-icon.png"
            width={10000}
            height={10000}
            className="w-3 h-3"
            alt=""
          />
          <p className="text-base font-semibold">Target Label</p>
        </div>
        <div className="flex justify-between gap-2 items-center">
          <TargetLabelForm
            targetLabelFormInputObj={isTargetLabelFormValue}
            setIsTargetLabelFormValue={setIsTargetLabelFormValue}
            rankCandidates={true}
            color={color}
            labelCounts={labelCounts}
          />
          <span className="flex justify-end mr-1.5">
            <ButtonWrapper
              classNames="px-3 py-1 rounded-md text-sm"
              onClick={() => rankCandidates(true)}
            >
              Save
            </ButtonWrapper>
          </span>
        </div>
        <div
          style={{
            backgroundColor: colorToRGBA(color?.secondaryAccent, 0.1),
          }}
          className="w-full h-0.5 my-2"
        ></div>
      </div>
      <div className="flex gap-4">
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
          alt="profile picture"
        />
        <div className="flex flex-col justify-center gap-2">
          {first_name || last_name ? (
            <p>{[first_name, last_name].join(" ")}</p>
          ) : (
            "Not Available"
          )}
          <span className="text-sm max-h-40 overflow-x-auto">{summary}</span>
        </div>
      </div>
      <div className="flex flex-col p-3 gap-6">
        <div className="flex items-center justify-start mr-4 mt-2">
          <Image
            src="/Images/h1-icon.png"
            width={10000}
            height={10000}
            className="w-3 h-3 mr-2"
            alt=""
          />
          <div className="text-base font-semibold">Skills</div>
        </div>
        <div className="flex ml-5 justify-start flex-wrap items-center gap-2 mb-2">
          {!skills?.length ? (
            <div className="text-xs ml-1 font-extralight">
              No skills to show
            </div>
          ) : (
            skills.map((item: any, index: Key) => (
              <div
                key={index}
                style={{
                  backgroundColor: colorToRGBA(color.primaryAccent, 0.1),
                  color: color.primaryAccent,
                }}
                className="rounded-xl px-3 py-1.5 text-xs md:text-sm"
              >
                {item.skill}
              </div>
            ))
          )}
        </div>
        <div>
          <div className="flex items-center justify-start mr-4 mt-2">
            <Image
              src="/Images/h1-icon.png"
              width={10000}
              height={10000}
              className="w-3 h-3 mr-2"
              alt=""
            />
            <div className="text-base font-semibold">Work history</div>
          </div>
          <ol className="mt-5 px-6 text-sm">
            {updatedWorkHistory?.length
              ? getReorderedArray(
                  updatedWorkHistory,
                  (item: any) => !item.to_date && item.from_date
                ).map((item: any, index: Key) => (
                  <div key={index}>
                    <div className="font-semibold">{item.title}</div>
                    <div className="font-extralight">
                      {item.from_date && item.to_date
                        ? `${item.from_date} to ${item.to_date}`
                        : item.from_date
                        ? `${item.from_date} to Present`
                        : item.to_date
                        ? `N/A to ${item.to_date}`
                        : null}
                    </div>
                    <div className="font-extralight">{item.company}</div>
                    <div className="mt-1">{item.description}</div>
                  </div>
                ))
              : "No work history available."}
          </ol>
        </div>
      </div>
      <div className="p-1">
        <div className="flex items-center justify-start mr-4 mt-2">
          <Image
            src="/Images/h1-icon.png"
            width={10000}
            height={10000}
            className="w-3 h-3 mr-2"
            alt=""
          />
          <div className="text-base font-semibold">Education history</div>
        </div>
        <ol className="mb-2 mt-6 mx-8 text-sm">
          {education_history?.length
            ? education_history.map((item: any, index: Key) => (
                <div key={index}>
                  <div className="font-semibold">
                    {item.degree ? item.degree : "School"}
                  </div>
                  <div className="font-extralight">
                    {!item.name ? "Not Available" : item.name}
                  </div>
                </div>
              ))
            : "No education history available."}
        </ol>
      </div>
      <div className="p-1">
        <div className="flex mb-5 items-center justify-start mr-4">
          <Image
            src="/Images/h1-icon.png"
            width={10000}
            height={10000}
            className="w-3 h-3 mr-2"
            alt=""
          />
          <div className="text-base font-semibold">Contact</div>
        </div>
        <div className="flex gap-3 flex-col ml-4">
          {phone ? (
            <div className="flex items-center justify-start gap-4">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M10.5 18.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
                <path
                  fillRule="evenodd"
                  d="M8.625.75A3.375 3.375 0 005.25 4.125v15.75a3.375 3.375 0 003.375 3.375h6.75a3.375 3.375 0 003.375-3.375V4.125A3.375 3.375 0 0015.375.75h-6.75zM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V3h1.125c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 017.5 19.875V4.125z"
                  clipRule="evenodd"
                />
              </svg>
              <div
                style={{ color: color.primaryAccent }}
                className="text-sm font-extralight"
              >
                {phone ? [phone_code, phone].join(" ") : "Not Available"}
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-start gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
              <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
            </svg>
            <div
              style={{ color: color.primaryAccent }}
              className="text-xs md:text-sm font-extralight"
            >
              {email ? email : "Not Available"}
            </div>
          </div>
          <div className="flex items-center justify-start gap-2">
            <FontAwesomeIcon icon={faLinkedin} className="w-5 h-5" />
            <div
              style={{ color: color.primaryAccent }}
              className="text-xs md:text-sm font-extralight"
            >
              {linked_in ? (
                <a href={linked_in} target="_blank">
                  {linked_in}
                </a>
              ) : (
                "Not Available"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateTraining;
