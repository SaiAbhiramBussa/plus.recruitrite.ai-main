import Image from "next/image";
import { useContext } from "react";
import Logo from "src/component/SignIn/Logo";
import AppContext from "../context/Context";

export default function SignBanner() {
  const { color } = useContext(AppContext);

  return (
    <div
      style={{
        backgroundColor: color?.primaryAccent,
        color: color?.innerBg,
      }}
      className="flex flex-col p-6 lg:p-10 mb-6 lg:mb-0 items-start justify-start rounded-lg w-full lg:w-1/3"
    >
      <Logo />
      <Image
        height={100}
        width={100}
        src="/Images/foto.png"
        alt=""
        className="hidden h-2/5 w-full mt-2 lg:block"
      />
      <div className="my-4 text-xl">
        We meet our clients, where they are. We do as little or as much of the
        heavy lifting as required.
      </div>
      <div className="flex font-extralight my-2">
        <div className="mr-4">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        Various options to meet your budget
      </div>
      <div className="flex font-extralight my-2">
        <div className="mr-4">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        Various options to help with your internal recruiting capabilities
      </div>
      <div className="flex font-extralight my-2">
        <div className="mr-4">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        Each service built upon a strong AI sourcing foundation{" "}
      </div>
    </div>
  );
}
