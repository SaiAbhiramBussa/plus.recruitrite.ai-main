/* eslint-disable no-throw-literal */
import { ArrowSmallRightIcon } from "@heroicons/react/24/solid";
import React, { useContext, useEffect, useState } from "react";
import Alert from "@/src/component/Alerts";
import Select from "react-select";
import TextInput from "@/src/component/TextInput";
import axios from "axios";
import _ from "lodash";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TextEditor from "../TextEditor";
import dynamic from "next/dynamic";
import AppContext from "@/src/context/Context";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

export default function Company(props: any) {
  const {
    setFocussedTab,
    companyForm,
    setCompanyForm,
    modal,
    responseErrors,
    setResponseErrors,
    isEdit,
    setIsEdit,
    setShowAddCompanyModal,
    setCompanyInfo,
    isFullServiceEnabled,
  } = props;
  if (companyForm)
    companyForm.isFullServiceEnabled = companyForm.subscription_type
      ? true
      : false;
  const [form, setForm] = React.useState(
    companyForm
      ? companyForm
      : {
          name: "",
          logo: "",
          description: "",
          isFullServiceEnabled: isFullServiceEnabled ? true : false,
          subscription_type: null,
          website_url: "",
          industry: {
            key: "",
            value: "",
          },
        }
  );

  useEffect(() => {
    return setForm(
      companyForm
        ? companyForm
        : {
            name: "",
            logo: "",
            description: "",
            isFullServiceEnabled: isFullServiceEnabled ? true : false,
            subscription_type: null,
            website_url: "",
            industry: {
              key: "",
              value: "",
            },
          }
    );
  }, []);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [industries, setIndustries] = useState<
    Array<{ key: string; value: string }>
  >([]);
  const { color } = useContext(AppContext);

  useEffect(() => {
    if (responseErrors) {
      if (responseErrors.Error) {
        setShowError(true);
        setErrorMsg(responseErrors.Error);
      } else {
        if (_.size(Object.keys(responseErrors))) {
          _.forEach(Object.keys(responseErrors), (fieldName) =>
            _.forEach(responseErrors[fieldName], (error: any, index: any) => {
              if (index === 0) {
                setShowError(true);
                setErrorMsg(error);
              }
            })
          );
        }
      }
    }
  }, [responseErrors]);

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

  const setField = React.useCallback(
    (name: keyof typeof form, value: any) =>
      setForm((f: any) => ({ ...f, [name]: value })),
    [setForm]
  );

  const validateUrl = (inputUrl: any) => {
    const urlPattern = /^(ftp|http|https):\/\/[^ "]+$/;
    return urlPattern.test(inputUrl);
  };

  const toggleSlider = () => {
    form.isFullServiceEnabled || form.subscription_type === "full_service"
      ? setField("subscription_type", null)
      : setField("subscription_type", "full_service");
    setField("isFullServiceEnabled", !form.isFullServiceEnabled);
  };

  const validateFields = () => {
    if (!form.name) {
      setLoading(false);
      return setError({ key: "name", value: "Company Name can not be empty" });
    } else if (!form.website_url) {
      setLoading(false);
      return setError({
        key: "website_url",
        value: "Website URL can not be empty",
      });
    } else if (form.website_url) {
      if (!validateUrl(form.website_url)) {
        setLoading(false);
        return setError({ key: "website_url", value: "Incorrect URL" });
      }
    }
    if (!form.industry?.value && !form?.industry?.title) {
      setLoading(false);
      return setError({ key: "industry", value: "Industry can not be empty" });
    }
    setError({ key: "", value: "" });
    return true;
  };

  const updateCompanyFunction = async () => {
    try {
      if (validateFields()) {
        const dataObj = {
          id: form.id,
          description: form.description,
          industry: form.industry.value
            ? form.industry.value
            : form.industry.title
            ? form.industry.title
            : form.industry,
          logo: form.logo,
          name: form.name,
          subscription_type: form.isFullServiceEnabled ? "full_service" : null,
          website_url: form.website_url,
        };
        let res = await axios.patch(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyForm.id}`,
          dataObj,
          { withCredentials: true }
        );

        if (res.status === 200) {
          toast.success("Company info updated successfully!", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
          setIsEdit(false);
          setShowAddCompanyModal(false);
          try {
            let res2 = await axios.get(
              `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyForm.id}`,
              { withCredentials: true }
            );
            if (res.status === 200) {
              setCompanyInfo(res2.data);
            }
          } catch (err: any) {
            toast.error("Something went wrong!", {
              position: toast.POSITION.TOP_RIGHT,
              autoClose: 2000,
              hideProgressBar: true,
            });
          }
        }
      }
    } catch (err: any) {
      toast.error(err?.data?.Error, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const nextStep = () => {
    setShowError(false);
    setResponseErrors();
    if (validateFields()) {
      setCompanyForm(form);
      setFocussedTab("location");
    }
  };

  const getOptionLabel = (option: any) => option.value;
  const getOptionValue = (option: any) => option.value;

  const handleIndustryChange = (selectedOption: any) => {
    setError({ key: "industry", value: "" });
    setForm((f: any) => ({ ...f, industry: selectedOption }));
  };

  // Error Handling
  const [error, setError] = useState<{
    key: keyof typeof form | "";
    value: any;
  }>({ key: "" as any, value: "" });

  return (
    <>
      <div
        style={{
          backgroundColor: color?.innerBg,
          color: color?.secondaryAccent,
        }}
        className={`flex flex-col w-full overflow-y-scroll ${
          modal ? "h-[50vh]" : "h-[72vh]"
        }`}
      >
        <div
          className={`${
            modal === true ? "w-full" : "mt-6 w-3/4"
          } divide-x gap-5 mb-6 mx-auto col-span-2 px-6 flex justify-between`}
        >
          <div
            className={`${modal === true ? "w-full" : "w-3/6"} mx-auto h-auto`}
            onChange={() => setShowError(false)}
          >
            {modal && (
              <div className="mb-8 font-semibold">
                {isEdit ? "" : "Add company"}
              </div>
            )}
            <div>
              {showError && (
                <div className="mt-8">
                  <Alert type={"error"} msg={errorMsg} />
                </div>
              )}
              <TextInput
                label="Company Name *"
                section="admin"
                value={form.name}
                placeholder={"Company Name"}
                onChange={(e) => {
                  setError({ key: "name", value: "" });
                  setField("name", e.target.value);
                }}
                error={error?.key === "name" ? error.value : ""}
                disabled={loading}
              />
              <div>
                <div className="font-semibold text-sm mt-8 mb-1">
                  Company Industries *
                </div>
                <Select
                  options={industries}
                  className="placeholder:text-sm sm:text-sm font-light"
                  getOptionLabel={getOptionLabel}
                  getOptionValue={getOptionValue}
                  defaultValue={
                    modal ? form?.industry?.title : form?.industry?.value
                  }
                  placeholder={
                    modal ? form?.industry?.title : form?.industry?.value
                  }
                  onChange={(e: any) => handleIndustryChange(e)}
                  isSearchable={true}
                />
                {error.key === "industry" && error.value && (
                  <div className="mt-4">
                    <Alert type={"error"} msg={error.value} />
                  </div>
                )}
              </div>
              <TextInput
                label="Website URL *"
                section="admin"
                value={form.website_url}
                placeholder={"Website URL"}
                onChange={(e) => {
                  setError({ key: "website_url", value: "" });
                  setField("website_url", e.target.value);
                }}
                error={error?.key === "website_url" ? error.value : ""}
                disabled={loading}
              />
              <TextInput
                section="admin"
                label={"Logo"}
                value={form.logo}
                placeholder={"Logo"}
                onChange={(e) => {
                  setError({ key: "logo", value: "" });
                  setField("logo", e.target.value);
                }}
                error={error?.key === "logo" ? error.value : ""}
                disabled={loading}
              />
              <TextEditor
                placeholder={""}
                label="Description"
                initialValue={form?.description}
                onChange={(e: any) => {
                  setError({ key: "description", value: "" });
                  setForm((f: any) => ({
                    ...f,
                    description: e,
                  }));
                }}
                error={error?.key === "description" ? error.value : ""}
              />
              <div className="flex mt-8 justify-between">
                <div className="text-sm font-semibold">
                  Do you want to enable the full-service plan?
                </div>
                <div className="relative ml-10 items-center flex select-none">
                  <input
                    type="checkbox"
                    className="form-toggle absolute w-full h-10 opacity-0 z-10 cursor-pointer"
                    checked={
                      form?.isFullServiceEnabled ||
                      form?.subscription_type === "full_service"
                        ? true
                        : false
                    }
                    onChange={toggleSlider}
                  />
                  <div
                    style={
                      form.isFullServiceEnabled ||
                      form.subscription_type === "full_service"
                        ? { color: color?.primaryAccent }
                        : { color: color?.outerBg }
                    }
                    className={`${
                      form.isFullServiceEnabled ||
                      form.subscription_type === "full_service"
                        ? "grid justify-items-end"
                        : "0"
                    } form-toggle-slider h-6 w-12 rounded-full shadow-inner transition-all duration-200 ease-in-out`}
                  >
                    <div
                      style={{ backgroundColor: color?.innerBg }}
                      className={`circle h-4 w-4 rounded-full shadow-sm m-1`}
                    ></div>
                  </div>
                  {/* <div className="text-xs ml-2">{isFullServiceEnabled ? 'Disable Full Service' : 'Enable Full Service'}</div> */}
                </div>
              </div>
              <div
                className={`flex ${
                  modal ? "hidden" : "justify-end"
                } items-center mb-8`}
              >
                <ButtonWrapper
                  onClick={isEdit ? updateCompanyFunction : nextStep}
                  disabled={loading ? (!showError ? true : false) : false}
                  classNames="flex items-center mt-12 justify-center rounded border border-transparent px-4 py-3 text-sm font-medium shadow-sm focus:outline-none"
                >
                  <span className="mx-1 hidden lg:block">
                    {loading ? "Please wait .." : isEdit ? "Update" : "Next"}
                  </span>
                  {!modal && (
                    <ArrowSmallRightIcon
                      className="ml-3 -mr-1 h-5 w-5"
                      aria-hidden="true"
                    />
                  )}
                </ButtonWrapper>
              </div>
            </div>
          </div>
        </div>
      </div>
      {modal ? (
        <div className="flex justify-end items-center h-min w-full pr-4">
          <ButtonWrapper
            onClick={isEdit ? updateCompanyFunction : nextStep}
            disabled={loading ? (!showError ? true : false) : false}
            classNames="flex items-center justify-center rounded border border-transparent px-4 py-3 text-sm font-medium shadow-sm focus:outline-none"
          >
            <span className="mx-1">
              {loading ? "Please wait .." : isEdit ? "Update" : "Next"}
            </span>
            {!modal && (
              <ArrowSmallRightIcon
                className="ml-3 -mr-1 h-5 w-5"
                aria-hidden="true"
              />
            )}
          </ButtonWrapper>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
