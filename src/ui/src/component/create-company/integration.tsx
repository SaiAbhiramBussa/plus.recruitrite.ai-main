/* eslint-disable no-throw-literal */
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Alert from "@/src/component/Alerts";
import axios from "axios";
import _ from "lodash";
import TextArea from "@/src/component/TextArea";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "../Select";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

let integrationChoice = [
  {
    key: "0",
    value: "JazzHR",
    option: "jazzHR",
  },
  {
    key: "1",
    value: "Workable",
    option: "workable",
  },
  {
    key: "2",
    value: "poweredBy",
    option: "poweredBy",
  },
];

export default function Integration(props: any) {
  const router = useRouter();
  const {
    setShowAddIntegrationModal,
    companyid,
    addNewIntegration,
    integrationFormData,
    integrations,
    setIntegrations,
    modal,
    responseErrors,
    isEdit,
    setIsEdit,
    color,
  } = props;
  const [integrationForm, setIntegrationForm] = useState(
    integrationFormData
      ? integrationFormData
      : {
          credentials: "",
          integrationType: {
            key: "",
            value: "",
            option: "",
          },
        }
  );
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [query, setQuery] = useState("");
  const [industries, setIndustries] = useState([]);

  useEffect(() => {
    if (responseErrors) {
      setShowError(true);
      setErrorMsg(responseErrors);
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

  const filteredIndustry =
    query === ""
      ? industries
      : industries.filter((industry: any) => {
          return industry?.value.toLowerCase().includes(query.toLowerCase());
        });

  const setField = useCallback(
    (name: keyof typeof integrationForm, value: any) =>
      setIntegrationForm((f: any) => ({ ...f, [name]: value })),
    [setIntegrationForm]
  );

  const validateFields = () => {
    if (!integrationForm.integrationType && !integrationForm.type) {
      setLoading(false);
      return setError({
        key: "integrationType",
        value: "Please select the integration type",
      });
    }
    if (!integrationForm.credentials) {
      setLoading(false);
      return setError({
        key: "credentials",
        value: "Credentials field cannot be empty",
      });
    }

    setError({ key: "", value: "" });
    return true;
  };

  const addNewIntegrationFunc = (integrationForm: any) => {
    setShowError(false);
    if (validateFields()) {
      addNewIntegration(integrationForm);
    }
  };

  const updateIntegrationFunc = async () => {
    try {
      if (validateFields()) {
        const dataObj = {
          type: integrationForm?.integrationType?.value
            ? integrationForm.integrationType.value
            : integrationForm.type,
          credentials: integrationForm?.credentials,
        };
        let res = await axios.put(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/integrations/${integrationForm.id}`,
          dataObj,
          { withCredentials: true }
        );
        if (res.status === 200) {
          toast.success(res?.data.Message, {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
          setIsEdit(false);
          setShowAddIntegrationModal(false);
          try {
            let res2 = await axios.get(
              `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/integrations/${integrationForm.id}`,
              { withCredentials: true }
            );
            if (res.status === 200) {
              const userId = res2.data.id;
              const index = integrations.findIndex(
                (user: any) => user.id === userId
              );
              setIntegrations((prevUsers: any) => {
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
    key: keyof typeof integrationForm | "";
    value: any;
  }>({ key: "" as any, value: "" });

  const [generalError, setGeneralError] = useState<string>("");

  return (
    <>
      <div
        className="creators px-4 py-2 mx-auto"
        onChange={() => setShowError(false)}
      >
        {showError && (
          <div className="mt-4">
            <Alert type={"error"} msg={errorMsg} />
          </div>
        )}
        <Select
          items={integrationChoice}
          section="employer"
          label={"Integration type"}
          selected={
            isEdit
              ? integrationForm?.integrationType?.value
                ? integrationForm?.integrationType?.value
                : integrationForm?.type
                ? integrationForm?.type
                : ""
              : ""
          }
          placeholder={
            isEdit
              ? integrationForm.type
              : integrationForm?.integrationType?.value
              ? integrationForm?.integrationType.value
              : "Select type"
          }
          setSelected={(e) => {
            setError({ key: "integrationType", value: "" });
            setField("integrationType", e);
          }}
          error={error?.key === "integrationType" ? error.value : ""}
        />
        <TextArea
          name="Credentials"
          value={
            integrationForm?.credentials ? integrationForm?.credentials : ""
          }
          label={"Credentials"}
          rows={4}
          placeholder={
            integrationForm?.credentials
              ? integrationForm?.credentials
              : "Enter credentials"
          }
          section="profile"
          onChange={(e) => {
            setError({ key: "credentials", value: "" });
            setIntegrationForm((f: any) => ({
              ...f,
              credentials: e.target.value,
            }));
          }}
          onValue={(value) =>
            setIntegrationForm((f: any) => ({ ...f, credentials: value }))
          }
          error={error?.key === "credentials" ? error.value : ""}
        />
        <div className="flex items-center justify-end mt-6">
          <div>
            <ButtonWrapper
              onClick={() =>
                isEdit
                  ? updateIntegrationFunc()
                  : addNewIntegrationFunc(integrationForm)
              }
              disabled={loading ? (!showError ? true : false) : false}
              classNames="disabled:cursor-not-allowed flex justify-center items-center rounded border border-transparent px-2 py-2 text-base font-sm shadow-sm focus:outline-none mt-4"
            >
              <span className="mx-1 hidden lg:block">
                {modal
                  ? isEdit
                    ? "Update"
                    : "Add"
                  : loading
                  ? "Please wait .."
                  : "Next"}
              </span>
            </ButtonWrapper>
          </div>
        </div>
      </div>
    </>
  );
}
