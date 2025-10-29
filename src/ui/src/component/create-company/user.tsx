/* eslint-disable no-throw-literal */
import { useCallback, useEffect, useState } from "react";
import TextInput from "@/src/component/TextInput";
import axios from "axios";
import { ArrowSmallLeftIcon } from "@heroicons/react/24/outline";
import _ from "lodash";
import { Country } from "country-state-city";
import Select from "react-select";
import Alert from "../Alerts";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

export default function User(props: any) {
  const {
    setShowError,
    showError,
    setFocussedTab,
    userForm,
    responseErrors,
    setUserForm,
    submit,
    setSubmit,
    locationForm,
    modal,
    addNewUser,
    locations,
    setResponseErrors,
    lastVal,
    isEdit,
    setIsEdit,
    companyid,
    setShowAddUserModal,
    users,
    setUsers,
    color,
  } = props;

  const [form, setForm] = useState(
    isEdit || !modal
      ? userForm
      : {
          first_name: "",
          last_name: "",
          email: "",
          title: "",
          phoneNumber: "",
          code: locationForm?.country?.phonecode
            ? "+" + locationForm?.country?.phonecode
            : "",
          phone: "",
        }
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [location, setLocation] = useState<any>(
    userForm ? userForm?.location : null
  );
  const [alert, setAlert] = useState<string>("");

  const getOptionLabel = (option: any) => {
    const addressParts = _.compact([
      option?.state,
      option?.city,
      option?.address,
    ]);
    const formattedAddress = `${addressParts[1] && addressParts[1]} (${
      addressParts[0] && addressParts[0]
    }, ${addressParts[2] && addressParts[2]})`;
    return formattedAddress;
  };
  const getOptionValue = (option: any) => {
    const addressParts = _.compact([
      option?.state,
      option?.city,
      option?.address,
    ]);
    const formattedAddress = `${addressParts[1] && addressParts[1]} (${
      addressParts[0] && addressParts[0]
    }, ${addressParts[2] && addressParts[2]})`;
    return formattedAddress;
  };

  const getCodeLabel = (option: any) => option.value;
  const getCodeValue = (option: any) => option.value;

  useEffect(() => {
    if (locationForm?.country?.phonecode) {
      setField("code", "+" + locationForm.country.phonecode);
    }
  }, [locationForm]);

  useEffect(() => {
    if (location) {
      const companyData = Country.getAllCountries().find(
        (item) =>
          item.name == location.country || item.isoCode == location.country
      );
      if (companyData) setField("code", "+" + companyData.phonecode);
    }
  }, location);

  useEffect(() => {
    if (responseErrors) {
      _.forEach(Object.keys(responseErrors), (fieldName) =>
        _.forEach(responseErrors[fieldName], (error: any, index: any) => {
          if (index === 0) {
            setShowError(true);
            setErrorMsg(error);
          }
        })
      );
    } else {
      setShowError(false);
    }
  }, [responseErrors]);

  const setField = useCallback(
    (name: keyof typeof form, value: any) =>
      setForm((f: any) => ({ ...f, [name]: value })),
    [setForm]
  );

  const validateFields = () => {
    if (!form.first_name) {
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
    } else if (!form.email) {
      setLoading(false);
      return setError({ key: "email", value: "E-mail can not be empty" });
    } else if (!form.email.includes("@")) {
      setLoading(false);
      return setError({ key: "email", value: "E-mail invalid format" });
    } else if (!form.code && !form.phone) {
      setLoading(false);
      return setError({ key: "code", value: "Select code" });
    } else if (!form.phoneNumber && !form.phone) {
      setLoading(false);
      return setError({ key: "phoneNumber", value: "Phone can not be empty" });
    }
    if (modal) {
      if (!location && !userForm?.location) {
        setLoading(false);
        return setError({ key: "location", value: "Select location" });
      }
    }

    setError({ key: "", value: "" });
    return true;
  };

  const addNewUserFunc = (form: any, location: any) => {
    setShowError(false);
    if (validateFields()) {
      if (form?.phoneNumber && form.phoneNumber.includes("-")) {
        const cleanedPhoneNumber = form?.phoneNumber?.replace(/-/g, "");
        setField("phoneNumber", cleanedPhoneNumber);
      }
      addNewUser(form, location);
    }
  };

  const phoneCodeOptions = Country.getAllCountries().map((country) => ({
    label:
      country?.phonecode[0] === "+"
        ? country?.phonecode
        : "+" + country?.phonecode,
    value:
      country?.phonecode[0] === "+"
        ? country?.phonecode
        : "+" + country?.phonecode,
  }));

  const nextStep = () => {
    setResponseErrors();
    setShowError(false);
    if (validateFields()) {
      const cleanedPhoneNumber = form.phoneNumber?.replace(/-/g, "");
      setField("phoneNumber", cleanedPhoneNumber);
      setUserForm(form);
      if (submit) {
        setSubmit(false);
      } else {
        setSubmit(true);
      }
    }
  };

  const backStep = () => {
    setUserForm(form);
    setFocussedTab("location");
  };

  const updateUserForm = async () => {
    try {
      if (validateFields()) {
        const dataObj = {
          id: form.id,
          email: form.email,
          first_name: form.first_name,
          created_at: form.created_at,
          name: form.name,
          created_by: form.created_by,
          last_name: form.last_name,
          location_id: location.id,
          phone:
            `${form?.code ? form.code : form?.phone.slice(0, -10)}` +
            `${form?.phoneNumber ? form.phoneNumber : form.phone.slice(-10)}`,
          title: form.title,
        };
        let res = await axios.patch(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/users/${form.id}/`,
          dataObj,
          { withCredentials: true }
        );
        if (res.status === 200) {
          toast.success("User info updated successfully!", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
          setIsEdit(false);
          setShowAddUserModal(false);
          try {
            let res2 = await axios.get(
              `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/users/${form.id}/`,
              { withCredentials: true }
            );
            if (res.status === 200) {
              const userId = res2.data.id;
              const index = users.findIndex((user: any) => user.id === userId);
              setUsers((prevUsers: any) => {
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
      if (err.response.status === 400) {
        if (_.size(Object.keys(err.response.data))) {
          setAlert(err.response.data[Object.keys(err.response.data)[0]][0]);
        }
      }
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
        className="flex flex-col w-full overflow-y-auto max-h-[72vh]"
      >
        {alert ? (
          <div className="mt-4">
            <Alert type={"error"} msg={alert} />
          </div>
        ) : (
          <></>
        )}
        <div
          className={`${
            modal === true ? "w-full" : "w-3/4"
          } divide-x gap-5 mx-auto col-span-2 px-6 flex justify-between`}
        >
          <div
            className={`${modal === true ? "w-full" : "w-3/6"} mx-auto h-auto`}
            onChange={() => setShowError(false)}
          >
            {/* {modal && (
              <div className="mb-8 font-semibold">
                {isEdit ? "Update user" : "Add user"}
              </div>
            )} */}
            {showError && (
              <div className="mt-4">
                <Alert type={"error"} msg={errorMsg} />
              </div>
            )}
            <div>
              <div className="flex">
                <div className="w-1/2 mr-2">
                  <TextInput
                    label="First Name *"
                    section="create_company"
                    value={form?.first_name}
                    placeholder={"First Name"}
                    onChange={(e) => {
                      setError({ key: "first_name", value: "" });
                      setField("first_name", e.target.value);
                    }}
                    error={error?.key === "first_name" ? error.value : ""}
                    disabled={loading}
                  />
                </div>
                <div className="w-1/2 ml-2">
                  <TextInput
                    section="create_company"
                    label={"Last Name *"}
                    value={form?.last_name}
                    placeholder={"Last Name"}
                    onChange={(e) => {
                      setError({ key: "last_name", value: "" });
                      setField("last_name", e.target.value);
                    }}
                    error={error?.key === "last_name" ? error.value : ""}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="flex">
                <div className="w-1/2 mr-2">
                  <TextInput
                    section="create_company"
                    label={"Email *"}
                    value={form?.email}
                    placeholder={"Email"}
                    onChange={(e) => {
                      setError({ key: "email", value: "" });
                      setField("email", e.target.value);
                    }}
                    error={error?.key === "email" ? error.value : ""}
                    disabled={loading}
                  />
                </div>
                <div className="w-1/2 ml-2">
                  <TextInput
                    section="create_company"
                    label={"Title"}
                    value={form?.title}
                    placeholder={"Title"}
                    onChange={(e) => {
                      setError({ key: "title", value: "" });
                      setField("title", e.target.value);
                    }}
                    error={error?.key === "title" ? error.value : ""}
                    disabled={loading}
                  />
                </div>
              </div>
              {phoneCodeOptions && (
                <div className="flex w-full">
                  <div className="w-2/5 mr-2 mt-6">
                    <div className="text-sm font-semibold">Code *</div>
                    <Select
                      options={phoneCodeOptions}
                      className="placeholder:text-sm sm:text-sm font-light"
                      getOptionLabel={getCodeLabel}
                      getOptionValue={getCodeValue}
                      defaultValue={
                        isEdit
                          ? form?.code
                            ? form.code
                            : form?.phone
                            ? form?.phone.slice(0, -10)
                            : ""
                          : form?.code
                          ? form.code
                          : ""
                      }
                      placeholder={
                        isEdit
                          ? form?.code
                            ? form.code
                            : form?.phone
                            ? form?.phone.slice(0, -10)
                            : "code"
                          : form?.code
                          ? form.code
                          : "code"
                      }
                      onChange={(e: any) => {
                        setError({ key: "code", value: "" });
                        setField("code", e.value);
                      }}
                      isSearchable={true}
                    />
                    {error.key === "code" && error.value && (
                      <div className="mt-4">
                        <Alert type={"error"} msg={error.value} />
                      </div>
                    )}
                  </div>

                  <TextInput
                    name="Phone"
                    className="w-2/3"
                    label={"Phone *"}
                    value={
                      isEdit
                        ? form?.phoneNumber
                          ? form.phoneNumber
                          : form?.phone
                          ? form.phone.slice(-10)
                          : ""
                        : form?.phoneNumber
                        ? form.phoneNumber
                        : ""
                    }
                    placeholder={
                      isEdit
                        ? form?.phoneNumber
                          ? form.phoneNumber
                          : form?.phone
                          ? form.phone.slice(-10)
                          : "phone"
                        : form?.phoneNumber
                        ? form.phoneNumber
                        : "Phone"
                    }
                    section="create_company"
                    onChange={(e) => {
                      setError({ key: "phoneNumber", value: "" });
                      setField("phoneNumber", e.target.value);
                    }}
                    error={error?.key === "phoneNumber" ? error.value : ""}
                    disabled={loading}
                  />
                </div>
              )}
              {modal && (
                <div className="mt-6">
                  <div className="text-sm font-semibold">Location *</div>
                  <Select
                    options={locations}
                    getOptionLabel={getOptionLabel}
                    getOptionValue={getOptionValue}
                    value={
                      location
                        ? _.compact([
                            location.state,
                            location.city,
                            location.address,
                          ]).join(", ")
                        : userForm?.location
                        ? _.compact([
                            userForm?.location.state,
                            userForm?.location.city,
                            userForm?.location.address,
                          ]).join(", ")
                        : ""
                    }
                    onChange={(e: any) => {
                      setError({ key: "location", value: "" });
                      setLocation(e);
                    }}
                    placeholder={
                      !isEdit
                        ? location
                          ? _.compact([
                              location.state,
                              location.city,
                              location.address,
                            ]).join(", ")
                          : userForm?.location
                          ? _.compact([
                              userForm?.location.state,
                              userForm?.location.city,
                              userForm?.location.address,
                            ]).join(", ")
                          : "Location"
                        : location
                        ? _.compact([
                            location.state,
                            location.city,
                            location.address,
                          ]).join(", ")
                        : "location"
                    }
                    isSearchable={true}
                  />
                  {error.key === "location" && error.value && (
                    <div className="mt-4">
                      <Alert type={"error"} msg={error.value} />
                    </div>
                  )}
                </div>
              )}
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
                          ? lastVal === "location"
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
                <div>
                  <ButtonWrapper
                    onClick={() =>
                      !modal
                        ? nextStep()
                        : isEdit
                        ? updateUserForm()
                        : addNewUserFunc(form, location)
                    }
                    disabled={loading ? (!showError ? true : false) : false}
                    classNames={`${
                      modal
                        ? "disabled:cursor-not-allowed flex justify-center items-center rounded border border-transparent px-2 py-2 text-base font-sm shadow-sm focus:outline-none mt-4"
                        : 'flex items-center mt-12 justify-center rounded border border-transparent px-4 py-3 text-sm font-medium shadow-sm focus:outline-none"'
                    }`}
                  >
                    <span className="mx-1">
                      {loading ? "Please wait .." : "Submit"}
                    </span>
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
