/* eslint-disable no-throw-literal */
import { ArrowSmallRightIcon } from "@heroicons/react/24/solid";
import { useCallback, useEffect, useState } from "react";
import Alert from "@/src/component/Alerts";
import Select from "@/src/component/Select";
import TextInput from "@/src/component/TextInput";
import axios from "axios";
import { ArrowSmallLeftIcon } from "@heroicons/react/24/outline";
import _ from "lodash";
import Loader from "@/src/component/Loader";
import { Country, State } from "country-state-city";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

export default function Location(props: any) {
  const [loaderOn, setLoaderOn] = useState(false);
  const {
    focussedTab,
    setFocussedTab,
    locationForm,
    setLocationForm,
    modal,
    addLocation,
    responseErrors,
    setResponseErrors,
    lastVal,
    isEdit,
    setIsEdit,
    companyid,
    setShowAddLocationModal,
    locations,
    setLocations,
    color,
  } = props;
  const [form, setForm] = useState(
    locationForm
      ? locationForm
      : {
          address: "",
          city: "",
          country: {
            currency: "",
            flag: "",
            isoCode: "",
            name: "",
            phonecode: "",
          },
          state: {
            countryCode: "",
            isoCode: "",
            name: "",
          },
          zip: null,
        }
  );
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (responseErrors) {
      {
        Object.keys(responseErrors).map((fieldName) =>
          responseErrors[fieldName].map((error: any, index: any) => {
            if (index === 0) {
              setShowError(true);
              setErrorMsg(error);
            }
          })
        );
      }
    }
  }, [responseErrors]);

  const setField = useCallback(
    (name: keyof typeof form, value: any) =>
      setForm((f: any) => ({ ...f, [name]: value })),
    [setForm]
  );

  const validateFields = () => {
    if (modal ? !form.country && !form?.country?.name : !form?.country?.name) {
      setLoading(false);
      return setError({ key: "country", value: "country can not be empty" });
    } else if (modal ? !form.state && !form?.state?.name : !form?.state?.name) {
      setLoading(false);
      return setError({ key: "state", value: "state can not be empty" });
    } else if (!form.city) {
      setLoading(false);
      return setError({ key: "city", value: "city can not be empty" });
    }
    if (form.zip && !/(^\d{5}$)|(^\d{5}-\d{4}$)/.test(form.zip)) {
      setLoading(false);
      return setError({ key: "zip", value: "Incorrect zip code" });
    }
    setError({ key: "", value: "" });
    return true;
  };

  const nextStep = () => {
    setShowError(false);
    setResponseErrors();
    if (validateFields()) {
      setLocationForm(form);
      setFocussedTab("user");
    }
  };

  const addLocationFunc = () => {
    if (validateFields()) {
      addLocation(form);
    }
  };

  const backStep = () => {
    setLocationForm(form);
    setFocussedTab("company");
  };
  const handleCountryChange = (selectedOption: any) => {
    setError({ key: "country", value: "" });
    setForm((f: any) => ({ ...f, country: selectedOption }));
    setForm((f: any) => ({ ...f, state: "" }));
  };
  const handleStateChange = (selectedOption: any) => {
    setError({ key: "state", value: "" });
    setForm((f: any) => ({ ...f, state: selectedOption }));
  };

  const updateLocation = async () => {
    try {
      const dataObj = {
        id: form.id,
        address: form.address,
        city: form.city,
        state: form.state.name,
        zip: form.zip,
        country: form.country.name,
      };
      if (validateFields()) {
        let res = await axios.patch(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/locations/${locationForm.id}/`,
          dataObj,
          { withCredentials: true }
        );
        if (res.status === 200) {
          toast.success("Location updated successfully!", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
          setIsEdit(false);
          setShowAddLocationModal(false);
          try {
            let res2 = await axios.get(
              `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/locations/${form.id}/`,
              { withCredentials: true }
            );
            if (res.status === 200) {
              const locationId = res2.data.id;
              const index = locations.findIndex(
                (location: any) => location.id === locationId
              );
              setLocations((prevUsers: any) => {
                const newArray = [...prevUsers];
                newArray[index] = res2.data;
                return newArray;
              });
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

  // Error Handling
  const [error, setError] = useState<{
    key: keyof typeof form | "";
    value: any;
  }>({ key: "" as any, value: "" });

  return (
    <>
      <div
        style={{ backgroundColor: color?.innerBg }}
        className={`flex flex-col ${
          loaderOn ? "opacity-60 z-10 " : ""
        }  w-full overflow-auto y-scroll max-h-[72vh]`}
      >
        {loaderOn ? (
          <div className="w-full h-screen absolute z-30 flex justify-center items-center fixed">
            <Loader />
          </div>
        ) : null}
        <div
          className={`${
            modal === true ? "w-full mt-3" : "w-3/4 mt-6"
          } divide-x gap-5 mx-auto col-span-2 px-6 flex justify-between`}
        >
          <div
            className={`${modal === true ? "w-full" : "w-3/6"} mx-auto h-auto`}
            onChange={() => setShowError(false)}
          >
            {/* {modal && <div className="mb-8 font-semibold">{isEdit ? 'Update location':'Add location'}</div>} */}
            <div>
              {showError && (
                <div className="mt-8">
                  <Alert type={"error"} msg={errorMsg} />
                </div>
              )}
              <Select
                items={Country.getAllCountries()}
                section="admin"
                label={"Country *"}
                selected={
                  !isEdit
                    ? form?.country?.name
                      ? form.country.name
                      : ""
                    : form?.country
                    ? form.country
                    : ""
                }
                placeholder={
                  !isEdit
                    ? form?.country?.name
                      ? form.country.name
                      : "Select country"
                    : form?.country
                    ? form.country
                    : "Select country"
                }
                setSelected={(e: any) => handleCountryChange(e)}
                error={error?.key === "country" ? error.value : ""}
              />
              <Select
                items={
                  !form?.country?.isoCode
                    ? State.getStatesOfCountry(
                        Country.getAllCountries().find(
                          (country) => country.name === form.country
                        )?.isoCode
                      )
                    : State.getStatesOfCountry(form?.country?.isoCode)
                }
                section="admin"
                label={"State *"}
                selected={
                  !isEdit
                    ? form?.state?.name
                      ? form.state.name
                      : ""
                    : form?.state
                    ? form.state
                    : ""
                }
                placeholder={
                  !isEdit
                    ? form?.state?.name
                      ? form.state.name
                      : "Enter state"
                    : form?.state
                    ? form.state
                    : "Enter state"
                }
                setSelected={(e: any) => handleStateChange(e)}
                error={error?.key === "state" ? error.value : ""}
              />
              <TextInput
                section="create_company"
                label={"City *"}
                value={form?.city ? form.city : ""}
                placeholder={form?.city ? form.city : "Enter city"}
                onChange={(e) => {
                  setError({ key: "city", value: "" });
                  setField("city", e.target.value);
                }}
                error={error?.key === "city" ? error.value : ""}
                disabled={loading}
              />
              <TextInput
                label="Address"
                section="create_company"
                value={form.address}
                placeholder={"Address"}
                onChange={(e) => {
                  setError({ key: "address", value: "" });
                  setField("address", e.target.value);
                }}
                error={error?.key === "address" ? error.value : ""}
                disabled={loading}
              />
              <TextInput
                section="create_company"
                label={"Zip"}
                value={form.zip}
                placeholder={form.zip ? form.zip : "Enter zip"}
                onChange={(e) => {
                  setError({ key: "zip", value: "" });
                  setField("zip", parseInt(e.target.value));
                }}
                error={error?.key === "zip" ? error.value : ""}
                disabled={loading}
              />
              <div
                className={`flex ${
                  modal ? "items-center justify-end mt-6" : "justify-between"
                }`}
              >
                {!modal && (
                  <div className="items-center mb-8">
                    <ButtonWrapper
                      onClick={backStep}
                      disabled={
                        loading
                          ? lastVal === "company"
                            ? true
                            : !showError
                            ? true
                            : false
                          : false
                      }
                      classNames="flex items-center mt-12 justify-center rounded border border-transparent px-4 py-3 text-sm font-medium shadow-sm focus:outline-none"
                    >
                      <ArrowSmallLeftIcon
                        className="mr-3 -ml-1 h-5 w-5"
                        aria-hidden="true"
                      />
                      <span className="mx-1 hidden lg:block">
                        {loading ? "Please wait .." : "Back"}
                      </span>
                    </ButtonWrapper>
                  </div>
                )}
                <div
                  className={`${
                    modal ? "" : "ml-4"
                  } flex justify-end items-center`}
                >
                  <ButtonWrapper
                    onClick={() =>
                      !modal
                        ? nextStep()
                        : isEdit
                        ? updateLocation()
                        : addLocationFunc()
                    }
                    disabled={loading ? (!showError ? true : false) : false}
                    classNames={`${
                      modal
                        ? "disabled:cursor-not-allowed flex justify-center items-center rounded border border-transparent px-2 py-2 text-base font-sm shadow-sm focus:outline-none mt-4"
                        : 'flex items-center mt-12 justify-center rounded border border-transparent px-4 py-3 text-sm font-medium shadow-sm ocus:outline-none"'
                    }`}
                  >
                    <span className="mx-1">
                      {modal
                        ? isEdit
                          ? "Save"
                          : "Add"
                        : loading
                        ? "Please wait .."
                        : "Next"}
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
      </div>
    </>
  );
}
