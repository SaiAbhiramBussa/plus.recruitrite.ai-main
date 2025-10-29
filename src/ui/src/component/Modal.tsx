import { Fragment, useRef, useEffect, useContext } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import CandidateDetailModal from "./CandidateDetailModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import AppContext from "../context/Context";
import { colorToRGBA } from "../utils/misc";

type Props = {
  open: boolean;
  setOpen(value: boolean): void;
  header: any;
  children: React.ReactNode;
  section?: any;
  isFull?: boolean;
  isAdmin?: boolean;
  expired?: boolean;
  overflow?: boolean;
  isEdit?: boolean;
  setIsEdit?: any;
  type?: any;
  actionButtons?: Array<any>;
  classNames?: string;
};

export default function Modal({
  overflow,
  expired,
  type,
  isAdmin,
  open,
  setOpen,
  header,
  children,
  section,
  isFull = false,
  isEdit,
  setIsEdit,
  actionButtons,
  classNames,
}: Props) {
  const cancelButtonRef = useRef(null);
  const { color } = useContext(AppContext);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className={"absolute z-50"}
        initialFocus={cancelButtonRef}
        onClose={setOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            style={{
              backgroundColor: colorToRGBA(color?.outerBg, color?.opacity),
            }}
            className="fixed inset-0 bg-opacity-75 transition-opacity"
          />
        </Transition.Child>

        <div
          className={`fixed inset-0 z-10 ${overflow ? "overflow-auto" : ""}`}
        >
          <div
            className={`flex items-end mt-10 justify-center p-4 text-center sm:items-center sm:p-0 ${
              section === "companyDetail" ? "mt-16" : ""
            } `}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                style={{ backgroundColor: color?.innerBg }}
                className={`relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all mb-12 ${
                  (section && section === "parseResume") ||
                  section === "candidateDetail"
                    ? "w-5/6 mt-6"
                    : section === "publishModal"
                    ? "md:w-3/5  lg:w-1/2"
                    : section && section === "companyDetail"
                    ? expired
                      ? "w-2/5"
                      : "w-4/6"
                    : isFull
                    ? "w-[70vw] h-[80vh]"
                    : classNames
                    ? classNames
                    : "sm:w-full sm:max-w-3xl"
                } sm:p-4`}
              >
                <div>
                  {section !== "parseResume" ? (
                    <div
                      className={`${
                        type === "alert" ? "hidden" : "flex"
                      }  justify-between rounded border items-center border-transparent pb-1 font-semibold text-xl`}
                    >
                      <span className="px-2 md:px-0 text-sm md:text-lg">
                        {header}
                      </span>
                      <div className="flex ">
                        {actionButtons?.length &&
                          actionButtons?.map((btn, id) => (
                            <button
                              key={id}
                              style={
                                btn.loading
                                  ? {
                                      color: color?.btnAccent,
                                      backgroundColor: color?.outerBg,
                                    }
                                  : {
                                      color: color?.btnAccent,
                                      backgroundColor: color?.primaryAccent,
                                    }
                              }
                              className={`flex justify-end items-center rounded-lg border border-transparent ${
                                btn.loading ? "cursor-not-allowed" : ""
                              } px-6 py-2 mb-1 text-base font-medium  shadow-sm  focus:outline-none mr-2`}
                              onClick={(event) => btn.setEvent(event)}
                              disabled={btn.loading}
                            >
                              {btn.name}
                            </button>
                          ))}
                        <span className="cursor-pointer mt-2">
                          <FontAwesomeIcon
                            icon={faClose}
                            className="h-5 w-5 md:h-6 md:w-6 px-2 md:px-0"
                            onClick={() => setOpen(false)}
                          />
                        </span>
                      </div>
                    </div>
                  ) : (
                    ""
                  )}
                  <hr />
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
