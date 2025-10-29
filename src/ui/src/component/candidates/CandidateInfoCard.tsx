import AppContext from "@/src/context/Context";
import Image from "next/image";
import { useContext } from "react";

type Props = {
  candidateData?: any;
};

export default function CandidateInfoCard(props: Props) {
  const { candidateData } = props;
  const { color } = useContext(AppContext);

  return (
    <div className="flex justify-between w-11/12 items-baseline p-2 shadow-[0_3px_10px_rgb(0,0,0,0.2)] ml-4">
      <div className="flex items-center w-full grid grid-cols-12">
        <div className="flex items-center mr-1 p-1 col-span-2">
          <Image
            className="inline-block h-10 w-10 rounded-full"
            src={candidateData?.picture ?? null}
            alt=""
            width={10000}
            height={10000}
          />
        </div>
        <div className="col-span-5">
          <div
            style={
              candidateData?.first_name ? { color: color?.primaryAccent } : {}
            }
            className={`font-medium text-sm truncate ${
              candidateData?.first_name ? "" : "blur brightness-50"
            } md:max-w-[10vw] md:min-w-[10vw] lg:max-w-[8vw] lg:min-w-[8vw]`}
          >
            {candidateData?.first_name
              ? candidateData?.first_name
              : "Not available"}{" "}
            {candidateData?.last_name ? candidateData?.last_name : ""}
          </div>
          <div className="font-extralight text-xs truncate md:max-w-[10vw] md:min-w-[10vw]  lg:max-w-[8vw] lg:min-w-[8vw]">
            {candidateData?.address?.address}
          </div>
        </div>
        <div className="col-span-5">
          <div className="text-xs font-thin flex items-center truncate lg:max-w-[8vw] lg:min-w-[8vw] md:max-w-[10vw] md:min-w-[10vw]">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3 h-3 mr-1"
            >
              <path d="M10.5 18.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
              <path
                fillRule="evenodd"
                d="M8.625.75A3.375 3.375 0 005.25 4.125v15.75a3.375 3.375 0 003.375 3.375h6.75a3.375 3.375 0 003.375-3.375V4.125A3.375 3.375 0 0015.375.75h-6.75zM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V3h1.125c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 017.5 19.875V4.125z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-xs font-thin truncate lg:max-w-[6vw] lg:min-w-[6vw] md:max-w-[8vw] md:min-w-[8vw]">
              {candidateData?.phone ? candidateData?.phone : "-"}
            </div>
          </div>
          <div className="text-xs flex items-center font-thin truncate lg:max-w-[8vw] lg:min-w-[8vw] md:max-w-[10vw] md:min-w-[10vw]">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3 h-3 mr-1"
            >
              <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
              <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
            </svg>
            <div className="lg:max-w-[6vw] truncate lg:min-w-[6vw] md:max-w-[8vw] md:min-w-[8vw]">
              {candidateData?.email ? (
                <a
                  href={`mailto:${
                    candidateData?.email ? candidateData?.email : ""
                  }`}
                >
                  {candidateData?.email}
                </a>
              ) : (
                "-"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
