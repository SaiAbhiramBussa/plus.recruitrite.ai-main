import AppContext from "@/src/context/Context";
import { colorToRGBA } from "@/src/utils/misc";
import Image from "next/image";
import { useContext } from "react";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

export default function CandidateProfilePage(props: any) {
  const { workLocation, companyName, image, job } = props;
  const { color } = useContext(AppContext);

  return (
    <div
      style={{ backgroundColor: color?.innerBg }}
      className="flex flex-col justify-between items-center px-5 py-5"
    >
      <Image
        className="mb-1 border"
        src={image}
        alt="company logo"
        height={60}
        width={60}
      />
      <div className="text-base font-semibold mb-2">{companyName}</div>
      <div className="flex items-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4 mr-1"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
          />
        </svg>
        <div className="text-sm">{workLocation}</div>
      </div>
      <div className="inline-flex items-center hustify-center rounded-full py-1 px-1 mb-6">
        <button
          style={{
            backgroundColor: colorToRGBA(color?.primaryAccent, color?.opacity),
            color: color?.primaryAccent,
          }}
          className="flex items-center justify-center h-8 rounded-2xl px-4 "
        >
          <div className="text-sm font-semibold">{job} jobs available</div>
        </button>
      </div>
      <ButtonWrapper classNames="flex w-full justify-center items-center rounded-sm border border-transparent px-8 py-3 text-base font-medium shadow-sm focus:outline-none">
        View Profile
      </ButtonWrapper>
    </div>
  );
}
