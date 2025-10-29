import { NextPage } from "next";
import { useContext, useEffect, useState } from "react";
import React from "react";
import Select from "react-select";
import _ from "lodash";
import { showErrorToast, showSuccessToast } from "@/src/common/common.util";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  addMappingToJobTitle,
  getAllJobTitles,
} from "@/src/services/common.service";
import dynamic from "next/dynamic";
import AppContext from "@/src/context/Context";
import { colorToRGBA } from "@/src/utils/misc";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

export const Option = ({
  innerProps,
  label,
  data,
  isDisabled,
  isSelected,
  value,
}: any) => {
  const { color } = useContext(AppContext);

  return (
    <div
      {...innerProps}
      style={
        isSelected
          ? { backgroundColor: colorToRGBA(color?.outerBg, color?.opacity) }
          : {}
      }
      className={`flex items-center px-2 py-2 hover:opacity-75 border-b cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {data.icon ? (
        <FontAwesomeIcon icon={data.icon} className="mr-4" />
      ) : (
        <></>
      )}
      <span>{label}</span>
    </div>
  );
};

const customStyles = {
  placeholder: (provided: any, state: any) => ({
    ...provided,
    height: 25,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 14,
    marginTop: 2,
  }),
};

const MappingModal: NextPage<any> = ({
  setIsJobTitleModalOpened,
  refresh,
  jobTitleDetails,
}) => {
  const [allTitle, setAllTitle] = useState<
    Array<{ id: string; title: string }>
  >([]);

  const [mappingsTitle, setMappingsTitle] = useState<any>(jobTitleDetails);
  const [loading, setLoading] = useState<boolean>(false);
  const { color } = useContext(AppContext);

  useEffect(() => {
    getAllJobTitles("").then((result: any) => {
      setAllTitle(
        _.map(
          _.filter(result.data, (title: any) => title.id != jobTitleDetails.id),
          (title: any) => ({
            id: title.id,
            title: title.title,
          })
        )
      );
    });
  }, []);

  const handleSaveJobTitle = async () => {
    setLoading(true);
    addMappingToJobTitle(jobTitleDetails.id, mappingsTitle)
      .then((result: any) => {
        if (result.status === 200) {
          showSuccessToast("Mapping are saved");
          refresh(result.data);
        } else {
          showErrorToast("Unable to mapping ");
        }
      })
      .finally(() => {
        setIsJobTitleModalOpened(false);
        setLoading(false);
      });
  };

  const deleteFutureTitle = (title: any) => {
    if (_.get(title, "action") == "add") {
      mappingsTitle.future_mappings = _.filter(
        mappingsTitle.future_mappings,
        (map_title) => map_title.id != title.id
      );
    } else {
      mappingsTitle.future_mappings = _.map(
        mappingsTitle.future_mappings,
        (map_title) => {
          if (map_title.id == title.id) {
            _.set(map_title, "action", "delete");
          }
          return map_title;
        }
      );
    }
    setMappingsTitle({ ...mappingsTitle });
  };

  const deletePastTitle = (title: any) => {
    if (_.get(title, "action") == "add") {
      mappingsTitle.past_mappings = _.filter(
        mappingsTitle.past_mappings,
        (map_title) => map_title.id != title.id
      );
    } else {
      mappingsTitle.past_mappings = _.map(
        mappingsTitle.past_mappings,
        (map_title) => {
          if (map_title.id == title.id) {
            _.set(map_title, "action", "delete");
          }
          return map_title;
        }
      );
    }

    setMappingsTitle({ ...mappingsTitle });
  };

  const getJobTitleOptions = (): { label: string; value: any }[] => {
    const allUsedTitleIds = _.map(
      _.filter(
        [...mappingsTitle.future_mappings, ...mappingsTitle.past_mappings],
        (title) => _.get(title, "action") != "delete"
      ),
      (title) => title.id
    );
    return _.map(
      _.filter(allTitle, (title) => !_.includes(allUsedTitleIds, title.id)),
      (item) => ({
        label: item.title,
        value: item,
      })
    );
  };

  const addTitleToPastTitle = (data: { id: string; title: any }) => {
    const findMapping = _.findIndex(
      mappingsTitle.past_mappings,
      (title: any) => _.get(title, "action") == "delete" && data.id == title.id
    );
    if (findMapping != -1) {
      _.set(mappingsTitle, `past_mappings[${findMapping}]`, data);
      setMappingsTitle({ ...mappingsTitle });
      return;
    }
    mappingsTitle.past_mappings.push({ ...data, action: "add" });
    setMappingsTitle({ ...mappingsTitle });
  };

  const addTitleToFutureTitle = (data: { id: string; title: any }) => {
    const findMapping = _.findIndex(
      mappingsTitle.future_mappings,
      (title: any) => _.get(title, "action") == "delete" && data.id == title.id
    );
    if (findMapping != -1) {
      _.set(mappingsTitle, `future_mappings[${findMapping}]`, data);
      setMappingsTitle({ ...mappingsTitle });
      return;
    }
    mappingsTitle.future_mappings.push({ ...data, action: "add" });
    setMappingsTitle({ ...mappingsTitle });
  };

  return (
    <div className="p-3 min-h-min">
      <div className=" font-medium text-lg z-10">
        {jobTitleDetails.job_title}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <Select
          options={!_.isEmpty(mappingsTitle) ? getJobTitleOptions() : []}
          onChange={(e: any) => {
            addTitleToPastTitle(e.value);
          }}
          placeholder="Select Title For Past Job"
          components={{ Option }}
          className="font-normal"
          isDisabled={_.isEmpty(mappingsTitle)}
          styles={customStyles}
        />
        <Select
          options={!_.isEmpty(mappingsTitle) ? getJobTitleOptions() : []}
          onChange={(e: any) => {
            addTitleToFutureTitle(e.value);
          }}
          placeholder="Select Title For Future Job"
          components={{ Option }}
          isDisabled={_.isEmpty(mappingsTitle)}
          styles={customStyles}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-3">
        <div
          style={{ borderColor: color?.outerBg }}
          className={`border rounded p-3 transition-all`}
        >
          <p className=" font-medium text-sm">Past Job Titles</p>
          <ul className="list-disc ml-6 min-h-[150px]">
            {_.map(mappingsTitle?.past_mappings, (title: any) => {
              if (_.get(title, "action") != "delete") {
                return (
                  <li key={title.id}>
                    <div className="font-extralight text-sm grid grid-cols-4 gap-2">
                      <div className="col-span-3">{title.title}</div>
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="cursor-pointer"
                        onClick={() => deletePastTitle(title)}
                      />
                    </div>
                  </li>
                );
              }
            })}
          </ul>
        </div>
        <div
          style={{ borderColor: color?.outerBg }}
          className={`border rounded p-3 transition-all`}
        >
          <p className=" font-medium text-sm">Future Job Titles</p>
          <ul className="list-disc ml-6 min-h-[150px]">
            {mappingsTitle?.future_mappings?.map(
              (title: any, index: number) => {
                if (_.get(title, "action") != "delete") {
                  return (
                    <li key={title.id}>
                      <div className="font-extralight text-sm grid grid-cols-4 gap-2">
                        <div className="col-span-3">{title.title}</div>
                        <FontAwesomeIcon
                          icon={faTrash}
                          className="cursor-pointer"
                          onClick={() => deleteFutureTitle(title)}
                        />
                      </div>
                    </li>
                  );
                }
              }
            )}
          </ul>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <ButtonWrapper
          onClick={handleSaveJobTitle}
          disabled={loading}
          classNames="flex items-center justify-center rounded border border-transparent px-5 py-2.5 text-sm font-medium shadow-sm focus:outline-none mr-4"
        >
          <FontAwesomeIcon icon={faSave} className="h-4 mr-1 cursor-pointer" />
          <span className="mx-1 hidden lg:block">
            {loading ? "Saving Mappings..." : "Save Mappings"}
          </span>
        </ButtonWrapper>
      </div>
    </div>
  );
};

export default MappingModal;
