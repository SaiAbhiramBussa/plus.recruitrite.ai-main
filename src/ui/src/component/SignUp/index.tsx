import { useContext, useState } from "react";
import { EnvelopeIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import CustomizationsData from "../../utils/CustomizationData";
import Image from "next/image";
import SignUpSteps from "@/src/component/SignUp/SignUpSteps";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("../ButtonWrapper"), { ssr: false });
import SignInBanner from "../SignIn/SignInBanner";
import AppContext from "@/src/context/Context";

export default function SignUp(props: any) {
  const { role } = props;
  const searchParams = "stages";
  const customizationsData = CustomizationsData[1].data;
  const { color, theme } = useContext(AppContext);
  const [signUpWith, setSignUpWith] = useState(
    searchParams === "stages" ? "hero" : "steps"
  );

  const SignUpWithEmailHandler = () => {
    setSignUpWith("steps");
  };

  return (
    <div className="mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row md:justify-between">
          <SignInBanner
            customizationsData={customizationsData}
            color={color}
            theme={theme}
          />
          {signUpWith === "hero" ? (
            <div className="px-6 md:px-8  xl:px-10 flex justify-start items-center w-full">
              <div className="flex flex-col gap-6 w-full">
                <div className="text-2xl font-semibold">
                  {customizationsData?.signup?.title}
                </div>
                <div className="text-xl font-semibold">
                  {customizationsData?.signup?.subtitle}
                </div>
                <div className="text-lg font-light">
                  {customizationsData?.signup?.message}
                </div>
                <div className="flex flex-col md:flex-row gap-6 md:justify-between">
                  <ButtonWrapper
                    classNames="flex items-center justify-center rounded-sm border border-transparent w-full md:w-1/3 py-6 text-sm font-medium shadow-sm focus:outline-none transition-all duration-300"
                    onClick={SignUpWithEmailHandler}
                  >
                    {customizationsData?.signup?.btnText}
                    <EnvelopeIcon
                      className="ml-3 -mr-1 h-5 w-5"
                      aria-hidden="true"
                    />
                  </ButtonWrapper>
                </div>
                <div className="flex mt-2 text-sm">
                  Are you already registered?
                  <Link
                    style={{ color: color?.primaryAccent }}
                    href={
                      role === "job-seeker" ? "/candidates/signin" : "/signin"
                    }
                    className="font-medium hover:opacity-75 ml-1 cursor-pointer"
                  >
                    Sign In
                  </Link>
                </div>
                <div className="flex items-center text-lg font-light">
                  <div className="text-green-800 mr-4">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p>
                    {customizationsData?.safety?.title}
                    <Link
                      href="/terms-and-conditions"
                      rel="noreferrer"
                      style={{color: color?.primaryAccent }}
                      className="ml-1"
                    >
                      terms & conditions
                    </Link>
                      <span> and</span>
                    <Link
                      href="/privacy-policy"
                      rel="noreferrer"
                      style={{color: color?.primaryAccent }}
                      className="ml-1"
                    >
                      {customizationsData?.safety?.linkText}
                    </Link>
                    .
                  </p>
                </div>
                <div
                  style={{ borderColor: color?.outerBg }}
                  className="w-full border-t"
                />
                <div className="text-xl font-semibold">
                  {role === "job-seeker"
                    ? customizationsData?.info?.candidateTtle
                    : customizationsData?.info?.employerTitle}
                </div>
                {customizationsData?.clientsList ? (
                  <Image
                    width={100}
                    height={100}
                    src="/Images/signuplogos.png"
                    alt=""
                    className="w-2/3"
                  />
                ) : null}
                <div className="text-lg font-light">
                  {customizationsData?.info?.message}
                </div>
                <div className="flex gap-7">
                  {customizationsData?.info?.tiles.map(
                    (tile: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-start items-center"
                      >
                        <div
                          style={{
                            color: color?.innerBg,
                            backgroundColor: color?.primaryAccent,
                          }}
                          className="flex h-12 w-12 items-center justify-center rounded-sm"
                        >
                          {tile.logo}
                        </div>
                        <div className="ml-4 text-xl font-semibold">
                          {tile.title}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : (
            <SignUpSteps
              setSignUpWith={setSignUpWith}
              role={role}
              customizationsData={customizationsData}
              color={color}
            />
          )}
        </div>
      </div>
    </div>
  );
}
