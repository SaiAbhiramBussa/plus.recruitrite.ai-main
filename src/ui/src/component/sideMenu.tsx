import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faDatabase,
  faFileInvoice,
} from "@fortawesome/free-solid-svg-icons";
import { useContext, useEffect, useState } from "react";
import AppContext from "../context/Context";

export default function SideMenu(props: any) {
  const { active } = props;
  const { color } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>({});

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("user")!));
    setLoading(false);
  }, []);

  return (
    <>
      {!loading && (
        <div
          style={{
            backgroundColor: color?.innerBg,
            color: color?.secondaryAccent,
          }}
          className="sm:w-60 border w-20"
        >
          {/* <Link href="/profile/basicInfo" className="w-screen">
        <div className={`font-sm px-4 py-5 hover:bg-[#006251] ${active==='basic_info' ? 'bg-[#006251] text-white' : 'text-black'} hover:text-white cursor-pointer`}>
          <FontAwesomeIcon icon={faUser} className="mr-6 h-4" />
            Basic Information
        </div>
      </Link> */}
          <Link href="/profile/plans/ai_subscription" passHref>
            <div
              style={
                active === "plans"
                  ? {
                      backgroundColor: color?.primaryAccent,
                      color: color?.innerBg,
                    }
                  : {}
              }
              onMouseEnter={(e) => {
                if (active !== "plans") {
                  e.currentTarget.style.backgroundColor = color?.outerBg;
                  e.currentTarget.style.color = color?.primaryAccent;
                }
              }}
              onMouseLeave={(e) => {
                if (active !== "plans") {
                  e.currentTarget.style.backgroundColor = color?.innerBg;
                  e.currentTarget.style.color = color?.secondaryAccent;
                } else {
                  e.currentTarget.style.backgroundColor = color?.primaryAccent;
                  e.currentTarget.style.color = color?.innerBg;
                }
              }}
              className="font-sm px-4 py-5 cursor-pointer"
            >
              <FontAwesomeIcon icon={faFileInvoice} className="mr-6 h-5" />
              Plans
            </div>
          </Link>
          {user.role == "employer" &&
          <Link href="/profile/billing" passHref>
            <div
              style={
                active === "billing"
                  ? {
                      backgroundColor: color?.primaryAccent,
                      color: color?.innerBg,
                    }
                  : {}
              }
              onMouseEnter={(e) => {
                if (active !== "billing") {
                  e.currentTarget.style.backgroundColor = color?.outerBg;
                  e.currentTarget.style.color = color?.primaryAccent;
                }
              }}
              onMouseLeave={(e) => {
                if (active !== "billing") {
                  e.currentTarget.style.backgroundColor = color?.innerBg;
                  e.currentTarget.style.color = color?.secondaryAccent;
                } else {
                  e.currentTarget.style.backgroundColor = color?.primaryAccent;
                  e.currentTarget.style.color = color?.innerBg;
                }
              }}
              className="font-sm px-4 py-5 cursor-pointer"
            >
              <FontAwesomeIcon icon={faCreditCard} className="mr-6" />
              Billing
            </div>
          </Link>}
          <Link href="/profile/candidates" passHref>
            <div
              style={
                active === "candidateStats"
                  ? {
                      backgroundColor: color?.primaryAccent,
                      color: color?.innerBg,
                    }
                  : {}
              }
              onMouseEnter={(e) => {
                if (active !== "candidateStats") {
                  e.currentTarget.style.backgroundColor = color?.outerBg;
                  e.currentTarget.style.color = color?.primaryAccent;
                }
              }}
              onMouseLeave={(e) => {
                if (active !== "candidateStats") {
                  e.currentTarget.style.backgroundColor = color?.innerBg;
                  e.currentTarget.style.color = color?.secondaryAccent;
                } else {
                  e.currentTarget.style.backgroundColor = color?.primaryAccent;
                  e.currentTarget.style.color = color?.innerBg;
                }
              }}
              className="font-sm px-4 py-5 cursor-pointer"
            >
              <FontAwesomeIcon icon={faDatabase} className="mr-6" />
              Candidate Stats
            </div>
          </Link>
        </div>
      )}
    </>
  );
}
