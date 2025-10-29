import React from "react";
import ScreeningCreditsCard from "./screeningCreditsCard";
import PricingSlider from "./PricingSlider";

export default function ScreeningCredits(props: any) {
  const { color } = props;
  return (
    <>
      <div className="py-4">
        <div className="container mx-auto px-4">
          {/* <div className="text-center">
            <p className="text-xl my-4">
              Activated <strong>FREE</strong> trial offers 100 one-time free
              credits.
            </p>
            <p className="xl:px-32">
              At <strong>StartDate</strong>
              {`, we appreciate that no two businesses are alike. That's why we're proud to present a diverse selection of screening credits packages designed to meet your individual needs. Regardless of whether you operate a small business or a large enterprise, we have the perfect solution waiting for you. Delve into range of screening credits packages below and choose the one that aligns seamlessly with your specific requirements.`}
            </p> 
          </div>*/}
          {/* <PricingSlider color={color}/> */}

          {/* <div className="md:flex md:justify-center md:mt-6 md:pt-2 mt-3">
            <ScreeningCreditsCard
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
            <ScreeningCreditsCard
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
            <ScreeningCreditsCard
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
            <ScreeningCreditsCard
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
          </div> */}
        </div>
      </div>
    </>
  );
}