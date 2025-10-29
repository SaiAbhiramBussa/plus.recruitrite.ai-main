import { faEdit, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";
import Modal from "../Modal";
import { toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import Integration from "../create-company/integration";
import Loader from "../Loader";
import { showErrorToast } from "@/src/common/common.util";

const Integrations = (props: any) => {
  const {
    setError,
    companyid,
    setIsEdit,
    isEdit,
    companyInfo,
    setCompanyInfo,
    error,
    locations,
    addNewUser,
    setShowAddCompanyModal,
    userForm,
    setUserForm,
    color,
  } = props;

  const [integrationForm, setIntegrationForm] = useState<any>({});
  const [deleteItem, setDeleteItem] = useState<any>();
  const [showAddIntegrationModal, setShowAddIntegrationModal] =
    useState<boolean>(false);
  const [credential, setCredential] = useState<any>("********");
  const [showCredentialModal, setShowCredentialModal] =
    useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [companyForm, setCompanyForm] = useState<any>();
  const [integrations, setIntegrations] = useState<any>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    companyid && fetchIntegrations();
  }, [companyid]);

  const revealCredential = async (id: any) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/integrations/${id}/credentials`,
        {
          withCredentials: true,
        }
      );
      setCredential(response.data.credentials);
      setShowCredentialModal(true);
    } catch (err) {
      showErrorToast("Unable to reveal credential");
    }
  };

  const openIntegrationEditModal = async (integrationItem: any) => {
    try {
      const credresponse = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/integrations/${integrationItem.id}/credentials`,
        {
          withCredentials: true,
        }
      );
      //  setCredential(response.data.credentials)
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/integrations/${integrationItem.id}`,
        {
          withCredentials: true,
        }
      );

      const obj = response.data;
      obj.credentials = credresponse.data.credentials;

      setIntegrationForm(obj);
      setShowAddIntegrationModal(true);
      setIsEdit(true);
    } catch (err) {}
  };

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/integrations/`,
        {
          withCredentials: true,
        }
      );
      if (response.status === 200) setIntegrations(response.data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const addNewIntegration = async (integrationForm: any) => {
    try {
      if (integrationForm) {
        const obj = {
          credentials: integrationForm?.credentials
            ? integrationForm.credentials
            : null,
          type: integrationForm.integrationType.option,
        };

        const integrationRes = await axios.post(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/integrations/`,
          obj,
          {
            withCredentials: true,
          }
        );

        if (integrationRes.status === 200) {
          toast.success("Integration created successfully", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
          fetchIntegrations();
          setShowAddIntegrationModal(false);
        }
      }
    } catch (err: any) {
      setError(err.response.data[0]);
    }
  };

  const deleteIntegration = async (id: any) => {
    try {
      const res = await axios.delete(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/integrations/${id}`,
        {
          withCredentials: true,
        }
      );
      if (res.status === 200) {
        setConfirmDelete(false);
        toast.success(res.data.Message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        fetchIntegrations();
      }
      return res;
    } catch (err) {
      return err;
    }
  };

  function toPrettyDate(rawDateStr: string): string {
    const date = new Date(rawDateStr);
    return date.toLocaleDateString("en-GB");
  }

  return (
    <div className="creators p-4">
      <div className="head w-full m-auto flex px-3 py-1 rounded-md">
        <div className="flex items-center">
          <Image
            className="mb-1 mr-2 mt-1"
            src={"/Images/h1-icon.png"}
            alt="company logo"
            height={16}
            width={16}
          />
          <p className="ml-3 font-semibold">Integrations</p>
        </div>
        <button
          style={{ color: color?.primaryAccent }}
          onClick={() => {
            setIntegrationForm({});
            setError("");
            setShowAddIntegrationModal(true);
          }}
          className="flex items-center justify-center rounded border border-transparent px-2 py-1 font-medium text-sm shadow-sm focus:outline-none"
        >
          <FontAwesomeIcon icon={faPlus} className="h-4 cursor-pointer" />
        </button>
      </div>

      <div className="table w-full">
        <div>
          {loading ? (
            <div className="h-[50vh] flex justify-center items-center">
              <Loader />
            </div>
          ) : (
            <table className="table-auto w-full">
              <thead className="sticky top-0 border-b">
                <tr>
                  <th className="w-3/12 py-4 text-left">Type</th>
                  <th className="w-3/12 text-left">Key</th>
                  <th className="w-3/12 py-4 text-left">Credentials</th>
                  <th className="w-3/12 py-4 text-left pl-2">Created at</th>
                </tr>
              </thead>
              {integrations && (
                <tbody className="h-10 min-h-full overflow-auto">
                  {integrations?.length > 0 &&
                    integrations.map((item: any, key: any) => {
                      return (
                        <tr
                          key={key}
                          className="h-12 items-center table-row w-full border-b"
                        >
                          <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
                            <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                              {item.type ? item.type : "-"}
                            </div>
                          </td>
                          <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
                            <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                              {item.key ? item.key : "-"}
                            </div>
                          </td>
                          <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
                            <div
                              style={{ color: color?.secondaryAccent }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.color =
                                  color?.primaryAccent)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color =
                                  color?.secondaryAccent)
                              }
                              onClick={() => revealCredential(item.id)}
                              className="flex items-center flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis"
                            >
                              <span className="cursor-pointer">*********</span>
                              <div
                                style={{ color: color?.btnAccent }}
                                className="ml-2 flex justify-between items-center py-2 font-semibold text-lg"
                              >
                                {/* <FontAwesomeIcon onClick={() => fetchReveals(job_posting_candidate_id, candidate_id)} icon={faMagnifyingGlass} className=" text-black h-4 cursor-pointer" /> */}
                                <div>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    style={{ color: color?.secondaryAccent }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.color =
                                        color?.primaryAccent)
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.color =
                                        color?.secondaryAccent)
                                    }
                                    className="w-5 h-5 cursor-pointer mb-1"
                                  >
                                    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                                    <path
                                      fillRule="evenodd"
                                      d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
                            <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                              {item.created_at
                                ? toPrettyDate(item?.created_at)
                                : "-"}
                            </div>
                          </td>
                          <td>
                            <button
                              style={{ color: color?.primaryAccent }}
                              className="ml-6 mr-2"
                              onClick={() => {
                                setError("");
                                openIntegrationEditModal(item);
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faEdit}
                                className="h-4 mr-1 cursor-pointer"
                              />
                            </button>
                          </td>
                          <td>
                            <button
                              style={{ color: color?.primaryAccent }}
                              onClick={() => {
                                setDeleteItem(item);
                                setConfirmDelete(true);
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="h-4 mr-2 cursor-pointer"
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              )}
            </table>
          )}
          <Modal
            open={confirmDelete}
            setOpen={setConfirmDelete}
            header="Confirmation"
          >
            <div className="flex flex-col gap-6 mt-4">
              <div className="text-md">
                Are you sure you want to delete the selected integration?
              </div>
              <div className="flex items-center justify-end">
                <div>
                  <button
                    type="button"
                    className="disabled:cursor-not-allowed hover:bg-red-400 flex justify-center items-center rounded border border-transparent px-4 py-1 text-base font-medium text-white shadow-sm focus:outline-none mt-4  bg-red-500 disabled:bg-red-200"
                    onClick={() => deleteIntegration(deleteItem.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </Modal>
          <Modal
            overflow={true}
            open={showAddIntegrationModal}
            setOpen={setShowAddIntegrationModal}
            isEdit={isEdit}
            setIsEdit={setIsEdit}
            header="Add Integration"
          >
            <Integration
              setShowAddIntegrationModal={setShowAddIntegrationModal}
              companyid={companyid}
              setIntegrationFormData={setIntegrationForm}
              integrationFormData={integrationForm}
              integrations={integrations}
              setIntegrations={setIntegrations}
              addNewIntegration={addNewIntegration}
              companyInfo={companyInfo}
              isFullServiceEnabled={
                companyForm?.subscription_type === "full_service" ? true : false
              }
              setCompanyInfo={setCompanyInfo}
              responseErrors={error}
              setResponseErrors={setError}
              isEdit={isEdit}
              setIsEdit={setIsEdit}
              modal={true}
              locations={locations}
              addNewUser={addNewUser}
              companyForm={companyForm}
              setShowAddCompanyModal={setShowAddCompanyModal}
              setCompanyForm={setCompanyForm}
              userForm={userForm}
              setUserForm={setUserForm}
              color={color}
            />
          </Modal>
          <Modal
            open={showCredentialModal}
            setOpen={setShowCredentialModal}
            header="Your Credentials"
          >
            <div className="flex flex-col gap-2 mt-4">
              <div className="text-md font-semibold">
                This is your credential :
              </div>
              <div>{credential}</div>
            </div>
          </Modal>
          {!integrations?.length && (
            <div className="flex justify-center mt-6">
              <div>No integrations found.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Integrations;
