import _ from "lodash";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import {
  TargetLabelFormModel,
  keyLabelTargetLabelMapObj,
} from "../common/common.util";

interface Props {
  targetLabelFormInputObj: TargetLabelFormModel | undefined;
  setIsTargetLabelFormValue: any;
  rankCandidates?: any;
  labelCounts?: any;
  color: any;
}

const TargetLabelForm: NextPage<Props> = ({
  targetLabelFormInputObj,
  setIsTargetLabelFormValue,
  rankCandidates,
  color,
  labelCounts,
}) => {
  const [targetLabelForm, setTargetLabelForm] = useState<TargetLabelFormModel>({
    future_title: _.get(targetLabelFormInputObj, "future_title", false),
    recent_title: _.get(targetLabelFormInputObj, "recent_title", false),
    recent_skip_title: _.get(
      targetLabelFormInputObj,
      "recent_skip_title",
      false
    ),
    exists_anywhere: _.get(targetLabelFormInputObj, "exists_anywhere", false),
    summary: _.get(targetLabelFormInputObj, "summary", false),
  });

  useEffect(() => {
    setIsTargetLabelFormValue(targetLabelForm);
  }, [targetLabelForm]);

  const setFormAccordingToKey = (key: string, value: boolean) => {
    let obj = targetLabelForm;
    _.set(obj, key, value);
    setTargetLabelForm({ ...obj });
  };

  return (
    <div
      style={{
        flexDirection: rankCandidates ? "row" : "column",
        gap: rankCandidates ? "4px" : "0",
        flexGrow: rankCandidates ? 1 : 0,
        backgroundColor: color.innerBg,
      }}
      className="flex p-2 flex-wrap"
    >
      {Object.keys(targetLabelForm).map((key: string, index: number) => {
        return (
          <div key={index} className="flex justify-between gap-2 items-center">
            <span className="text-xs md:text-sm font-extralight ">
              {_.get(keyLabelTargetLabelMapObj, `${key}`)}
              {labelCounts ? ` (${labelCounts[key]})` : null}
            </span>
            <input
              style={{
                order: rankCandidates ? -1 : 0,
                accentColor: color?.primaryAccent,
              }}
              className="h-4 w-4 ml-2"
              type="checkbox"
              onChange={(e) => setFormAccordingToKey(key, e.target.checked)}
              checked={_.get(targetLabelFormInputObj, key)}
            ></input>
          </div>
        );
      })}
    </div>
  );
};

export default TargetLabelForm;
