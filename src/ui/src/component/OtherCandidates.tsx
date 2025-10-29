import { NextPage } from "next";
import ProfileCard from "./ProfileCard";
import { Key } from "react";

interface Props {
  candidates: Array<any>;
  selectedCandidatesList: Array<any>;
  selectCandidate: any;
  removeCandidate: any;
  setPlanModal?: any;
  color: any;
  colors: any;
}

const OtherCandidates: NextPage<Props> = ({
  candidates,
  selectCandidate,
  selectedCandidatesList,
  setPlanModal,
  removeCandidate,
  color,
  colors,
}) => {
  return (
    <div>
      {candidates?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-24 gap-4 px-4">
          {candidates.map((item: any, index: Key) => (
            <ProfileCard
              detail={item}
              isShowCheckbox={true}
              key={index}
              selectedCandidatesList={selectedCandidatesList}
              selectCandidate={selectCandidate}
              removeCandidate={removeCandidate}
              setPlanModal={setPlanModal}
              color={color}
              colors={colors}
            />
          ))}
        </div>
      ) : (
        <div
          style={{ color: color?.primaryAccent }}
          className="h-[80vh] flex flex-col justify-center items-center"
        >
          <div className="mb-10">
            <div className="flex justify-center font-bold">
              No Candidate Found
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherCandidates;
