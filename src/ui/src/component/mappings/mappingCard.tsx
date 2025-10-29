import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Modal from "../Modal";
import { showErrorToast, showSuccessToast } from "@/src/common/common.util";
import { useContext, useState } from "react";
import {
  deleteJobTitle,
  deleteJobTitleMappings,
} from "@/src/services/common.service";
import AppContext from "@/src/context/Context";
import { colorToRGBA } from "@/src/utils/misc";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

interface textProps {
  text: string;
}

const SlateText = (props: textProps) => {
  return <div className=" text-gray-400 mx-1">{props.text}</div>;
};

const BoldText = (props: textProps) => {
  return <div className="font-semibold">{props.text}</div>;
};

export default function MappingCard(props: any) {
  const {
    jobTitle,
    pastTitlesCount,
    futureTitlesCount,
    isSelected,
    refresh,
    id,
  } = props;
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] =
    useState<boolean>(false);
  const [isClearAction, setIsClearAction] = useState<boolean>(false);
  const { color } = useContext(AppContext);

  const deleteTitle = () => {
    deleteJobTitle(id).then((resp) => {
      if (resp?.status == 200) {
        showSuccessToast("Job Title deleted successfully");
        setIsConfirmationModalOpen(false);
        refresh(id, "delete");
      } else {
        showErrorToast("Unable to delete job title");
      }
    });
  };

  const clearTitle = () => {
    deleteJobTitleMappings(id).then((resp) => {
      if (resp?.status == 200) {
        showSuccessToast("Job Title deleted successfully");
        setIsConfirmationModalOpen(false);
        refresh(id, "clear");
      } else {
        showErrorToast("Unable to clear job title");
      }
    });
  };

  return (
    <div
      style={{
        backgroundColor: color?.innerBg,
        color: color?.secondaryAccent,
        borderColor: isSelected ? color?.primaryAccent : color?.outerBg,
      }}
      className="flex-col items-center justify-center shadow rounded hover:shadow-lg border"
    >
      <div
        style={{ backgroundColor: color?.outerBg }}
        className="flex flex-row w-full px-5 py-1 justify-between"
      >
        <div className="grid grid-cols-2 justify-between content-center">
          <div className="text-end">
            <SlateText text={jobTitle} />{" "}
          </div>
          <FontAwesomeIcon
            icon={faTrash}
            style={{ color: color?.primaryAccent }}
            className="h-4 ml-1 cursor-pointer mt-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsConfirmationModalOpen(true);
              setIsClearAction(true);
            }}
          />
        </div>
        <div>
          <FontAwesomeIcon
            icon={faTrash}
            style={{ color: color?.primaryAccent }}
            className="h-4 ml-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsConfirmationModalOpen(true);
              setIsClearAction(false);
            }}
          />
        </div>
      </div>
      <div className="flex flex-col py-3 px-5">
        <div className="flex flex-row my-2 justify-between">
          <BoldText text="Past Job Titles" />
          <div
            style={{ backgroundColor: colorToRGBA(color?.primaryAccent, 0.1) }}
            className="w-3/5"
          >
            <SlateText text={`${pastTitlesCount} Job Titles`} />
          </div>
        </div>
        <div className="flex flex-row my-2 justify-between">
          <BoldText text="Future Job Titles" />
          <div
            style={{ backgroundColor: colorToRGBA(color?.primaryAccent, 0.1) }}
            className="w-3/5"
          >
            <SlateText text={`${futureTitlesCount} Job Titles`} />
          </div>
        </div>
      </div>
      <Modal
        open={isConfirmationModalOpen}
        setOpen={setIsConfirmationModalOpen}
        header="Confirmation"
      >
        <div className="flex flex-col gap-6 mt-4">
          <div className="text-md">
            Are you sure you want to{" "}
            {isClearAction ? "clear the Job Title" : "delete the Job Title"}
          </div>
          <div className="flex gap-2 items-center justify-end">
            <button
              type="button"
              className="disabled:cursor-not-allowed flex justify-center items-center rounded border border-transparent px-4 py-1 text-base font-medium shadow-sm focus:outline-none mt-4 bg-red-500 hover:bg-red-400 disabled:bg-red-200"
              onClick={() => {
                setIsConfirmationModalOpen(false);
              }}
            >
              {"Cancel"}
            </button>
            <ButtonWrapper
              classNames="flex justify-center items-center rounded border border-transparent px-4 py-1 text-base font-medium shadow-sm focus:outline-none mt-4"
              onClick={() => {
                isClearAction ? clearTitle() : deleteTitle();
              }}
            >
              {"Confirm"}
            </ButtonWrapper>
          </div>
        </div>
      </Modal>
    </div>
  );
}
