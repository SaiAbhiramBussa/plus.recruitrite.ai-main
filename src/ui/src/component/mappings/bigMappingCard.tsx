import { getSpecificJobTitles } from "@/src/services/common.service";
import _ from "lodash";
import { useContext, useEffect, useState } from "react";
import Loader from "../Loader";
import Modal from "../Modal";
import MappingModal from "./MappingModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import dynamic from "next/dynamic";
import { colorToRGBA } from "@/src/utils/misc";
import AppContext from "@/src/context/Context";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

interface textProps {
  text: string;
}

interface TitleListProps {
  list: [
    {
      id: string;
      title: string;
    }
  ];
}

const SlateText = (props: textProps) => {
  return <div className="text-gray-400 mx-1">{props.text}</div>;
};

const BoldText = (props: textProps) => {
  return <div className="font-semibold">{props.text}</div>;
};

export default function BigMappingCard(props: any) {
  const { id, refreshMappings } = props;
  const [loading, setLoading] = useState<boolean>(false);
  const [jobTitleDetails, setJobTitleDetails] = useState<any>({});
  const [isJobTitleModalOpened, setIsJobTitleModalOpened] =
    useState<boolean>(false);
  const { color } = useContext(AppContext);

  useEffect(() => {
    setLoading(true);
    getSpecificJobTitles(id)
      .then((resp: any) => {
        setJobTitleDetails(_.get(resp, `data`));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const TitleList = (props: TitleListProps) => {
    return (
      <div
        style={{ backgroundColor: colorToRGBA(color?.outerBg, color?.opacity) }}
        className="rounded-sm p-2 max-h-60 min-h-[200px] overflow-auto"
      >
        {_.map(
          props.list,
          (titleName: { id: string; title: string }, index: number) => (
            <div key={index} className="font-thin">
              {titleName.title}
            </div>
          )
        )}
      </div>
    );
  };

  const refreshModal = (data: any) => {
    refreshMappings(data);
    setJobTitleDetails(data);
  };

  return (
    <div
      style={{
        backgroundColor: color?.innerBg,
        borderColor: color?.primaryAccent,
      }}
      className={`flex-col items-center justify-center border-2 shadow rounded h-fit pb-4 ${
        loading ? "content-center" : ""
      }`}
    >
      {loading ? (
        <Loader />
      ) : (
        <>
          <div
            style={{ backgroundColor: color?.outerBg }}
            className="flex flex-row w-full px-5 py-1 justify-between"
          >
            <BoldText text="Current Job Title" />
            <SlateText text={jobTitleDetails?.job_title} />
            <div></div>
          </div>
          <div className="flex flex-col py-3 px-5">
            <div className="flex flex-row my-2 justify-between">
              <BoldText text="Past Job Titles" />
              <div
                style={{
                  backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
                }}
                className="w-3/5"
              >
                <SlateText
                  text={`${_.size(jobTitleDetails?.past_mappings)} Job Titles`}
                />
                <TitleList list={jobTitleDetails?.past_mappings} />
              </div>
            </div>
            <div className="flex flex-row my-2 justify-between">
              <BoldText text="Future Job Titles" />
              <div
                style={{
                  backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
                }}
                className="w-3/5"
              >
                <SlateText
                  text={`${_.size(
                    jobTitleDetails?.future_mappings
                  )} Job Titles`}
                />
                <TitleList list={jobTitleDetails?.future_mappings} />
              </div>
            </div>
          </div>
          <div className="flex mt-auto justify-end mr-4">
            <ButtonWrapper
              onClick={() => setIsJobTitleModalOpened(true)}
              classNames="flex justify-center items-center gap-2 rounded-md border border-transparent px-5 py-2 text-sm font-medium shadow-sm focus:outline-none mt-4"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span className="hidden lg:block">{"Map Titles"}</span>
            </ButtonWrapper>
          </div>
        </>
      )}
      <Modal
        open={isJobTitleModalOpened}
        setOpen={setIsJobTitleModalOpened}
        header="Mapping"
        section="publishModal"
      >
        <MappingModal
          refresh={refreshModal}
          jobTitleDetails={jobTitleDetails}
          setIsJobTitleModalOpened={setIsJobTitleModalOpened}
        />
      </Modal>
    </div>
  );
}
