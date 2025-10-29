import Image from "next/image";
import { useEffect, useState } from "react";
import Logo from "./Logo";

export default function SignInBanner(props: any) {
  const { page, theme, company, customizationsData, color } = props;

  const [companyRoute, setCompanyRoute] = useState<any>();

  useEffect(() => {
    if (company) setCompanyRoute(`signin+${companyRoute}`);
  }, [company]);

  return (
    <div
      style={
        !theme
          ? {
              backgroundColor: color?.primaryAccent,
              color: color?.innerBg,
            }
          : { color: color?.innerBg }
      }
      className={`${theme?.colors?.gradient} flex flex-col p-6 lg:p-10 mb-6 lg:mb-0 items-start justify-start rounded-lg w-full lg:w-1/3`}
    >
      <div className="flex items-center justify-center w-full">
        <img
          height={theme?.height || customizationsData?.height}
          width={theme?.width || customizationsData?.width}
          src={theme?.logo?.path || customizationsData?.logo}
          alt="banner"
        />
      </div>
      <Image
        height={100}
        width={100}
        src={customizationsData?.banner?.logo}
        alt="banner"
        className={`${
          customizationsData?.banner?.logo?.includes("new")
            ? "w-96 h-96"
            : "w-full h-full"
        } py-8 object-cover`}
      />
      <div className="my-4 text-xl">{customizationsData?.banner?.title}</div>
      {customizationsData?.banner?.subtitles.map(
        (subtitle: string, index: number) => (
          <div key={index} className="flex font-extralight my-2">
            <div className="mr-4">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>{subtitle}</div>
          </div>
        )
      )}
    </div>
  );
}
