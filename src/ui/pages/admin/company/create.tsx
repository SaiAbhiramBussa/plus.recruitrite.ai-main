import { useContext, useEffect, useState } from "react";
import axios from "axios";
import _ from "lodash";
import { useRouter } from "next/router";
import AuthGuard from "@/src/component/AuthGuard";
import Company from "@/src/component/create-company/company";
import Location from "@/src/component/create-company/location";
import User from "@/src/component/create-company/user";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faEdit } from "@fortawesome/free-solid-svg-icons";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import { colorToRGBA } from "@/src/utils/misc";
import AppContext from "@/src/context/Context";

const AdminCreateCompany = (props: any) => {
  const router = useRouter();

  const [focussedTab, setFocussedTab] = useState("company");
  const [isCompanyCreated, setIsCompanyCreated] = useState<any>();
  const [isLocationCreated, setIsLocationCreated] = useState<any>();
  const [isUserCreated, setIsUserCreated] = useState<any>();
  const [error, setError] = useState<any>();
  const [lastVal, setLastVal] = useState<any>();
  const [companyForm, setCompanyForm] = useState<any>();
  const [locationForm, setLocationForm] = useState<any>();
  const [userForm, setuserForm] = useState<any>();
  const [submit, setSubmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState<boolean>(false);
  const { color } = useContext(AppContext);

  useEffect(() => {
    submit && submission();
  }, [submit]);

  const submission = async () => {
    try {
      let companyRes: any = isCompanyCreated ? isCompanyCreated : "";
      let locationRes: any = isLocationCreated ? isLocationCreated : "";
      let userRes: any = isUserCreated ? isUserCreated : "";
      setLoading(true);
      if (companyForm && _.isUndefined(isCompanyCreated)) {
        const companyFormObj = {
          name: companyForm.name,
          logo: companyForm.logo,
          description: companyForm.description,
          industry: companyForm.industry.value,
          is_full_service: companyForm.isFullServiceEnabled
            ? companyForm.isFullServiceEnabled
            : false,
          website_url: companyForm.website_url,
        };
        setCompanyForm(_.omit(companyForm, "industry"));
        companyRes = await axios.post(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/`,
          companyFormObj,
          {
            withCredentials: true,
          }
        );
      }
      if (companyRes?.status === 200) {
        try {
          setLastVal("company");
          setIsCompanyCreated(companyRes);
          if (locationForm && _.isUndefined(isLocationCreated)) {
            locationForm.country = locationForm.country.name;
            locationForm.state = locationForm.state.name;
            locationRes = await axios.post(
              `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyRes?.data?.id}/locations/`,
              locationForm,
              { withCredentials: true }
            );
          }
          if (locationRes?.status === 200) {
            try {
              setLastVal("location");
              setIsLocationCreated(locationRes);
              if (userForm && _.isUndefined(isUserCreated)) {
                const userFormObj = {
                  location_id: locationRes.data?.id,
                  first_name: userForm.first_name,
                  last_name: userForm.last_name,
                  email: userForm.email,
                  phone: userForm.code + userForm.phoneNumber,
                };
                userForm.location_id = locationRes.data.id;
                userRes = await axios.post(
                  `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${locationRes?.data?.id}/users/`,
                  userFormObj,
                  { withCredentials: true }
                );
              }
              if (userRes?.status === 200) {
                setLastVal("user");
                setIsUserCreated(userRes);
                router.push(`/admin/companies/${companyRes.data?.id}/users`);
              }
            } catch (err: any) {
              setLoading(false);
              setFocussedTab("user");
              setError(err?.response?.data);
            }
          }
        } catch (err: any) {
          setLoading(false);
          setFocussedTab("location");
          setError(err?.response?.data);
        }
      }
    } catch (err: any) {
      setFocussedTab("company");
      setError(err?.response?.data);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="h-16">
        <DashboardHeader companyName="Admin" />
      </div>
      <div
        style={{
          backgroundColor: color?.outerBg,
          color: color?.secondaryAccent,
        }}
        className="flex flex-col w-full grow min-h-full px-6"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="flex flex-col w-full h-full min-h-[89vh] relative mt-6 "
        >
          <div className="px-4 py-4 flex justify-between ">
            <div className="w-full text-lg font-bold px-4 py-2 cursor-pointer">
              Create company
            </div>
          </div>
          <div className="overflow-auto">
            <div className="flex justify-center">
              <div className="flex flex-col w-3/6 mt-14">
                <ol className="flex items-center text-sm font-medium text-center sm:text-base">
                  <li
                    style={
                      focussedTab === "company"
                        ? { color: color?.primaryAccent }
                        : {
                            color: colorToRGBA(
                              color?.secondaryAccent,
                              color?.opacity
                            ),
                          }
                    }
                    className={`flex md:w-full items-center sm:after:content-[''] after:w-full after:h-1 after:border-b ${
                      isCompanyCreated
                        ? "after:border-green-500"
                        : "dark:after:border-gray-700"
                    } after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10`}
                  >
                    <span
                      className={`flex items-center ${
                        isCompanyCreated && "text-green-500"
                      }`}
                    >
                      {focussedTab == "company" ? (
                        <FontAwesomeIcon
                          icon={faEdit}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2.5"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faCircleCheck}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2.5`}
                        />
                      )}
                      Company{" "}
                      <span className="hidden sm:inline-flex sm:ml-2">
                        Info
                      </span>
                    </span>
                  </li>
                  <li
                    style={
                      focussedTab === "location"
                        ? { color: color?.primaryAccent }
                        : {
                            color: colorToRGBA(
                              color?.secondaryAccent,
                              color?.opacity
                            ),
                          }
                    }
                    className={`flex md:w-full items-center after:content-[''] after:w-full after:h-1 after:border-b ${
                      isLocationCreated
                        ? "after:border-green-500"
                        : "dark:after:border-gray-700"
                    } after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10`}
                  >
                    <span
                      className={`flex items-center ${
                        isLocationCreated && "text-green-500"
                      }`}
                    >
                      {focussedTab == "location" ? (
                        <FontAwesomeIcon
                          icon={faEdit}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2.5"
                        />
                      ) : focussedTab == "user" ? (
                        <FontAwesomeIcon
                          icon={faCircleCheck}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2.5"
                        />
                      ) : (
                        <span className="mr-2">2</span>
                      )}
                      Location{" "}
                      <span className="hidden sm:inline-flex sm:ml-2">
                        Info
                      </span>
                    </span>
                  </li>
                  <li
                    style={
                      focussedTab === "user"
                        ? { color: color?.primaryAccent }
                        : {
                            color: colorToRGBA(
                              color?.secondaryAccent,
                              color?.opacity
                            ),
                          }
                    }
                    className="flex items-center"
                  >
                    {focussedTab == "user" ? (
                      <FontAwesomeIcon
                        icon={faEdit}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2.5"
                      />
                    ) : (
                      <span className="mr-2">3</span>
                    )}
                    User{" "}
                    <span className="hidden sm:inline-flex sm:ml-2">Info</span>
                  </li>
                </ol>
              </div>
            </div>
            {focussedTab == "company" ? (
              <Company
                responseErrors={error}
                setResponseErrors={setError}
                focussedTab={focussedTab}
                setFocussedTab={setFocussedTab}
                companyForm={companyForm}
                setCompanyForm={setCompanyForm}
                color={color}
              />
            ) : focussedTab == "location" ? (
              <Location
                lastVal={lastVal}
                responseErrors={error}
                setResponseErrors={setError}
                focussedTab={focussedTab}
                setFocussedTab={setFocussedTab}
                locationForm={locationForm}
                setLocationForm={setLocationForm}
                color={color}
              />
            ) : focussedTab == "user" ? (
              <User
                lastVal={lastVal}
                responseErrors={error}
                setResponseErrors={setError}
                focussedTab={focussedTab}
                setFocussedTab={setFocussedTab}
                locationForm={locationForm}
                userForm={userForm}
                setUserForm={setuserForm}
                submit={submit}
                setSubmit={setSubmit}
                showError={showError}
                setShowError={setShowError}
                color={color}
              />
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthGuard(AdminCreateCompany);
