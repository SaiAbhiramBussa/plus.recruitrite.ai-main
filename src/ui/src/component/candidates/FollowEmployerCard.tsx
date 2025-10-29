import AppContext from "@/src/context/Context";
import { colorToRGBA } from "@/src/utils/misc";
import Image from "next/image";
import { useContext } from "react";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

export default function FollowEmployerCard(props: any) {
  const { workLocation, companyName, image, job } = props;
  const { color } = useContext(AppContext);

  return (
    <div
      style={{ backgroundColor: color?.innerBg, borderColor: color?.outerBg }}
      className="flex-col items-center justify-center border px-4 py-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex">
          <Image
            className="inline-block h-14 w-14 border ring-2 ring-white mr-5"
            src={image}
            alt="Company Logo"
            height={14}
            width={14}
          />
          <div>
            <div className="font-semibold">{companyName}</div>
            {/* <div className='flex items-center mb-2 mt-2'>
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
              <div className='text-sm'>{workLocation}</div>
            </div> */}
            <div className="inline-flex items-center hustify-center rounded-full py-2">
              <button
                style={{
                  backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
                  color: color?.primaryAccent,
                }}
                className="flex items-center justify-center h-8 rounded-2xl px-4 "
              >
                <div className="text-sm font-semibold">
                  {job} jobs available
                </div>
              </button>
            </div>
          </div>
        </div>
        <ButtonWrapper classNames="flex duration-300 justify-center items-center rounded-sm border border-transparent px-4 py-2 text-base font-medium shadow-sm focus:outline-none">
          +
        </ButtonWrapper>
      </div>
    </div>
  );
}
