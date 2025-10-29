import AuthGuard from "@/src/component/AuthGuard";
import Breadcrumbs from "@/src/component/BreadCrumbs";
import CrispChat from "@/src/component/CrispChat";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import FullServiceSubPage from "@/src/component/FullServiceSubPage";
import SideMenu from "@/src/component/sideMenu";
import axios from "axios";
import {useRouter} from "next/router";
import {useContext, useEffect, useState} from "react";
import SubscriptionAI from "../../subscriptions";
import ScreeningCredits from "@/src/component/screeningCredits";
import AppContext from "@/src/context/Context";
import {colorToRGBA} from "@/src/utils/misc";
import AISubscription from "@/src/component/AISubscription";

const Plans = () => {
    const router = useRouter();
    let user: any = JSON.parse(localStorage.getItem("user")!);
    let companyid: any = user.company_id ? user.company_id : null;
    const {plan} = router.query;
    const [showFirst, setShowFirst] = useState(plan?.includes("screening_credits"));
    const [showSecond, setShowSecond] = useState(
        plan?.includes("ai_subscription")
    );
    const [showThird, setShowThird] = useState(plan?.includes("full_service"));
    const [loading, setLoading] = useState<boolean>(false);
    const [data, setData] = useState();

    const [activeSubscription, setActiveSubscription] = useState();
    const [openChat, setOpenChat] = useState<boolean>(false);
    const {color} = useContext(AppContext);

    /*useEffect(() => {
        getPurchasedPlan();
        setShowFirst(true);
        setShowSecond(false);
        setShowThird(false);

    }, []);(commented by me for fs redirection issue fix from job)*/

    const getPurchasedPlan = async () => {
        try {
            setLoading(true);
            let res = await axios.get(
                `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/subscriptions/`,
                {
                    withCredentials: true,
                }
            );
            let data = res.data;
            setData(res.data);
            if (res.data.length > 0) {
                setActiveSubscription(
                    res.data.find(
                        (subscription: any) => subscription.plan_type === "subscription"
                    ).subscription
                );
            }
            return data;
        } catch (err) {
        } finally {
            setLoading(false);
        }
    };

    const openFirstSection = () => {
        setShowThird(false);
        setShowSecond(false);
        setShowFirst(true);
        router.push("/profile/plans/screening_credits");
    };

     const openSecondSection = () => {
      setShowThird(false);
      setShowFirst(false);
      setShowSecond(true);
      router.push("/profile/plans/ai_subscription");
     };

    const openThirdSection = () => {
        setShowSecond(false);
        setShowFirst(false);
        setShowThird(true);
        router.push("/profile/plans/full_service");
    };

    return (
      <div
        style={{
          backgroundColor: color?.outerBg,
          color: color?.secondaryAccent,
        }}
        className="min-h-screen flex flex-col"
      >
        <div className="h-16">
          <DashboardHeader />
        </div>
        <div className="flex flex-grow">
          <SideMenu active="plans" />
          <main
            style={{ backgroundColor: color?.innerBg }}
            className="flex-1 justify-between my-6 sm:mx-6 mx-2"
          >
            <div className="lg:px-2 pt-2 w-2/3 flex justify-between">
              <div className="w-[48vw]">
                <Breadcrumbs
                  title="Job Postings"
                  backPage={""}
                  link={"/dashboard"}
                />
              </div>
              <div
  style={{
    borderColor: colorToRGBA(color?.secondaryAccent, color?.opacity),
  }}
  className="text-sm font-medium text-center flex justify-center items-center w-full"
>
  {/* Tab Buttons */}
  <div className="flex w-full justify-center gap-4">
    {user.role === 'employer' && <button
      style={
        showFirst
          ? {
              color: color?.primaryAccent,
              borderColor: color?.primaryAccent,
            }
          : {}
      }
      onMouseEnter={(e) => {
        if (!showFirst) {
          e.currentTarget.style.color = color?.primaryAccent;
          e.currentTarget.style.borderColor = color?.primaryAccent;
        }
      }}
      onMouseLeave={(e) => {
        if (!showFirst) {
          e.currentTarget.style.color = color?.secondaryAccent;
          e.currentTarget.style.border = "none";
        }
      }}
      className={`${
        showFirst
          ? "inline-block p-4 border-b-2 rounded-t-lg active"
          : "inline-block p-4 rounded-t-lg"
      }`}
      onClick={openFirstSection}
    >
      Credits
    </button>}
    <button
      style={
        showSecond
          ? {
              color: color?.primaryAccent,
              borderColor: color?.primaryAccent,
            }
          : {}
      }
      onMouseEnter={(e) => {
        if (!showSecond) {
          e.currentTarget.style.color = color?.primaryAccent;
          e.currentTarget.style.borderColor = color?.primaryAccent;
        }
      }}
      onMouseLeave={(e) => {
        if (!showSecond) {
          e.currentTarget.style.color = color?.secondaryAccent;
          e.currentTarget.style.border = "none";
        }
      }}
      className={`${
        showSecond
          ? "inline-block p-4 border-b-2 rounded-t-lg active"
          : "inline-block p-4 rounded-t-lg"
      }`}
      onClick={openSecondSection}
    >
      Subscription AI
    </button>
    <button
      style={
        showThird
          ? {
              color: color?.primaryAccent,
              borderColor: color?.primaryAccent,
            }
          : {}
      }
      onMouseEnter={(e) => {
        if (!showThird) {
          e.currentTarget.style.color = color?.primaryAccent;
          e.currentTarget.style.borderColor = color?.primaryAccent;
        }
      }}
      onMouseLeave={(e) => {
        if (!showThird) {
          e.currentTarget.style.color = color?.secondaryAccent;
          e.currentTarget.style.border = "none";
        }
      }}
      className={`${
        showThird
          ? "inline-block p-4 border-b-2 rounded-t-lg active"
          : "inline-block p-4 rounded-t-lg"
      }`}
      onClick={openThirdSection}
    >
      Full Service
    </button>
  </div>
</div>

            </div>

            <div className="">
              <div className="">
                {showFirst && (
                  <SubscriptionAI activePlan={activeSubscription} />
                )}
                {showSecond && <AISubscription/>}
                {showThird && <FullServiceSubPage />}
              </div>
            </div>
            {openChat && <CrispChat />}
          </main>
        </div>
      </div>
    );
};

export default AuthGuard(Plans);