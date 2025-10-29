import { faEdit, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { Key, useEffect, useState } from "react";
import Modal from "../Modal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import User from "../create-company/user";
import _ from "lodash";
import Loader from "../Loader";

const Users = (props: any) => {
  const {
    companyid,
    setIsEdit,
    isEdit,
    error,
    setError,
    setLocationId,
    color,
  } = props;

  const [userForm, setUserForm] = useState<any>();
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<boolean>(false);
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [users, setUsers] = useState<any>();
  const [locations, setLocations] = useState<any>();
  const [deleteItem, setDeleteItem] = useState<any>();
  const [loading, setLoading] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);

  useEffect(() => {
    companyid && fetchUsers();

    companyid && fetchLocations();
  }, [companyid]);

  const fetchLocations = async () => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/locations/`,
      {
        withCredentials: true,
      }
    );
    if (response.status === 200) {
      setLocations(response.data);
    }
  };

  locations?.length &&
    locations.map((item: any, key: any) => {
      const addressParts = _.compact([item?.state, item?.city, item?.address]);
      const formattedAddress = _.join(addressParts, ", ");
    });

  const addCreator = () => {
    // if no location show warning
    if (!locations?.length) {
      toast.warn("Add location first!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
    // else show user form with location dropdown
    else {
      setShowAddUserModal(true);
    }
  };

  const deleteUser = async (userId: any) => {
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/users/${userId}/`,
        {
          withCredentials: true,
        }
      );
      if (response.status === 200) {
        setConfirmDeleteUser(false);
        toast.success(response.data.Message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        const usersArr = users.filter((user: any) => user.id !== userId);
        setUsers(usersArr);
      }
    } catch (err: any) {
      toast.error(err?.message, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 10000,
        hideProgressBar: true,
      });
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/users/`,
        {
          withCredentials: true,
        }
      );
      if (response.status === 200) {
        setUsers(response.data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const addNewUser = async (userForm: any, location: any) => {
    try {
      if (userForm && location) {
        const foundObject = locations.find(
          (item: any) => item.address === location.address
        );
        setLocationId(foundObject.id);
        const userFormObj = {
          location_id: foundObject.id,
          first_name: userForm.first_name,
          last_name: userForm.last_name,
          title: userForm.title,
          email: userForm.email,
          phone: userForm.code + userForm.phoneNumber,
        };
        userForm.location_id = foundObject.id;
        const userRes = await axios.post(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${foundObject.id}/users/`,
          userFormObj,
          {
            withCredentials: true,
          }
        );
        if (userRes?.status === 200) {
          toast.success("User created successfully", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
          fetchUsers();
          setShowAddUserModal(false);
        }
      }
    } catch (err: any) {
      setError(err.response.data);
    }
  };

  const openUserEditModal = async (userItem: any) => {
    setUserForm(userItem);
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/users/${userItem.id}/`,
      {
        withCredentials: true,
      }
    );
    setUserForm(userItem);
    setShowAddUserModal(true);
    setIsEdit(true);
  };

  function toPrettyDate(rawDateStr: string): string {
    const date = new Date(rawDateStr);
    return date.toLocaleDateString("en-GB");
  }

  return (
    <div className="creators p-4">
      <div className="head w-full m-auto flex px-3 py-1 rounded-md">
        {/* <div className="head bg-slate-200 w-full m-auto justify-between flex px-3 py-1 rounded-md"> */}
        <div className="flex items-center">
          <Image
            className="mb-1 mr-2 mt-1"
            src={"/Images/h1-icon.png"}
            alt="company logo"
            height={16}
            width={16}
          />
          <p className="ml-3 font-semibold">Users</p>
        </div>
        <button
          style={{ color: color?.primaryAccent }}
          onClick={() => {
            setError();
            setUserForm({});
            addCreator();
            setShowError(false);
          }}
          className="flex items-center justify-center rounded border border-transparent px-2 py-1 text-sm font-medium shadow-sm focus:outline-none"
        >
          <FontAwesomeIcon icon={faPlus} className="h-4 cursor-pointer" />
        </button>
      </div>
      {loading ? (
        <div className="h-[50vh] flex justify-center items-center">
          <Loader />
        </div>
      ) : (
        <table className="table-auto w-full">
          <thead className="sticky top-0 border-b">
            <tr>
              <th className="w-1/12"> </th>
              <th className="w-3/12 py-4 text-left">Name</th>
              <th className="w-3/12 text-left">Title</th>
              <th className="w-4/12 py-4 text-left">Email</th>
              <th className="w-1/12 py-4 text-left pl-2">Created at</th>
            </tr>
          </thead>
          {users && (
            <tbody className="overflow-auto">
              {users?.length > 0 &&
                users.map((item: any, index: Key) => {
                  return (
                    <tr
                      key={index}
                      className="h-12 mx-12 table-row w-full border-b"
                    >
                      <td className="truncate pl-2 lg:max-w-[2vw] lg:min-w-[2vw]">
                        <div className="flex flex-wrap text-sm text-left font-medium w-full truncate overflow-hidden overflow-ellipsis">
                          {item?.picture ? (
                            <Image
                              src={item?.picture}
                              width={8}
                              height={8}
                              className="w-8 rounded-full h-8 mr-2"
                              alt=""
                            />
                          ) : (
                            <>
                              <div
                                style={{
                                  backgroundColor: color?.primaryAccent,
                                  color: color?.btnAccent,
                                }}
                                className="h-8 w-8 rounded-full justify-center items-center flex text-md font-semibold"
                              >
                                {item?.first_name[0] + item?.last_name[0]}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
                        <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                          {item.first_name + " " + item.last_name}
                        </div>
                      </td>
                      <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[10vw] lg:min-w-[10vw]">
                        <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                          {item.title ? item.title : "-"}
                        </div>
                      </td>
                      <td className="h-full truncate items-center mt-2 px-1">
                        <div className="max-w-[3vw] min-w-[3vw] text-sm">
                          {item?.email}
                        </div>
                      </td>
                      <td className="truncate px-1 flex mt-2 items-center lg:max-w-[8vw] lg:min-w-[8vw]">
                        <div className="flex items-center justify-start">
                          <div className="max-w-[8vw] min-w-[8vw] truncate text-sm">
                            {toPrettyDate(item?.created_at)}
                          </div>
                        </div>
                      </td>
                      <td className=" truncate ">
                        <button
                          style={{ color: color?.primaryAccent }}
                          onClick={() => openUserEditModal(item)}
                        >
                          <FontAwesomeIcon
                            icon={faEdit}
                            className="h-4 mb-1 mr-2 cursor-pointer"
                          />
                        </button>
                      </td>
                      <td className=" truncate ">
                        <button
                          style={{ color: color?.primaryAccent }}
                          onClick={() => {
                            setDeleteItem(item);
                            setConfirmDeleteUser(true);
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="h-4 mb-1 mr-2 cursor-pointer"
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
        open={confirmDeleteUser}
        setOpen={setConfirmDeleteUser}
        header="Confirmation"
      >
        <div className="flex flex-col gap-6 mt-4">
          <div className="text-md">
            Are you sure you want to delete this user?
          </div>

          <div className="flex items-center justify-center">
            <div>
              <button
                type="button"
                style={{ color: color.btnAccent }}
                className="disabled:cursor-not-allowed flex justify-center items-center rounded border border-transparent px-4 py-1 text-base font-medium shadow-sm focus:outline-none mt-4  bg-red-500 hover:bg-red-400 disabled:bg-red-200"
                onClick={() => deleteUser(deleteItem.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </Modal>
      <Modal
        overflow={true}
        open={showAddUserModal}
        setOpen={setShowAddUserModal}
        isEdit={isEdit}
        setIsEdit={setIsEdit}
        header={isEdit ? "Update User" : "Add User"}
      >
        <User
          setUsers={setUsers}
          users={users}
          responseErrors={error}
          isEdit={isEdit}
          setIsEdit={setIsEdit}
          setShowAddUserModal={setShowAddUserModal}
          companyid={companyid}
          modal={true}
          showError={showError}
          setShowError={setShowError}
          locations={locations}
          addNewUser={addNewUser}
          userForm={userForm}
          setUserForm={setUserForm}
          color={color}
        />
      </Modal>
      {users?.length === 0 && (
        <div className="flex mx-auto justify-center mt-6">
          <div>No users found.</div>
        </div>
      )}
    </div>
  );
};

export default Users;
