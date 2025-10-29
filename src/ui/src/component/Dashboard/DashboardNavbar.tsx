import { faEye, faMoneyBills } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover } from "@headlessui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Key, useContext, useEffect, useState } from "react";
import Usermenu from "./UserMenu";
import StartDatePopOverComponent from "../StartDatePopOverComponent";
import { getCreditsLeft } from "@/src/services/common.service";
import CustomizationsData from "@/src/utils/CustomizationData";
import AppContext from "@/src/context/Context";
import Image from "next/image";

declare global {
  interface Window {
    gtranslateSettings?: any;
  }
}

export default function DashboardHeader(props: any) {
  const { companyName, section } = props;
  const { color, trainedCandidatesModal, setTrainedCandidatesModal, screeningCredits, setScreeningCredits } =
    useContext(AppContext);
  const [role, setRole] = useState(null);
  const [subscriptionType, setSubscriptionType] = useState<any>();
  const [candidateScope, setCandidateScope] = useState<string>("");
  const customizationsData: any = CustomizationsData[4].data;
  const [showVideoModal, setShowVideoModal] = useState(false);
  //const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  const router = useRouter();


  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user) {
      router.push("/dashboard");
    } else {
      setRole(user.role);
      setSubscriptionType(user.subscription_type);
      setCandidateScope(user?.company_details?.candidate_scope);
    }
  });
 
  useEffect(() => {
    //if (typeof window !== 'undefined') {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.role === "employer" || user?.role === "hiring_manager") {
      getCreditsLeft().then((data) => {
        if(data){
          data.reveals_left = data?.screening_records_left;
          localStorage.setItem('user', JSON.stringify({...user, reveals_left: data.reveals_left}));
          setScreeningCredits(
            data?.screening_records_left ? data?.screening_records_left : 0
          );
        }
      });
    }
  }, [router.pathname]);
 
  const HeaderIconText = (props: any) => {
    return (
      <div className="justify-between items-center flex font-light m-0 p-0 h-5">
        <div className="mr-3">
          <StartDatePopOverComponent
            ChildElement={<FontAwesomeIcon icon={props.icon} className="h-3" />}
            popOverText={props.text}
          />
        </div>
        <div className="font-semibold text-sm pl-2">{props.number}</div>
      </div>
    );
  };

  
  function createCrossDomainCookie(token: string) {
    const userData = localStorage.getItem('user');
    
    let parsedUserData = '';
    try {
      if (userData) {
        parsedUserData = JSON.stringify(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error parsing user data', error);
    }

    const date = new Date();
    date.setTime(date.getTime() + (24 * 60 * 60 * 1000));  
    document.cookie = `userdata=${parsedUserData}; domain=.recruitrite.ai; expires=${date.toUTCString()}; path=/; samesite=Lax;`;
  }
  
  function navigateBetweenDomains(token: string) {
    createCrossDomainCookie(token);    
    router.push(`${process.env.NEXT_PUBLIC_LITE_URL}/home`);
  }
  
  const handleNavigation = () => {
    const value = `; ${document.cookie}`;
    const parts: string[] = value.split(`; startdatetoken=`);
    
    let token: string = "";
    if (parts.length === 2) {
      const lastPart = parts.pop();
      if (lastPart) {
        token = lastPart.split(';').shift() || "";
      } else {
        token = "";
      }
    }
  
    navigateBetweenDomains(token);
  }
  
  const handleSubscriptionNavigation = ()=>{
    if(role === 'employer'){
      router.push("/profile/plans/screening_credits")
    }
    else{
      router.push("/profile/plans/ai_subscription")
    }
  }
  return (
    <div className="flex flex-col w-full fixed top-0 z-40">
      <div style={{ backgroundColor: color?.innerBg }} className="shadow">
        <div className="mx-auto flex justify-between px-2 sm:px-4 lg:px-8">
          <Popover className="flex h-16 justify-between w-screen">
            <div className="flex items-center px-2 lg:px-0 space-x-6">
            {/* <div className="flex px-2 lg:px-0"> */}
              <div>
              {/* <div className="flex items-center"> */}
                <Link
                  href={
                    role === "admin"
                      ? "/admin/jobs"
                      : role === "job_seeker"
                      ? "candidate/dashboard"
                      : "/dashboard"
                  }
                  passHref
                >
                  <Image
                    src={customizationsData.logo}
                    width={customizationsData.width}
                    height={customizationsData.height}
                    alt="logo"
                  />
                </Link>
              </div>
             {
              (role === 'employer' || role === 'hiring_manager') &&
                    <div style={{
                      backgroundColor: "rgb(0,98,81)",
                    }}
                    className="px-4 py-2 rounded ml-4"
                  >
              {/*<Link href={`${process.env.NEXT_PUBLIC_LITE_URL}/home`} target="_self"> <b style={{color: "white"}}>Lite</b> </Link>*/}
               <button onClick={handleNavigation}>
                      <b style={{color: "white"}}>Lite</b>
                </button>
          </div>
             }
            </div>
            {(role === "employer" || role === 'hiring_manager') && (
              <div className="hidden md:flex items-center justify-center">
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="text-md font-semibold hover:underline"
                  style={{color: color?.primaryAccent}}
                >
                  Onboarding Video
                </button>
              </div>
            )}
            {section != "shared" && (
              <div className="flex items-center justify-end">
                <div className="flex items-center justify-end">
                  {/* {role === "employer" && */}
                  {
                    // subscriptionType !== "full_service" && (
                    (
                    (
                      <>
                        <div className="gtranslate_wrapper px-4 py-2 rounded mr-4"></div> {/* Google Translate Here */}
                      { (role === "employer" || role === 'hiring_manager') &&
                          <>
                          <div style={{
                            backgroundColor: color?.primaryAccent,
                            color: color?.btnAccent,
                          }}
                          className="px-4 py-2 rounded mr-4"
                        >
                          <button onClick={handleSubscriptionNavigation}>Hiring Help</button>
                        </div>
                        <div
                          style={{
                            backgroundColor: color?.primaryAccent,
                            color: color?.btnAccent,
                          }}
                          className="px-4 py-2 justify-between rounded items-center font-light mr-4"
                        >
                          <HeaderIconText
                            number={screeningCredits}
                            text={"Credits left"}
                            icon={faMoneyBills}
                          />
                        </div>  
                        </>
                      }  
                      </>
                    )
                  )}

                  {role === "admin" && (
                    <>
                      {customizationsData.adminCards.map(
                        (card: any, index: Key) => (
                          <Link
                            href={card.linkTo}
                          key={index}
                            style={
                              section === card.title.toLowerCase()
                                ? {
                                    color: color?.primaryAccent,
                                  }
                                : {
                                    color: color?.secondaryAccent,
                                  }
                            }
                            className="mr-5 cursor-pointer pl-5 text-base hidden md:block font-semibold"
                            passHref
                          >
                            <FontAwesomeIcon
                              icon={card.icon}
                              className="h-4 mr-2 cursor-pointer"
                            />
                            {card.title}
                          </Link>
                        )
                      )}
                     
                    </>
                  )}
                  <div className="flex items-center justify-end h-12">
                    <div className="flex items-center justify-end ml-2">
                      {(role !== "admin" || role !=="employer") && (
                        <div className="mr-2"> {companyName} </div>
                      )}
                      <Usermenu
                        isAdmin={role != "admin" ? false : true}
                        role={role}
                        color={color}
                        customizationsData={customizationsData}
                        trainedCandidatesModal={trainedCandidatesModal}
                        setTrainedCandidatesModal={setTrainedCandidatesModal}
                      />
                    </div>
                  </div>
                  {showVideoModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                      <div className="bg-white p-0 rounded-lg w-full max-w-2xl relative">
                        <button
                          className="absolute top-4 right-4 text-black-600 text-lg"
                          onClick={() => setShowVideoModal(false)}
                        >
                          ✕
                        </button>
                        <div className="aspect-w-16 aspect-h-9 w-full">
                          <iframe
                            className="w-full h-96 rounded"
                            src="https://share.synthesia.io/embeds/videos/d1d9b10f-ef69-4286-8016-585be2cb11cd"
                            title="Onboarding Video"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Popover>
        </div>
      </div>
    </div>
  );
}