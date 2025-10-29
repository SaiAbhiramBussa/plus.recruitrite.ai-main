import { Menu, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faPeopleGroup,
  faRightFromBracket,
  faUser,
  faUserPlus,
  faShare
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import Modal from "../Modal";
import UploadOffers from "../Job/UploadOffers";
import _ from "lodash";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UploadCandidateProfile from "../UploadCandidateProfile";
import ParsedDataPage from "../ParsedDataPage";
import Loader from "../Loader";
import { colorToRGBA } from "@/src/utils/misc";
import TrainingCandidatesModal from "../TrainingCandidateModal";
import HRUser from "../HRUser";
import { PoweredByModal } from "../StartDateModal";
import NewTemplate from "../ModalTemplate";
interface User {
  id?: any;
  email?: any;
  first_name?: any;
  last_name?: any;
  role?: any;
  location_id?: any;
  reveals_left?: any;
  profile_picture?: any;
}

export default function Usermenu(props: any) {
  const router = useRouter();
  const {
    role,
    isAdmin,
    color,
    customizationsData,
    trainedCandidatesModal,
    setTrainedCandidatesModal,
  } = props;
  const [openModal, setOpenModal] = useState(false);
  const [user, setUser] = useState<User>({});
  const [initials, setInitials] = useState<string>();
  const [profileModal, setProfileModal] = useState<boolean>(false);
  const [parsing, setParsing] = useState<boolean>(false);
  const [openParsingModal, setOpenParsingModal] = useState<boolean>(false);
  const [preview, setPreview] = useState<any>();
  const [parsedData, setParsedData] = useState<any>();
  const [candidateData, setCandidateData] = useState<any>();
  const [loading, setLoading] = useState<boolean>(false);
  const [resumeFile, setResumeFile] = useState<File | undefined | Blob>();
  const [showAddUserModal, setShowAddUserModal] = useState<{ open: boolean; title: string }>({
    open: false,
    title: ''
  });
  const [isShowCreditsModal, setIsShowCreditsModal] = useState(false);
  const [isShowNewJobTemplateModal, setIsShowNewJobTemplateModal] =
  useState({ open: false, title: "Share Credits" });

  useEffect(() => {
    const handleStorageChange = () => {
      if (localStorage.getItem("user")) {
        const localuser: any = localStorage.getItem("user");
        setUser(JSON.parse(localuser));
        setInitials(
          _.get(JSON.parse(localuser), "first_name[0]") +
            _.get(JSON.parse(localuser), "last_name[0]")
        );
      }
    };
    handleStorageChange();
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
    }
  }, []);

  const importJobsHandler = () => {
    setOpenModal(true);
  };

  const uploadCandidateProfile = () => {
    setProfileModal(true);
  };

  const handleShareCredits = () => {
    setIsShowNewJobTemplateModal({
      open: true,
      title: "Share Credits",
    });
    setIsShowCreditsModal(true);
  }

  const handlerLogout = () => {
    axios({
      method: "post",
      url: `${process.env.NEXT_PUBLIC_DOMAIN}/api/users/logout`,
      withCredentials: true,
      headers: {
        Authorization: "token " + document.cookie,
        // document.cookie.split("startdatetoken")[1].split(":")[0].split("=")[1],
      },
    })
      .then((res) => {
        if (props.role === "job-seeker") router.push("/candidates/signin");
        else router.push("/signin");
        localStorage.clear();
        Cookies.remove("userdata");
        Cookies.remove("startdatetoken");
      })
      .catch((err) => {
        if (err?.response) {
          toast.warn("Something went wrong!", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
        }
      });
  };

  const handleTrainingCandidatesModal = () => {
    setTrainedCandidatesModal(true);
  };

  const closeModal = () => {
    setOpenParsingModal(false);
    setProfileModal(false);
  };

  const updateCandidateProfile = async (data: any) => {
    try {
      setLoading(true);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/`,
        data,
        {
          withCredentials: true,
        }
      );

      toast.success("Resume saved successfully! ", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });

      return res;
    } catch (err) {
      toast.error("Something went wrong saving resume!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFiles = async (key: string, file: any = "") => {
    let sendFormData = new FormData();
    sendFormData.set(key, file);

    try {
      setLoading(true);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/${parsedData?.candidate_id}/uploads`,
        sendFormData,
        {
          withCredentials: true,
        }
      );

      toast.success("File Uploaded ", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });

      return res;
    } catch (err) {
      toast.warn(
        "Something went wrong please try again, check resume size it should be less then 2MB if it is a video it should be less than 15MB",
        {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        }
      );
    } finally {
      setLoading(false);
      setResumeFile(undefined);
      closeModal();
    }
  };

  return (
    <div>
      <Menu as="div" className="relative z-10 inline-block text-left">
        <div>
          <Menu.Button className="inline-flex w-full justify-center items-center rounded-md text-sm font-medium text-white">
            {!user?.profile_picture ? (
              <div
                style={{
                  backgroundColor: color?.primaryAccent,
                  color: color?.btnAccent,
                }}
                className="h-10 w-10 rounded-full justify-center items-center flex text-lg font-bold"
              >
                {initials}
              </div>
            ) : (
              <Image
                width={10000}
                height={10000}
                src={user?.profile_picture}
                alt=""
                className="h-10 w-10 mt-1 rounded-full"
              />
            )}
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items
            style={{ backgroundColor: color?.innerBg }}
            className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <div className="px-1 py-1 ">
              {/* <Menu.Item>
                    {({ active }) => (
                        <button
                            className={`${active ? 'bg-violet-500 text-white' : 'text-gray-900'
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="mr-2 w-5 h-5">
                                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                            </svg>
                            Profile
                        </button>
                    )}
                </Menu.Item> 
                <Menu.Item>
                    {({ active }) => (
                        <button
                            className={`${active ? 'bg-violet-500 text-white' : 'text-gray-900'
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="mr-2 w-5 h-5">
                                <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                            </svg>
                            Edit Profile
                        </button>
                    )}
                </Menu.Item>
                <Menu.Item>
                    {({ active }) => (
                        <Link to="/settings"
                            className={`${active ? 'bg-violet-500 text-white' : 'text-gray-900'
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="mr-2 w-5 h-5">
                                <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
                            </svg>

                            Account Settings
                        </Link>
                    )}
                </Menu.Item> */}
              {props.role === 'admin' ? (
  // Admin sees only the Admin Menu
  customizationsData.adminMenu.map((menu: any, index: number) => (
    <Menu.Item key={index}>
      {({ active }) => (
        <Link
          href={menu.linkTo}
          style={
            !active
              ? {
                  backgroundColor: color?.innerBg,
                  color: color?.secondaryAccent,
                }
              : {
                  backgroundColor: colorToRGBA(
                    color?.primaryAccent,
                    color?.opacity
                  ),
                  color: color?.btnAccent,
                }
          }
          className="group flex w-full items-center rounded-md px-2 py-2 text-sm"
          onClick={
            menu.title.includes("Import")
              ? importJobsHandler
              : menu.title.includes("Upload")
              ? uploadCandidateProfile
              : menu.title?.includes("Download Ranked Dataset")
              ? handleTrainingCandidatesModal
              : () => {}
          }
          passHref
        >
          <FontAwesomeIcon icon={menu.icon} className="mr-4 h-4" />
          {menu.title}
        </Link>
      )}
    </Menu.Item>
  ))
) : props.role === 'hiring_manager' ? (
  // Hiring Manager sees only Profile
  <Menu.Item>
    {({ active }) => (
      <Link
        href={
          props.role === "job-seeker"
            ? "/candidates/edit"
            : "/profile/plans/ai_subscription"
        }
        style={
          !active
            ? {
                backgroundColor: color?.innerBg,
                color: color?.secondaryAccent,
              }
            : {
                backgroundColor: colorToRGBA(
                  color?.primaryAccent,
                  color?.opacity
                ),
                color: color?.btnAccent,
              }
        }
        className="group flex w-full items-center rounded-md px-2 py-2 text-sm"
        passHref
      >
        <FontAwesomeIcon icon={faUser} className="mr-4 h-4" />
        Profile
      </Link>
    )}
  </Menu.Item>
) : props.role === 'employer' ? (
  <>
    {/* Profile menu for Employer */}
    <Menu.Item>
      {({ active }) => (
        <Link
          href={
            props.role === "job-seeker"
              ? "/candidates/edit"
              : "/profile/plans/screening_credits"
          }
          style={
            !active
              ? {
                  backgroundColor: color?.innerBg,
                  color: color?.secondaryAccent,
                }
              : {
                  backgroundColor: colorToRGBA(
                    color?.primaryAccent,
                    color?.opacity
                  ),
                  color: color?.btnAccent,
                }
          }
          className="group flex w-full items-center rounded-md px-2 py-2 text-sm"
          passHref
        >
          <FontAwesomeIcon icon={faUser} className="mr-4 h-4" />
          Profile
        </Link>
      )}
    </Menu.Item>

    {/* Add User menu for Employer */}
    <Menu.Item>
      {({ active }) => (
        <button
          onClick={() => setShowAddUserModal({ open: true, title:""})}
          style={
            !active
              ? {
                  backgroundColor: color?.innerBg,
                  color: color?.secondaryAccent,
                }
              : {
                  backgroundColor: colorToRGBA(
                    color?.primaryAccent,
                    color?.opacity
                  ),
                  color: color?.btnAccent,
                }
          }
          className="group flex w-full items-center rounded-md px-2 py-2 text-sm"
        >
          <FontAwesomeIcon icon={faUserPlus} className="mr-4 h-4" />
          Add User
        </button>
      )}
    </Menu.Item>
    <Menu.Item>
      {({ active }) => (
        <button
          onClick={() => handleShareCredits()}
          style={
            !active
              ? {
                  backgroundColor: color?.innerBg,
                  color: color?.secondaryAccent,
                }
              : {
                  backgroundColor: colorToRGBA(
                    color?.primaryAccent,
                    color?.opacity
                  ),
                  color: color?.btnAccent,
                }
          }
          className="group flex w-full items-center rounded-md px-2 py-2 text-sm"
        >
          <FontAwesomeIcon icon={faShare} className="mr-4 h-4" />
          Share Credits
        </button>
      )}
    </Menu.Item>
  </>
) : null}

              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/admin/candidates"
                    style={
                      !active
                        ? {
                            backgroundColor: color?.innerBg,
                            color: color?.secondaryAccent,
                          }
                        : {
                            backgroundColor: colorToRGBA(
                              color?.primaryAccent,
                              color?.opacity
                            ),
                            color: color?.btnAccent,
                          }
                    }
                    className="group flex w-full items-center rounded-md px-2 py-2 text-sm md:hidden"
                    passHref
                  >
                    <FontAwesomeIcon
                      icon={faPeopleGroup}
                      className="mr-4  h-4"
                    />
                    Candidates
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/admin/companies"
                    style={
                      !active
                        ? {
                            backgroundColor: color?.innerBg,
                            color: color?.secondaryAccent,
                          }
                        : {
                            backgroundColor: colorToRGBA(
                              color?.primaryAccent,
                              color?.opacity
                            ),
                            color: color?.btnAccent,
                          }
                    }
                    className="group flex w-full items-center rounded-md px-2 py-2 text-sm md:hidden"
                    passHref
                  >
                    <FontAwesomeIcon icon={faBriefcase} className="mr-4  h-4" />
                    Companies
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/recommended"
                    style={
                      !active
                        ? {
                            backgroundColor: color?.innerBg,
                            color: color?.secondaryAccent,
                          }
                        : {
                            backgroundColor: colorToRGBA(
                              color?.primaryAccent,
                              color?.opacity
                            ),
                            color: color?.btnAccent,
                          }
                    }
                    className="group flex w-full items-center rounded-md px-2 py-2 text-sm md:hidden"
                    passHref
                  >
                    <Image
                      src="/Images/h1-icon.png"
                      width={10000}
                      height={10000}
                      className="w-4 h-4 mr-4 md:w-6 md:h-6"
                      alt=""
                    />
                    Recommended profiles AI
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handlerLogout}
                    style={
                      !active
                        ? {
                            backgroundColor: color?.innerBg,
                            color: color?.secondaryAccent,
                          }
                        : {
                            backgroundColor: colorToRGBA(
                              color?.primaryAccent,
                              color?.opacity
                            ),
                            color: color?.btnAccent,
                          }
                    }
                    className="group flex w-full items-center rounded-md px-2 py-2 text-sm"
                  >
                    <FontAwesomeIcon
                      icon={faRightFromBracket}
                      className="mr-4  h-4"
                    />
                    Sign Out
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
      <div className="absolute top-0 bottom-0 right-0">
        <Modal
          isAdmin={isAdmin}
          open={openModal}
          setOpen={setOpenModal}
          header="Upload Multiple Candidates"
        >
          <UploadOffers
            role="candidate"
            setOpenModal={setOpenModal}
            color={color}
          />
        </Modal>
        <Modal
          isAdmin={isAdmin}
          open={profileModal && !openParsingModal}
          setOpen={setProfileModal}
          header="Upload Candidate Resume"
        >
          <UploadCandidateProfile
            setOpenParsingModal={setOpenParsingModal}
            setParsing={setParsing}
            setProfileModal={setProfileModal}
            setPreview={setPreview}
            setParsedData={setParsedData}
            setLoading={setLoading}
            candidateData={candidateData}
            setCandidateData={setCandidateData}
            updateCandidateProfile={updateCandidateProfile}
            uploadFiles={uploadFiles}
            setResumeFile={setResumeFile}
            resumeFile={resumeFile}
            loading={loading}
            color={color}
          />
        </Modal>
        <Modal
          open={openParsingModal && !profileModal}
          setOpen={setOpenParsingModal}
          section="parseResume"
          header
        >
          {parsing ? (
            <div className="w-full flex-col h-[90vh] flex items-center justify-center">
              <Loader />
              <div>Parsing data...</div>
            </div>
          ) : (
            <div className="w-full align-bottom rounded-lg overflow-auto">
              <ParsedDataPage
                role="admin"
                loadingParsedData={loading}
                setParsing={setParsing}
                closeModal={closeModal}
                data={parsedData}
                previewData={preview}
                parsedData={parsedData}
                candidateData={candidateData}
                uploadFiles={uploadFiles}
                updateCandidateProfile={updateCandidateProfile}
                resumeFile={resumeFile}
                color={color}
              />
            </div>
          )}
        </Modal>
        <Modal
          open={trainedCandidatesModal}
          setOpen={setTrainedCandidatesModal}
          header="Download Ranked Dataset"
        >
          <TrainingCandidatesModal />
        </Modal>
          {showAddUserModal && <HRUser showModal={showAddUserModal} setShowModal={setShowAddUserModal} />}
          { isShowCreditsModal && (
                      <PoweredByModal
                        heading={"Share Credits"}
                        showModal={isShowNewJobTemplateModal}
                        setShowModal={setIsShowNewJobTemplateModal}
                      >
                        <NewTemplate
                          modalState={setIsShowNewJobTemplateModal} 
                          showModal={isShowNewJobTemplateModal} 
                          refresh={() => {}}
                        />
                      </PoweredByModal>
            )}
      </div>
    </div>
  );
}
