import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import PlanCard from "@/src/component/PlanCard";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/src/component/StripeCard";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useRouter } from "next/router";
import Breadcrumbs from "@/src/component/BreadCrumbs";
import { useContext, useState } from "react";
import ScreeningCreditsCard from "@/src/component/screeningCreditsCard";
import AppContext from "@/src/context/Context";

interface Options {
  mode?: any;
  currency?: any;
  amount?: any;
  paymentMethodTypes: any;
  paymentMethodCreation: any;
}

const options: Options = {
  mode: "payment",
  currency: "usd",
  amount: 123,
  paymentMethodTypes: ["card"],
  paymentMethodCreation: "manual",
};

export default function Payments() {
  const router = useRouter();
  const type = router.query.type;
  const isScreening = type?.includes("screening");
  const { color,stripePricing} = useContext(AppContext);
  const [successText, setSuccessText] = useState("");
  const [failedText, setFailedText] = useState("");

  const stripePromise: Promise<Stripe | null> = process.env
    .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : Promise.resolve(null);

  const showPaymentStatus = (status: any, message: any) => {
    if (status === false) setFailedText(message);
    else setSuccessText("Payment completed successfully!");
  };

  return (
    <div style={{ backgroundColor: color?.outerBg }} className="min-h-screen">
      <div className="h-16">
        <DashboardHeader />
      </div>
      <div
        style={{ backgroundColor: color?.innerBg }}
        className="justify-between mt-6 mx-6 px-2 pt-2"
      >
        <div className="flex md:mx-5 mx-2 md:mt-5 mt-2 mb-2">
          <Breadcrumbs
            title={"Cancel"}
            link={`/profile/plans/screening_credits`}
            backPage=""
          />
        </div>
        {/* <div className="h-full w-full bg-white flex items-center justify-evenly"> */}
        <div className="flex flex-wrap justify-evenly w-full md:mt-8"></div>
        <div className="flex flex-col md:flex-row py-2 items-center justify-evenly">
          <div>
            {type === "ai_silver" ? (
              <PlanCard
                page="checkout"
                showBoth={false}
                disclaimer={"* Includes prior plan benefits."}
                slug="ai_silver"
                name="AI-Silver"
                tag={"Best for 1 Job Requisition per month."}
                price={299}
                index={1}
                features={[
                  "30 candidate reveals/month",
                  "Export candidates into your hiring process",
                  "Chat GPT matching option",
                  `AI matching option (SD's proprietary technology)*`,
                  "No reveal rollovers",
                ]}
                color={color}
              />
            ) : (
              ""
            )}
            {type === "ai_gold" ? (
              <PlanCard
                page="checkout"
                showBoth={false}
                disclaimer={"* Includes prior plan benefits."}
                slug="ai_gold"
                name="AI-Gold"
                tag={"Best for Multiple Job Requisitions per month."}
                price={695}
                index={2}
                features={[
                  "100 candidate reveals/month",
                  "Processing of Internal Company Jobs",
                  "Multi-user management",
                  "Volume and Enterprise solutions available",
                  "Reveal rollovers (use unused credits the following months)",
                ]}
                color={color}
              />
            ) : (
              ""
            )}
            {type === "starter_screening" ? (
              <ScreeningCreditsCard
                page="checkout"
                heading="Starter Screening"
                subHeading="1000 candidate screenings"
                price="75"
                features={[
                  "Optimized analysis of matched authenticity",
                  "Export candidates into your hiring process",
                ]}
                paymentURL="starter_screening"
                color={color}
              />
            ) : (
              ""
            )}
            {type === "silver_screening" ? (
              <ScreeningCreditsCard
                page="checkout"
                heading="Silver Screening"
                subHeading="2000 candidate screenings"
                price="140"
                features={[
                  "AI matching option (SD's proprietary technology)",
                  "OpenAI & other alternative matching options",
                ]}
                paymentURL="silver_screening"
                color={color}
              />
            ) : (
              ""
            )}
            {type === "gold_screening" ? (
              <ScreeningCreditsCard
                page="checkout"
                heading="Gold Screening"
                subHeading="5000 candidate screenings"
                price="335"
                features={[
                  "Best for multiple Job Requisitions per month",
                  "Multi-user management",
                ]}
                paymentURL="gold_screening"
                color={color}
              />
            ) : (
              ""
            )}
            {type === "platinum_screening" ? (
              <ScreeningCreditsCard
                page="checkout"
                heading="Platinum Screening"
                subHeading="10000 candidate screenings"
                price="650"
                features={[
                  "Best for multiple Job Requisition per month (using multiple AI tools)",
                  "Volume and Enterprise solutions available",
                ]}
                paymentURL="platinum_screening"
                color={color}
              />
            ) : (
              ""
            )}
            {type === "custom_screening" ? (
              <ScreeningCreditsCard
                page="checkout"
                heading="Custom Screening"
                subHeading={`${stripePricing.total_credits} candidate screenings`}
                price={stripePricing.price}
                features={[
                  "Best for multiple Job Requisition per month (using multiple AI tools)",
                  "Volume and Enterprise solutions available",
                ]}
                paymentURL="platinum_screening"
                color={color}
              />
            ) : (
              ""
            )}
          </div>
          <div className="md:w-px md:h-[70vh] mt-10 md:mt-0 md:mx-4"></div>
          <div className="payment-form-container md:w-[70vh] w-[40vh] h-100">
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm
                planType={type}
                showPaymentStatus={showPaymentStatus}
                isScreening={isScreening}
                credits={stripePricing.total_credits}
                price={stripePricing.price}
              />
            </Elements>
          </div>
        </div>
      </div>
    </div>
    // </div>
  );
}
