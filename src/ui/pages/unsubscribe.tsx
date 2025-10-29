import AppContext from "@/src/context/Context";
import CustomizationsData from "@/src/utils/CustomizationData";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SignInPage() {
  const router = useRouter();
  const { color } = useContext(AppContext);
  const customizationsData: any = CustomizationsData[4].data;

  useEffect(() => {
    unsubcsribe(router.query.email);
  }, [router.query.email]);

  const unsubcsribe = async (email: any) => {
    try {
      await axios
        .get(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/adwerks/unsubscribe/${email}`,
          {
            withCredentials: true,
          }
        )
        .then((response) => [
          toast.success("You are Unsubscribed!", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          }),
        ]);
    } catch (err: any) {
      toast.error(`error ${err?.message}`, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 10000,
        hideProgressBar: true,
      });
    }
  };

  const companyid = router.query.companyid;

  return (
    <>
      <div className="h-full flex flex-col justify-between">
        <div className="flex w-full px-4 py-6 border shadow">
          <Image
            src={customizationsData.logo}
            width={customizationsData.width}
            height={customizationsData.height}
            alt="logo"
          />
        </div>
        <div className="flex flex-col mt-10 w-full h-full justify-around items-center">
          <div>
            <Image
              src="/Images/unsubscribe.png"
              width={10000}
              height={10000}
              className="w-96 h-96 mr-2"
              alt=""
            />
          </div>
          <div className="px-4 py-4">
            <div
              style={{ color: color?.primaryAccent }}
              className="font-bold text-xl justify-center md:text-4xl"
            >
              You are unsubscribed from our list.
            </div>
            <div className="font-light w-full mx-auto mt-1 text-sm flex justify-center mb-10">
              Thank you for using our services.
            </div>
          </div>
        </div>
        {/* footer */}
        <div
          style={{ color: color?.secondaryAccent }}
          className="h-full px-4 md:px-32 py-4"
        >
          <div className="">
            <Image
              src={customizationsData.logo}
              width={customizationsData.width}
              height={customizationsData.height}
              alt="logo"
            />
            <div
              style={{ color: color?.innerBg }}
              className="md:flex flex-wrap"
            >
              <div className="text-xl w-full md:text-5xl XS: font-bold p-4 md:w-2/5">
                Learn more about how StartDate can help your business.
                <div className="text-sm p-4 font-thin">
                  We meet our clients, where they are at. We do as little or as
                  much of the heavy lifting as required.
                </div>
              </div>
              <div className="md:w-3/5">
                <hr
                  style={{ backgroundColor: color?.innerBg }}
                  className="ml-4 my-6"
                />
                <div className="flex flex-wrap flex-col sm:flex-row p-4 justify-between w-3/5 md:w-full md:m-5">
                  <div className="mb-8 md:mb-0 text-sm md:text-md md:m-4">
                    @StartDate
                  </div>
                  <div className="flex flex-wrap flex-col sm:flex-row p-4 justify-between w-3/5 md:w-full md:m-5">
                    <div className="mb-8 md:mb-0">
                      <div className="text-sm mb-4">About</div>
                      <div className="font-thin text-sm">
                        <div>Terms and Conditions</div>
                        <Link
                          href="https://docs.google.com/document/d/1cEa3vyAqeEVC7AOcUhQVfS849H2LSv4JWHIYRXSpuf4/edit"
                          style={{ color: color?.primaryAccent }}
                          className="ml-1"
                        >
                          Privacy policy
                        </Link>
                      </div>
                    </div>
                    <div className="mb-8 md:mb-0">
                      <div className="text-sm mb-4">Support</div>
                      <div className="font-thin text-sm">
                        <div>Contact us</div>
                        <div>Online Chat</div>
                      </div>
                    </div>
                    <div className="mb-8 md:mb-0">
                      <div className="text-sm mb-4">FAQ</div>
                      <div className="font-thin text-sm">
                        <div>Account</div>
                        <div>Manage</div>
                        <div>Orders</div>
                        <div>Payments</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs flex font-thin justify-end w-full">
              All rights reserved to @Startdate
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
