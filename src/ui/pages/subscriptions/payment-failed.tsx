import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import AppContext from "@/src/context/Context";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useContext } from "react";

export default function PaymentSuccess() {
  const { color } = useContext(AppContext);

  return (
    <div className="h-screen">
      <DashboardHeader />
      <div className="flex justify-center items-center h-full">
        <div>
          <div>
            <FontAwesomeIcon
              style={{
                backgroundColor: color?.innerBg,
                color: color?.secondaryAccent,
              }}
              icon={faCircleCheck}
              className="h-6 p-0"
            />
          </div>
          <div
            style={{ color: color?.primaryAccent }}
            className="text-4xl font-bold mb-10 flex justify-center"
          >
            Payment successful
          </div>
          <div className="flex justify-center">
            Thank you for choosing StartDate
          </div>
          <div className="flex items-center justify-center mt-6">
            <Link
              href="/profile/plans/ai_subscription?plan=silver"
              passHref
              style={{ backgroundColor: color?.outerBg }}
              className="h-10 w-10 mr-3 bg-opacity-10 flex justify-center items-center"
            >
              <svg
                fill="none"
                style={{ stroke: color?.outerBg }}
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
                />
              </svg>
            </Link>
            <div className="text-sm font-light mr-3">Explore other plans</div>
          </div>
        </div>
      </div>
    </div>
  );
}
