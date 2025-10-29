import { useContext } from "react";
import AppContext from "../context/Context";
import { colorToRGBA } from "../utils/misc";

export default function StepsCard() {
  const { color } = useContext(AppContext);
  return (
    // <div className={`w-[50vh] my-6 rounded ${id%2 === 0 ? 'translate-x-20 border-r-8 border-indigo-800' : '-translate-x-20 border-l-8 border-indigo-800'} shadow p-4 border-[#0062511] bg-[#f0eafe]`}>
    //   <div className=" font-bold flex items-center ">
    //     <div className="bg-[#006251] text-white rounded px-1">{id}</div>
    //     <div className="ml-2 text-xl">{title}</div>
    //   </div>
    //   <div className="mt-6 text-[#006251] leading-7">{description}</div>
    // </div>

    <ol
      style={{ color: color?.secondaryAccent }}
      className="sm:flex justify-between mt-10"
    >
      <li className="relative mb-6 flex-1 sm:mb-0">
        <div className="flex justify-center items-center">
          <div
            style={{ backgroundColor: color?.secondaryAccent }}
            className="hidden sm:flex w-full h-0.5"
          ></div>
          <div
            style={{
              backgroundColor: color?.primaryAccent,
              color: color?.innerBg,
            }}
            className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 ring-white sm:ring-8 shrink-0"
          >
            {/* <svg className="w-2.5 h-2.5 text-blue-800 dark:text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
              </svg> */}
            <div>1</div>
          </div>
          <div
            style={{ backgroundColor: color?.secondaryAccent }}
            className="hidden sm:flex w-full h-0.5"
          ></div>
        </div>
        <div className="mt-6 text-center sm:px-3">
          <h3 className="text-lg font-semibold">PROCESS</h3>
          <p
            style={{
              color: colorToRGBA(color?.secondaryAccent, color?.opacity),
            }}
            className=" mt-4 text-xs font-normal"
          >
            At RecruitRite, we exceed the notion of relying solely on our network
            by employing a comprehensive process, resulting in satisfied clients
            who appreciate our exceptional talent acquisition services.
          </p>
        </div>
      </li>
      <li className="relative flex-1 mb-6 sm:mb-0">
        <div className="flex justify-center items-center">
          <div
            style={{ backgroundColor: color?.secondaryAccent }}
            className="hidden sm:flex w-full h-0.5"
          ></div>
          <div
            style={{
              backgroundColor: color?.primaryAccent,
              color: color?.innerBg,
            }}
            className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 ring-white sm:ring-8 shrink-0"
          >
            {/* <svg className="w-2.5 h-2.5 text-blue-800 dark:text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
                </svg> */}
            <div>2</div>
          </div>
          <div
            style={{ backgroundColor: color?.secondaryAccent }}
            className="hidden sm:flex w-full h-0.5"
          ></div>
        </div>
        <div className="mt-6 text-center sm:px-3">
          <h3 className="text-lg font-semibold">SCOUR</h3>
          <p className=" mt-4 text-xs font-normal text-gray-500 dark:text-gray-400">
            We understand that high-level requisitions demand more than just
            meeting skill requirements; we diligently search for candidates who
            possess the perfect blend of skills, cultural fit, personality, and
            team complementarity to ensure the best match for our clients.
          </p>
        </div>
      </li>
      <li className="relative flex-1 mb-6 sm:mb-0">
        <div className="flex justify-center items-center">
          <div
            style={{
              backgroundColor: color?.secondaryAccent,
            }}
            className="hidden sm:flex w-full h-0.5"
          ></div>
          <div
            style={{
              backgroundColor: color?.primaryAccent,
              color: color?.innerBg,
            }}
            className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 ring-white sm:ring-8 shrink-0"
          >
            {/* <svg className="w-2.5 h-2.5 text-blue-800 dark:text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
                </svg> */}
            <div>3</div>
          </div>
          <div
            style={{
              backgroundColor: color?.secondaryAccent,
            }}
            className="hidden sm:flex w-full h-0.5"
          ></div>
        </div>
        <div className="mt-6 text-center sm:px-3">
          <h3 className="text-lg font-semibold">ROUST</h3>
          <p
            style={{
              color: colorToRGBA(color?.secondaryAccent, color?.opacity),
            }}
            className=" mt-4 text-xs font-normal"
          >
            We go the extra mile by engaging with numerous candidates,
            effectively communicating the compelling story of your organization
            and showcasing the benefits and excitement it offers. After thorough
            vetting and assessment, we present you with the best candidates who
            align with your requisition and possess the ideal skill-set and
            cultural fit.
          </p>
        </div>
      </li>
      <li className="relative flex-1 mb-6 sm:mb-0">
        <div className="flex items-center justify-center">
          <div
            style={{
              backgroundColor: color?.secondaryAccent,
            }}
            className="hidden sm:flex w-full h-0.5"
          ></div>
          <div
            style={{
              backgroundColor: color?.primaryAccent,
              color: color?.innerBg,
            }}
            className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 ring-white sm:ring-8 shrink-0"
          >
            {/* <svg className="w-2.5 h-2.5 text-blue-800 dark:text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
                </svg> */}
            <div>4</div>
          </div>
          <div
            style={{
              backgroundColor: color?.secondaryAccent,
            }}
            className="hidden sm:flex w-full h-0.5"
          ></div>
        </div>
        <div className="mt-6 text-center sm:px-3">
          <h3 className="text-lg font-semibold">NEGOTIATION</h3>
          <p
            style={{
              color: colorToRGBA(color?.secondaryAccent, color?.opacity),
            }}
            className=" mt-4 text-xs font-normal"
          >
            We prioritize successful outcomes over mere financial
            considerations, navigating the delicate negotiation process to
            ensure a mutually beneficial agreement where both parties are
            satisfied. We understand the nuances of the negotiation process and
            act as intermediaries, effectively interpreting and addressing the
            needs and desires of both candidates and clients.
          </p>
        </div>
      </li>
      <li className="relative flex-1 mb-6 sm:mb-0">
        <div className="flex items-center justify-center">
          <div
            style={{
              backgroundColor: color?.secondaryAccent,
            }}
            className="hidden sm:flex w-full h-0.5"
          ></div>
          <div
            style={{
              backgroundColor: color?.primaryAccent,
              color: color?.innerBg,
            }}
            className="z-10 flex items-center justify-center w-6 h-6 rounded-full ring-0 ring-white sm:ring-8 shrink-0"
          >
            {/* <svg className="w-2.5 h-2.5 text-blue-800 dark:text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
                </svg> */}
            <div>5</div>
          </div>
          <div
            style={{
              backgroundColor: color?.secondaryAccent,
            }}
            className="hidden sm:flex w-full h-0.5"
          ></div>
        </div>
        <div className="mt-6 text-center sm:px-3">
          <h3 className="text-lg font-semibold">DELIVER</h3>
          <p
            style={{
              color: colorToRGBA(color?.secondaryAccent, color?.opacity),
            }}
            className=" mt-4 text-xs font-normal"
          >
            Our expertise lies in the meticulous combination of art and science
            to handpick the best candidates who meet your organization's high
            standards, ensuring top-notch quality and game-changing potential to
            drive your company to new heights of success
          </p>
        </div>
      </li>
    </ol>
  );
}
