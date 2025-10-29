import _ from "lodash";
import { ToastContainer, toast } from "react-toastify";
import { Key, useEffect, useState } from "react";
import axios from "axios";
import Loader from "./Loader";
import UserCard from "./UserCard";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

export default function AdwerkModal(props: any) {
  const { companyid, jobid, setShowAdwerkModal, color } = props;
  const [loading, setLoading] = useState<any>();
  const [users, setUsers] = useState<any>();
  const [selectedUsers, setSelectedUsers] = useState<any>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    companyid && fetchUsers();
  }, [companyid]);

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

  const pushUsersToAdwerk = async () => {
    try {
      setLoading(true);
      let res: any = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/adwerks/adwerks_manual/${jobid}`,
        { user_list: selectedUsers },
        {
          withCredentials: true,
        }
      );
      if (res) {
        toast.success(res.data?.Message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.Error, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setShowAdwerkModal(false);
    }
  };

  const handleCheckboxChange = (userId: any, isChecked: any) => {
    appendCandidates(userId, isChecked);
  };

  const appendCandidates = (userId: any, isChecked: boolean) => {
    let newSelectedUsers = [];
    if (isChecked) {
      newSelectedUsers = [...selectedUsers, userId];
    } else {
      newSelectedUsers = selectedUsers.filter((id: any) => id !== userId);
    }
    setSelectedUsers(newSelectedUsers);
  };

  const handleSelectAll = (event: any) => {
    if (!selectAll) {
      setSelectedUsers((prevState: any) => {
        let usersList = [...prevState];
        users.map((item: any) => {
          usersList.push(item.id);
        });
        usersList = Array.from(new Set(usersList));
        return usersList;
      });
    } else {
      setSelectedUsers([]);
    }
    setSelectAll(!selectAll);
  };

  return (
    <div className="h-[77vh] md:h-auto overflow-y-auto">
      <div className="w-full pb-4">
        <div className="w-full h-[35vh] overflow-x-hidden mt-4 mr-4 col-span-12 md:col-span-7">
          {users && (
            <div className=" flex items-center mb-4">
              <input
                type="checkbox"
                className="h-3 w-3 lg:ml-4 mr-1 xl:mr-2"
                checked={selectAll}
                onChange={handleSelectAll}
              />
              <div className="text-sm font-semibold">Select All</div>
            </div>
          )}
          {!users && loading && (
            <div className="w-full h-full flex-col flex items-center justify-center">
              <Loader />
              <div className="text-sm">Fetching users...</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {users &&
              users.map((user: any, index: Key) => (
                <UserCard
                  key={index}
                  user={user}
                  selectedUsers={selectedUsers}
                  handleCheckboxChange={handleCheckboxChange}
                  color={color}
                />
              ))}
          </div>
        </div>
      </div>
      <div className="justify-end gap-2 bottom-0 flex items-center">
        <div>
          <ButtonWrapper
            classNames="flex justify-center items-center rounded-md border border-transparent px-5 py-2 text-base font-medium shadow-sm focus:outline-none mt-4"
            onClick={pushUsersToAdwerk}
            disabled={!selectedUsers.length || loading}
          >
            {loading && selectedUsers.length ? "Sending..." : "Send"}
          </ButtonWrapper>
        </div>
      </div>
    </div>
  );
}
