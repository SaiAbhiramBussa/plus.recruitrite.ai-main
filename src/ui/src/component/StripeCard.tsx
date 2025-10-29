import {
  AddressElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useContext, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "./Loader";
import Link from "next/link";
import { useRouter } from "next/router";
import AppContext from "../context/Context";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

export default function CheckoutForm(props: any) {
  const router = useRouter();
  const stripe = useStripe();

  const { showPaymentStatus, isScreening, credits, price } = props;
  const elements = useElements();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formDisabled, setFormDisabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState<boolean>(false);
  const [subscriptionData, setSubscriptionData] = useState({
    invoice_id: "",
    payment_on: "",
    start_date: "",
    end_date: "",
    amount: "",
    invoice_pdf: "",
  });
  const { color, stripePricing } = useContext(AppContext);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!stripe || !elements) {
      return;
    }
    await elements.submit();

    try {
      const address: any = await elements.getElement("address")?.getValue();
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        elements,
      });
      if (error) {
        return;
      }
      setFormDisabled(true);
      axios
        .post(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/subscriptions/`,
          isScreening
            ? {
                payment_method_id: paymentMethod?.id,
                one_time_plan_type: props.planType,
                customer: address.value,
                total_credits: credits,
                price: price,
                is_custom_screening: stripePricing.is_custom_screening,
                quantity: stripePricing.quantity
              }
            : {
                payment_method_id: paymentMethod?.id,
                subscription_plan_type: props.planType,
                customer: address.value,
              },
          {
            withCredentials: true,
          }
        )
        .then((response) => {
          setShowSuccessModal(true);
          showPaymentStatus(true);
          setSubscriptionData(response.data.invoice_details);
          var user = JSON.parse(localStorage.getItem("user")!) || {};
          user.reveals_left = response.data.invoice_details.reveals_left;
          localStorage.setItem("user", JSON.stringify(user));
        })
        .catch((error) => {
          setShowError(true);
          setErrorMessage(error.response.data?.Error);
          showPaymentStatus(false, error.response.data?.Error);
        })
        .finally(() => {
          setFormDisabled(false);
        });
    } catch (error) {
      setFormDisabled(false);
    }
  };

  return (
    <div className="relative">
      <div
        style={formDisabled ? { backgroundColor: color?.outerBg } : {}}
        className={`${
          formDisabled
            ? "opacity-40 h-full w-full z-10 cursor-not-allowed z-100 p-4"
            : "z-0"
        }`}
      >
        {formDisabled ? (
          <div className="top-0 left-0 right-0 bottom-0 w-full h-full absolute z-30 flex justify-center items-center">
            <Loader />
          </div>
        ) : null}
        {showSuccessModal && (
          <div className="text-center">
            <FontAwesomeIcon
              style={{ backgroundColor: color?.innerBg }}
              icon={faCircleCheck}
              className="h-6 p-0 shadow-xl text-green-600 mb-5"
            />
            <div
              style={{ color: color?.primaryAccent }}
              className="tracking-wider mb-5"
            >
              Payment Successful!
            </div>
            <hr />
            <div className="font-semibold mt-5 mb-5">
              Payment Details
              <div className="flex justify-between mt-6 text-sm">
                Invoice ID
                <div className="font-thin text-sm">
                  {subscriptionData?.invoice_id}
                </div>
              </div>
              <div className="flex justify-between text-sm mt-3">
                Payment time
                <div className="font-thin text-sm">
                  {new Date(subscriptionData?.payment_on).toLocaleTimeString(
                    "en-US"
                  )}
                </div>
              </div>
              {!isScreening && (
                <>
                  <div className="flex justify-between text-sm mt-3">
                    Start date
                    <div className="font-thin text-sm">
                      {new Date(
                        subscriptionData?.start_date
                      ).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mt-3">
                    End date
                    <div className="font-thin text-sm">
                      {new Date(
                        subscriptionData?.end_date
                      ).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mt-3">
                    Renewal date
                    <div className="font-thin text-sm">
                      {new Date(
                        subscriptionData?.end_date
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm mt-3">
                Total Amount
                <div className="font-thin">${subscriptionData?.amount} USD</div>
              </div>
              <div
                style={{ color: color?.primaryAccent }}
                className="flex justify-end text-sm mt-3"
              >
                <Link href={subscriptionData?.invoice_pdf}>
                  Download invoice
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <Link
                href="/profile/billing"
                style={{
                  backgroundColor: color?.primaryAccent,
                  color: color?.btnAccent,
                }}
                className="flex items-center justify-center rounded-sm border border-transparent w-1/4 py-3 text-sm font-light shadow-sm hover:opacity-75 mt-2 focus:outline-none"
              >
                Go to billing
              </Link>
            </div>
          </div>
        )}
        {showError && (
          <div className="flex flex-col items-center justfy-center p-4">
            <div className="flex items-center ml-2 justify-center text-red-500 px-4 py-3 text-sm font-medium  shadow-sm focus:outline-none">
              <FontAwesomeIcon icon={faCircleXmark} />
              <div className="mx-1 hidden lg:block">Payment Failed</div>
            </div>
            <div className="mt-12 ">{errorMessage}</div>
            <div className="flex items-center justify-center mt-12">
              <button
                onClick={() => {
                  setShowError(false);
                  router.push("/profile/plans/ai_subscription");
                }}
                style={{ backgroundColor: color?.outerBg }}
                className="h-10 w-10 mr-3 bg-opacity-10 flex justify-center items-center"
              >
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor"
                  className="w-6 h-6 stroke-[#929AAB]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
                  />
                </svg>
              </button>
              <div className="text-sm font-light mr-3">Go back</div>
            </div>
          </div>
        )}
        {!showSuccessModal && !showError && (
          <form
            className={`${!formDisabled ? "z-0" : "z-10"}`}
            onSubmit={handleSubmit}
          >
            <div>
              <PaymentElement />
            </div>

            <hr className="my-8" />
            <AddressElement
              options={{ mode: "billing", display: { name: "organization" } }}
            />
            <ButtonWrapper
              type="submit"
              disabled={!stripe || formDisabled}
              classNames="flex items-center justify-center rounded-sm border border-transparent w-full py-4 px-2 text-md font-medium shadow-sm mt-10 focus:outline-none"
            >
              {formDisabled ? "Payment processing ..." : "Pay"}
            </ButtonWrapper>
          </form>
        )}
      </div>
    </div>
  );
}
