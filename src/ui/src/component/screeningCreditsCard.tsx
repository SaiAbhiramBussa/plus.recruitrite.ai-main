import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";

export default function ScreeningCreditsCard(props: any) {
  const router = useRouter();

  const { heading, subHeading, price, features, paymentURL, page, color } =
    props;

  const showPaymentPopup = (index: any) => {
    router.push(`/payments/${paymentURL}`);
  };
  const isPaymentPage = router.pathname.includes("payments");

  return (
    <div
      style={{ color: color?.secondaryAccent }}
      className={`${
        page != "checkout" ? "md:w-1/4" : "md:w-[22vw] w-[55vw] shadow-2xl"
      }`}
    >
      <div className="border border-solid rounded md:rounded-r-none">
        <div className="p-4 md:py-6 border-b border-solid text-center">
          <h4 className="text-xl md:text-2xl">{heading}</h4>
          <p className="text-sm mb-4">{subHeading}</p>
          <div className="text-3xl md:text-4xl leading-none">
            <span className="text-sm align-top inline-block mt-2">$</span>
            {price}
          </div>
          {!isPaymentPage && (
            <button
              style={{
                borderColor: color?.primaryAccent,
                color: color?.primaryAccent,
                backgroundColor: color?.innerBg,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = color?.primaryAccent;
                e.currentTarget.style.color = color?.innerBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = color?.innerBg;
                e.currentTarget.style.color = color?.primaryAccent;
              }}
              className="border-2 border-solid rounded py-2 px-4 mt-6 mb-2 duration-300"
              onClick={showPaymentPopup}
            >
              Get Started
            </button>
          )}
        </div>
        <div className={`my-5 ml-5 px-4  h-[96px]`}>
          {features.map((feature: any, key: any) => (
            <div key={key}>
              {key !== 4 || props.slug === "flat_fee" ? (
                <div className="flex items-start mb-3">
                  <FontAwesomeIcon
                    style={{
                      backgroundColor: color?.innerBg,
                      color: color?.primaryAccent,
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
      </div>
    </div>
  );
}
