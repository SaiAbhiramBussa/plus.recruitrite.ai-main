import _, { set } from "lodash";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import TextInput from "../TextInput";
import StartDateButton from "../StartDateButton";
import {
  faClose,
  faPen,
  faRepeat,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import {
  getDefaultWeightages,
  getWeightages,
  postWeightages,
} from "@/src/services/common.service";
import { showSuccessToast } from "@/src/common/common.util";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("../ButtonWrapper"));

interface Props {
  jobId: string;
  openModal: any;
  color: any;
}

const defaultLabels = {
  future_title: 0,
  recent_title: 0,
  recent_skip_title: 0,
  exists_anywhere: 0,
  summary: 0,
};

const TargetLabelPercentage: NextPage<Props> = ({
  jobId,
  openModal,
  color,
}) => {
  const [form, setForm] = useState<any>(defaultLabels);
  const [formCopy, setFormCopy] = useState<any>(defaultLabels);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [error, setError] = useState<any>({ type: null, message: "" });

  useEffect(() => {
    getFormData();
  }, []);

  const getFormData = (isRestore = false) => {
    getWeightages(jobId).then((resp) => {
      let fetchedFormData = _.cloneDeep(form);

      _.forEach(resp?.data, (label: any) => {
        if (_.get(label, "weightage")) {
          fetchedFormData[label.type] = _.get(label, "weightage");
        }
      });

      setForm(fetchedFormData);
      setFormCopy(fetchedFormData);

      if (isRestore) {
        showSuccessToast("Labels are Restored");
      }
    });
  };

  const getFormLabel: Function = (key: string): string => {
    return _.join(
      _.map(_.split(key, "_"), (item) => _.capitalize(item)),
      " "
    );
  };

  const changeTargetLabelPercentage = (form: any) => {
    let payload = _.map(Object.keys(form), (key: string) => ({
      type: key,
      weightage: form[key] || 0,
    }));

    try {
      if (form.summary > 100) {
        setError({
          type: "summary",
          message: `Please enter a positive number between 0 and 100!`,
        });

        throw new Error();
      }

      payload.forEach((item) => {
        if (item.weightage < 0 || item.weightage > 100) {
          setError({
            type: item.type,
            message: `Please enter a positive number between 0 and 100!`,
          });

          throw new Error();
        } else if (item.weightage + form.summary > 100) {
          setError({
            type: item.type,
            message:
              "Total percentage should not exceed 100 (including summary)!",
          });

          throw new Error();
        }
      });
    } catch (error) {
      return;
    }

    if (payload.length) {
      postWeightages(payload, jobId).then(() => openModal(false));
    }
  };

  const restoreDefaults = () => {
    getDefaultWeightages(jobId).then((resp) => {
      let fetchedFormData = {};

      _.forEach(resp?.data, (label: any) => {
        console.log(label);
        if (_.get(label, "weightage")) {
          _.set(fetchedFormData, `${label.type}`, _.get(label, "weightage"));
        }
      });

      setForm(() => fetchedFormData);
      changeTargetLabelPercentage(fetchedFormData);
    });
  };

  return (
    <div>
      {isEditMode ? (
        _.map(Object.keys(form), (key: string, index: number) => {
          return (
            <TextInput
              key={index}
              max={100}
              type="number"
              section="admin"
              name={getFormLabel(key)}
              placeholder={"0"}
              label={getFormLabel(key)}
              value={_.get(form, key)}
              onKeyDown={(e: any) =>
                e.code == "Minus" ||
                e.code == "NumpadSubtract" ||
                e.code == "KeyE"
                  ? e.preventDefault()
                  : ""
              }
              onChange={(e: any) => {
                setForm({ ...form, [key]: parseInt(e.target.value) });
                setError({ type: null, message: "" });
              }}
              error={error.type === key ? error.message : null}
            />
          );
        })
      ) : (
        <div>
          {_.map(Object.keys(form), (key: string, index: number) => (
            <div className="flex justify-between p-2" key={index}>
              <span>{getFormLabel(key)}</span>
              <span>{form[key]}%</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-8 flex justify-between">
        <div>
          {isEditMode && (
            <StartDateButton
              isDisabled={false}
              action={restoreDefaults}
              btnLabel={"Restore Defaults"}
              icon={faRepeat}
            />
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={`${
              isEditMode ? "bg-red-500" : `bg-[${color?.primaryAccent}]`
            } px-3 py-1.5 gap-2 text-white cursor-pointer hover:opacity-80 flex justify-between items-center rounded-md`}
            onClick={() => {
              setForm(formCopy);
              setIsEditMode(!isEditMode);
            }}
          >
            <FontAwesomeIcon icon={isEditMode ? faClose : faPen} />
            {isEditMode ? "Cancel" : "Modify"}
          </button>
          {isEditMode && (
            <StartDateButton
              isDisabled={_.isEqual(form, formCopy)}
              action={() => changeTargetLabelPercentage(form)}
              btnLabel={"Save"}
              icon={faSave}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TargetLabelPercentage;
