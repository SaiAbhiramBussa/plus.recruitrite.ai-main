import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { useEffect } from "react";
import { colorToRGBA } from "../utils/misc";
import ButtonWrapper from "./ButtonWrapper";

export default function PlanCard(props: any) {
  const {
    name,
    features,
    index,
    showPaymentPopup,
    price,
    tag,
    active,
    showBoth,
    openChatHandler,
    disclaimer,
    page,
    color,
  } = props;

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load Crisp chat widget script
      const crispScript = document.createElement("script");
      crispScript.src = "https://client.crisp.chat/l.js";
      crispScript.async = true;
      document.body.appendChild(crispScript);
    }
  }, []);

  const openChat = () => {
    window.$crisp.push(["do", "chat:open"]);
  };

  return (
    <div>
      <div
        style={
          active
            ? { borderColor: colorToRGBA(color?.primaryAccent, color?.opacity) }
            : {
                borderColor: colorToRGBA(
                  color?.secondaryAccent,
                  color?.opacity
                ),
              }
        }
        className={` ${
          active ? "border scale-105 shadow-xl" : "border shadow-md"
        } transition-transform duration-200 ease-in-out ${
          page === "checkout"
            ? "md:w-[22vw] shadow-lg"
            : props.slug === "ai_silver"
            ? "w-72 lg:w-80 xl:h-[520px] lg:ml-4 xl:ml-0 lg:shadow-lg xl:z-50 lg:hover:scale-105 xl:hover:scale-[1.05] pb-8"
            : "w-72 lg:w-80 lg:hover:scale-105 pb-8"
        }  h-full relative rounded-lg mb-5 ${
          props.slug === "free" ? "py-10" : ""
        }`}
      >
        {disclaimer && (
          <div
            style={{
              backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
              color: color?.primaryAccent,
            }}
            className="text-xs w-full text-center p-1"
          >
            {disclaimer}
          </div>
        )}
        <div className=" flex flex-col items-center justify-between">
          <div className="mb-2 mt-6 font-bold text-xl">{name}</div>
          <div
            style={{ color: color?.primaryAccent }}
            className="text-xs mb-6 font-semibold"
          >
            {tag}
          </div>
          {props.slug !== "full_service" && (
            <div className="font-extralight text-sm mb-6">
              <span className="text-3xl font-bold">${price}</span> / month
            </div>
          )}
          {props.slug === "full_service" && (
            <div className="font-extralight text-sm mb-6">
              <span className="text-3xl font-bold">Chat with us.</span>
            </div>
          )}
          <div className={`mb-12 mt-4 px-4`}>
            {features.map((feature: any, key: any) => (
              <div key={key}>
                {index === 2 || key !== 4 || props.slug === "flat_fee" ? (
                  <div className="flex items-start mb-3">
                    <FontAwesomeIcon
                      style={{
                        color: color?.primaryAccent,
                        backgroundColor: color?.innerBg,
                      }}
                      icon={faCheck}
                      className="h-3 mt-1 mr-2 p-0 shadow-xl"
                    />
                    <div className=" font-extralight text-[13px] tracking-wide">
                      {feature}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center mb-3">
                    <FontAwesomeIcon
                      style={{ backgroundColor: color?.innerBg }}
                      icon={faTimes}
                      className="h-3 mt-1 mr-2 p-0 shadow-xl text-red-400"
                    />
                    <div className="font-extralight text-[13px] tracking-wide">
                      {feature}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {active && (
            <ButtonWrapper
              classNames={`mt-6 absolute bottom-6 mx-auto w-[60%] px-2 py-3 ${
                active ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              } rounded`}
              disabled={active}
              onClick={() => showPaymentPopup(index)}
            >
              {active ? `Active Plan` : `Activate Plan`}
            </ButtonWrapper>
          )}
          {showBoth && index !== 0 && (
            <ButtonWrapper
              classNames={`mt-6 absolute bottom-6 mx-auto w-[60%] px-2 py-3 ${
                active ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              } rounded`}
              disabled={active}
              onClick={() => showPaymentPopup(index)}
            >
              {active ? `Active Plan` : `Activate Plan`}
            </ButtonWrapper>
          )}
          {props.slug === "flat_fee" && (
            <ButtonWrapper
              classNames={`mt-6 absolute bottom-6 mx-auto w-[60%] px-2 py-3 ${
                active ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              } rounded`}
              disabled={active}
              onClick={() => showPaymentPopup(index)}
            >
              Active Plan
            </ButtonWrapper>
          )}
          {props.slug === "full_service" && (
            <ButtonWrapper
              classNames={`mt-6 absolute bottom-6 mx-auto w-[60%] px-2 py-3 ${
                active ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              } rounded`}
              disabled={active}
              onClick={openChatHandler}
            >
              Chat now
            </ButtonWrapper>
          )}
        </div>
      </div>
    </div>
  );
}
