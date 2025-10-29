/* eslint-disable no-throw-literal */
import { ArrowSmallRightIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/router";
import React, { Fragment, useEffect, useState } from "react";
import Alert from "../Alerts";
import Select from "../Select";
import jobLocation from "../../../locations.json";
import TextInput from "../TextInput";
import axios from "axios";
import Link from "next/link";
import { Combobox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";
import _ from "lodash";
import dynamic from "next/dynamic";
import { colorToRGBA } from "@/src/utils/misc";
const ButtonWrapper = dynamic(() => import("../ButtonWrapper"), { ssr: false });

type Props = {
  email?: string;
  role?: string;
  setSignUpWith(value: string): void;
  customizationsData: any;
  color: any;
};

let states = [
  { value: "Alabama", key: "AL" },
  { value: "Alaska", key: "AK" },
  { value: "Arizona", key: "AZ" },
  { value: "Arkansas", key: "AR" },
  { value: "California", key: "CA" },
  { value: "Colorado", key: "CO" },
  { value: "Connecticut", key: "CT" },
  { value: "Delaware", key: "DE" },
  { value: "Florida", key: "FL" },
  { value: "Georgia", key: "GA" },
  { value: "Hawaii", key: "HI" },
  { value: "Idaho", key: "ID" },
  { value: "Illinois", key: "IL" },
  { value: "Indiana", key: "IN" },
  { value: "Iowa", key: "IA" },
  { value: "Kansas", key: "KS" },
  { value: "Kentucky", key: "KY" },
  { value: "Louisiana", key: "LA" },
  { value: "Maine", key: "ME" },
  { value: "Maryland", key: "MD" },
  { value: "Massachusetts", key: "MA" },
  { value: "Michigan", key: "MI" },
  { value: "Minnesota", key: "MN" },
  { value: "Mississippi", key: "MS" },
  { value: "Missouri", key: "MO" },
  { value: "Montana", key: "MT" },
  { value: "Nebraska", key: "NE" },
  { value: "Nevada", key: "NV" },
  { value: "New Hampshire", key: "NH" },
  { value: "New Jersey", key: "NJ" },
  { value: "New Mexico", key: "NM" },
  { value: "New York", key: "NY" },
  { value: "North Carolina", key: "NC" },
  { value: "North Dakota", key: "ND" },
  { value: "Ohio", key: "OH" },
  { value: "Oklahoma", key: "OK" },
  { value: "Oregon", key: "OR" },
  { value: "Pennsylvania", key: "PA" },
  { value: "Rhode Island", key: "RI" },
  { value: "South Carolina", key: "SC" },
  { value: "South Dakota", key: "SD" },
  { value: "Tennessee", key: "TN" },
  { value: "Texas", key: "TX" },
  { value: "Utah", key: "UT" },
  { value: "Vermont", key: "VT" },
  { value: "Virginia", key: "VA" },
  { value: "Washington", key: "WA" },
  { value: "West Virginia", key: "WV" },
  { value: "Wisconsin", key: "WI" },
  { value: "Wyoming", key: "WY" },
];
export default function SignUpSteps(props: Props) {
  const searchParams = new URLSearchParams(window.location.search);
  const { color, customizationsData } = props;
  const router = useRouter();

  const [form, setForm] = React.useState({
    otp: "",
    first_name: "",
    last_name: "",
    setSignUpWith: () => {},
    name: "",
    state: {
      value: "",
      key: "",
    },
    city: {
      value: "",
      key: "",
    },
    zip: "",
    industry: {
      key: "",
      value: "",
    },
    email:
      props.email ||
      (searchParams.has("stage") && searchParams.get("email")) ||
      "",
  });
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [query, setQuery] = useState("");
  const [industries, setIndustries] = useState([]);

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const result = await axios.get(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/industries`,
          {
            withCredentials: true,
          }
        );
        setIndustries(result.data);
      } catch (error) {}
    };

    fetchIndustries();
  }, []);

  const filteredIndustry =
    query === ""
      ? industries
      : industries.filter((industry: any) => {
          return industry?.value.toLowerCase().includes(query.toLowerCase());
        });

  const setField = React.useCallback(
    (name: keyof typeof form, value: any) =>
      setForm((f) => ({ ...f, [name]: value })),
    [setForm]
  );

  const validateFields = () => {
    if (!form.email) {
      setLoading(false);
      return setError({ key: "email", value: "E-mail can not be empty" });
    } else if (!validateEmail(form.email)) {
      setLoading(false);
      return setError({ key: "email", value: "E-mail invalid format" });
    } else if (!form.first_name) {
      setLoading(false);
      return setError({
        key: "first_name",
        value: "First Name can not be empty",
      });
    } else if (!form.last_name) {
      setLoading(false);
      return setError({
        key: "last_name",
        value: "Last Name can not be empty",
      });
    } else if (!form.name) {
      setLoading(false);
      return setError({ key: "name", value: "Company Name can not be empty" });
    } else if (!form.state.value) {
      setLoading(false);
      return setError({ key: "state", value: "State field can not be empty" });
    } else if (!form.zip) {
      setLoading(false);
      return setError({ key: "zip", value: "Postal Code can not be empty" });
    } else if (!/(^\d{5}$)|(^\d{5}-\d{4}$)/.test(form.zip)) {
      setLoading(false);
      return setError({ key: "zip", value: "Incorrect postal code" });
    } else if (!form.industry?.value) {
      setLoading(false);
      return setError({ key: "industry", value: "Industry can not be empty" });
    }
    setError({ key: "", value: "" });
    return true;
  };

  function validateEmail(email: string) {
    var reg =
      /^[A-Za-z0-9_\-\.]+(\+[A-Za-z0-9_\-\.]+)?@[A-Za-z0-9_\-\.]+\.[A-Za-z]{2,4}$/;
    // return reg.test(email)?  true:  false;
    return true;
  }

  const validateCandidateFields = () => {
    if (!form.email) {
      setLoading(false);
      return setError({ key: "email", value: "E-mail can not be empty" });
    } else if (!validateEmail(form.email)) {
      setLoading(false);
      return setError({ key: "email", value: "E-mail invalid format" });
    } else if (!form.first_name) {
      setLoading(false);
      return setError({
        key: "first_name",
        value: "First Name can not be empty",
      });
    } else if (!form.last_name) {
      setLoading(false);
      return setError({
        key: "last_name",
        value: "Last Name can not be empty",
      });
    } else if (!form.state.value) {
      setLoading(false);
      return setError({ key: "state", value: "State field can not be empty" });
    } else if (!form.city.value) {
      setLoading(false);
      return setError({ key: "city", value: "City field can not be empty" });
    }
    setError({ key: "", value: "" });
    return true;
  };

  const registerHandler = async () => {
    setLoading(true);
    let validationResponse;
    if (props.role == "job-seeker") {
      validationResponse = validateCandidateFields();
    } else {
      validationResponse = validateFields();
    }
    if (!validationResponse === true) {
      return;
    } else {
      let user;
      if (props.role == "job-seeker") {
        user = {
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          state: form.state.value,
          city: form.city.value,
          role: "job_seeker",
        };
      } else {
        user = {
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          name: form.name,
          state: form.state.value,
          zip: form.zip,
          role: "employer",
        };
      }
      axios
        .post(process.env.NEXT_PUBLIC_DOMAIN + "/api/accounts/register/otp", {
          user,
        })
        .then((response) => {
          router.push(
            `/signin?source=self&id=${form.email}&first_name=${form.first_name}&last_name=${form.last_name}`,
            undefined
          );
        })
        .catch((error) => {
          setLoading(false);
          setShowError(true);
          if (error.response.status === 409) {
            setErrorMsg(
              "Account already exists with this email, try another email."
            );
          } else {
            setErrorMsg("Something went wrong, try again later");
          }
        });
    }
  };

  // Error Handling
  const [error, setError] = useState<{
    key: keyof typeof form | "";
    value: any;
  }>({ key: "" as any, value: "" });

  return (
    <div
      style={{
        backgroundColor: color?.innerBg,
        color: color?.secondaryAccent,
      }}
      className="flex flex-col w-full lg:ml-10 md:ml-0"
    >
      <nav aria-label="Progress" className="w-full"></nav>
      <div className="text-3xl mb-6 font-semibold">
        {customizationsData?.form?.title}
      </div>
      <>
        <div className="text-xl font-semibold">
          {customizationsData?.form?.subtitle}
        </div>
        <div className="text-sm font-thin mt-1">
          {customizationsData?.form?.message}
        </div>
        <TextInput
          label={"E-mail"}
          disabled={loading}
          value={form.email}
          placeholder={"Your email"}
          onChange={(e) => {
            setError({ key: "email", value: "" });
            setField("email", e.target.value);
          }}
          error={error?.key === "email" ? error.value : ""}
          onKeyDown={(e: any) => {
            if (e.keyCode === 13) {
              registerHandler();
            }
          }}
        />
        <div className="flex items-start justify-between gap-3">
          <TextInput
            label={"First Name"}
            disabled={loading}
            value={form.first_name}
            placeholder={"First Name"}
            onChange={(e) => {
              setError({ key: "first_name", value: "" });
              setField("first_name", e.target.value);
            }}
            error={error?.key === "first_name" ? error.value : ""}
            onKeyDown={(e: any) => {
              if (e.keyCode === 13) {
                registerHandler();
              }
            }}
          />
          <TextInput
            label={"Last Name"}
            disabled={loading}
            value={form.last_name}
            placeholder={"Last Name"}
            onChange={(e) => {
              setError({ key: "last_name", value: "" });
              setField("last_name", e.target.value);
            }}
            error={error?.key === "last_name" ? error.value : ""}
            onKeyDown={(e: any) => {
              if (e.keyCode === 13) {
                registerHandler();
              }
            }}
          />
        </div>
        {props.role != "job-seeker" ? (
          <TextInput
            label={"Company Name"}
            disabled={loading}
            value={form.name}
            placeholder={"Company Name"}
            onChange={(e) => {
              setError({ key: "name", value: "" });
              setField("name", e.target.value);
            }}
            error={error?.key === "name" ? error.value : ""}
          />
        ) : null}
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="flex flex-col md:flex-row md:justify-between gap-4 mb-4 mt-2 w-full items-start"
        >
          <div
            style={{ backgroundColor: color?.innerBg }}
            className="w-full mt-3"
          >
            <Select
              items={states}
              label={"Location"}
              selected={form?.state.value}
              placeholder={
                props.role != "job-seeker" ? "Company State" : "Your State"
              }
              setSelected={(e) => {
                setError({ key: "state", value: "" });
                setField("state", e);
              }}
              error={error?.key === "state" ? error.value : ""}
              onKeyDown={(e: any) => {
                if (e.keyCode === 13) {
                  registerHandler();
                }
              }}
            />
          </div>
          {props.role != "job-seeker" ? (
            <TextInput
              className=""
              disabled={loading}
              label={"Postal code"}
              value={form.zip}
              placeholder={"Postal Code"}
              onChange={(e) => {
                setError({ key: "zip", value: "" });
                setField("zip", e.target.value);
              }}
              error={error?.key === "zip" ? error.value : ""}
              onKeyDown={(e: any) => {
                if (e.keyCode === 13) {
                  registerHandler();
                }
              }}
            />
          ) : (
            <div className="w-full mt-3">
              <Select
                items={jobLocation}
                label={"City"}
                selected={form.city.value}
                placeholder="Your City"
                setSelected={(e) => {
                  setError({ key: "city", value: "" });
                  setField("city", e);
                }}
                error={error?.key === "city" ? error.value : ""}
                onKeyDown={(e: any) => {
                  if (e.keyCode === 13) {
                    registerHandler();
                  }
                }}
              />
            </div>
          )}
        </div>
        {props.role != "job-seeker" ? (
          <>
            <h3 className="font-medium text-sm mt-6 mb-3">Company Industry</h3>
            <Combobox
              value={form.industry}
              onChange={(e: any) => {
                setField(
                  "industry",
                  _.find(
                    industries,
                    (industry: { key: string; value: string }) =>
                      industry?.value === e
                  )
                );
                setQuery(e);
                error.key === "industry" && setError({ key: "", value: "" });
              }}
            >
              <div className="relative mt-1">
                <div
                  style={{
                    borderColor: color?.outerBg,
                    backgroundColor: color?.innerBg,
                  }}
                  className="relative w-full cursor-default overflow-hidden rounded-lg border-[1px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm"
                >
                  <Combobox.Button className="w-full py-1">
                    <div className="flex w-full justify-between items-center">
                      <Combobox.Input
                        className="w-full border-none pr-10 outline-none text-sm m-2 font-light leading-5 focus:ring-0"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Select Industry"
                        onKeyDown={(e: any) => {
                          if (e.keyCode === 13) {
                            registerHandler();
                          }
                        }}
                      />
                      <ChevronUpDownIcon
                        className="h-6 w-6 mx-2 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                  </Combobox.Button>
                </div>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Combobox.Options
                    style={{
                      backgroundColor: color?.innerBg,
                      color: color?.secondaryAccent,
                    }}
                    className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md py-1 text-base shadow-lg ring-1 ring-opacity-5 focus:outline-none sm:text-sm"
                  >
                    {filteredIndustry.length === 0 && query !== "" ? (
                      <div className="relative cursor-default select-none py-2 px-4">
                        Nothing found.
                      </div>
                    ) : (
                      filteredIndustry.map((industry: any) => (
                        <Combobox.Option
                          key={industry?.key}
                          style={{
                            backgroundColor: color?.innerBg,
                            color: color?.secondaryAccent,
                          }}
                          onMouseEnter={(e: any) => {
                            e.currentTarget.style.backgroundColor =
                              color?.primaryAccent;
                            e.currentTarget.style.color = color?.innerBg;
                          }}
                          onMouseLeave={(e: any) => {
                            e.currentTarget.style.backgroundColor =
                              color?.innerBg;
                            e.currentTarget.style.color =
                              color?.secondaryAccent;
                          }}
                          className="relative cursor-default select-none py-2 pr-4"
                          value={industry?.value}
                        >
                          {({ selected, active }) => (
                            <>
                              <span className="block truncate m-3">
                                {industry?.value}
                              </span>
                            </>
                          )}
                        </Combobox.Option>
                      ))
                    )}
                  </Combobox.Options>
                </Transition>
              </div>
            </Combobox>
            <div className="mt-3">
              {error?.key === "industry" && (
                <Alert type="error" msg={error.value} />
              )}
            </div>
          </>
        ) : (
          ""
        )}
        <div className="flex items-center text-sm mt-8 my-2 font-extralight">
          <div className="text-green-800 mr-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path
                fillRule="evenodd"
                d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          {customizationsData?.safety?.title}
          <Link
              href="/terms-and-conditions"
              rel="noreferrer"
              style={{color: color?.primaryAccent }}
              className="ml-1">
                      terms & conditions
          </Link>
                <span>&nbsp;and</span>
          <Link
              href="/privacy-policy"
              rel="noreferrer"
              style={{color: color?.primaryAccent }}
              className="ml-1">
                  {customizationsData?.safety?.linkText}
          </Link>
        </div>
        <div
          style={{ borderColor: color?.outerBg }}
          className="w-full border-t"
        />
        {showError && (
          <div className="">
            <Alert type={"error"} msg={errorMsg} />
          </div>
        )}
        <ButtonWrapper
          onClick={registerHandler}
          disabled={loading ? (!showError ? true : false) : false}
          classNames="flex mt-2 items-center justify-center rounded-sm border border-transparent w-full md:w-1/3 py-6 text-sm font-medium shadow-sm focus:outline-none"
        >
          {loading ? "Please wait .." : customizationsData?.form?.btnText}
          <ArrowSmallRightIcon
            className="ml-3 -mr-1 h-5 w-5"
            aria-hidden="true"
          />
        </ButtonWrapper>
      </>
      <div className="flex mt-2 text-sm">
        Or
        <div
          style={{ color: color?.primaryAccent }}
          onClick={() => props.setSignUpWith("hero")}
          className="font-medium hover:opacity-70 ml-2 cursor-pointer"
        >
          Cancel
        </div>
      </div>
    </div>
  );
}
