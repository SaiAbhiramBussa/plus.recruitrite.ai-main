import { Popover } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import Usermenu from "../Dashboard/UserMenu";
import LogoBlack from "../LogoBlack";
import AppContext from "@/src/context/Context";

export default function CandidateNavbar() {
  const [name, setName] = useState("candidate");
  const { color } = useContext(AppContext);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (user.first_name) {
      setName(user.first_name);
    }
  }, []);

  return (
    <div className="flex flex-col w-full justify-center fixed top-0 z-50">
      <div
        style={{ backgroundColor: color?.innerBg }}
        className="shadow py-4 px-3"
      >
        <div className="mx-auto px-2 sm:px-4 lg:px-8">
          <Popover className="flex justify-between">
            <div className="flex px-2 lg:px-0">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/candidates/dashboard">
                  <LogoBlack />
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <div className="flex items-center justify-end divide-x-2">
                <div className="flex items-center justify-end mr-4">
                  <svg className="w-6 h-6 mx-1" viewBox="0 0 16 18">
                    <path
                      id="notifications"
                      d="M4.013,16.774a1.212,1.212,0,0,1-.884-.379,1.236,1.236,0,0,1-.379-.905,1.212,1.212,0,0,1,.379-.884,1.212,1.212,0,0,1,.884-.379h.632V9.089A5.983,5.983,0,0,1,5.793,5.5,5.15,5.15,0,0,1,8.834,3.447V3.005A1.713,1.713,0,0,1,11.75,1.794a1.649,1.649,0,0,1,.494,1.211v.442A5.119,5.119,0,0,1,15.318,5.5a6.022,6.022,0,0,1,1.137,3.59v5.137h.632a1.236,1.236,0,0,1,.905.379,1.212,1.212,0,0,1,.379.884,1.294,1.294,0,0,1-1.284,1.284ZM10.561,19.3a1.84,1.84,0,0,1-1.336-.547,1.789,1.789,0,0,1-.558-1.326h3.768a1.825,1.825,0,0,1-.536,1.326A1.8,1.8,0,0,1,10.561,19.3Z"
                      transform="translate(-2.75 -1.3)"
                      fill="#474a56"
                    ></path>
                  </svg>
                  {/* <circle id="Elipse_420" data-name="Elipse 420" cx="3" cy="3" r="3" transform="translate(10 0.688)" fill="#9e5ef8"></circle> */}
                </div>
                <div className="flex items-center justify-end">
                  <div className=" text-base sm:ml-5 font-semibold">
                    Hello, {name}
                  </div>
                  <div className="flex items-center justify-end mx-1 sm:mx-4 gap-4">
                    <Usermenu role="job-seeker" />
                  </div>
                </div>
              </div>
            </div>
          </Popover>
        </div>
      </div>
    </div>
  );
}
