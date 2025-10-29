import React, { useContext, useEffect, useState } from "react";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import axios from "axios";
import _ from "lodash";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import Loader from "@/src/component/Loader";
import Modal from "@/src/component/Modal";
import TextInput from "@/src/component/TextInput";
import AppContext from "@/src/context/Context";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});
import { colorToRGBA } from "@/src/utils/misc";
import Pagination from "@/src/component/Pagination";

const IndustriesDashboard = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [industries, setIndustries] = useState<any>([]);
  const [industry, setIndustry] = useState<any>({
    id: "",
    title: "",
  });
  const [confirmDeleteIndustry, setConfirmDeleteIndustry] =
    useState<boolean>(false);
  const [confirmEditIndustry, setConfirmEditIndustry] =
    useState<boolean>(false);
  const [newIndustry, setNewIndustry] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const { color } = useContext(AppContext);
  const [pagingNumber, setPagingNumber] = useState<number>(1);
  const [perPagingNumber, setPerPagingNumber] = useState<number>(50);

  useEffect(() => {
    const debounce = setTimeout(() => {
      getIndustries();
    }, 500);

    return () => clearTimeout(debounce);
  }, [pagingNumber, perPagingNumber]);

  useEffect(() => {
    if (newIndustry) {
      setIndustry({
        id: "",
        title: "",
      });
    }
  }, [newIndustry]);

  const getIndustries = async () => {
    try {
      setLoading(true);
      let res = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/industries?page=${pagingNumber}&per_page=${perPagingNumber}`,
        {
          withCredentials: true,
        }
      );
      let data = res.data;

      setIndustries(data);
      return data;
    } catch (err: any) {
      toast.error(err?.response?.data?.Error, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const createIndustry = async () => {
    if (industry?.title == "") {
      setError("Industry Name is required");
    } else {
      try {
        let res = await axios.post(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/industries`,
          {
            title: industry?.title,
          },
          { withCredentials: true }
        );
        if (res.status === 200) {
          getIndustries();
          toast.success("Industry created", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.Error, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
      setConfirmEditIndustry(false);
    }
  };

  const deleteIndustry = async () => {
    try {
      let res = await axios.delete(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/industries?industry_id=${industry?.id}`,
        { withCredentials: true }
      );
      if (res.status === 200) {
        getIndustries();
        toast.success("Industry Deleted", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
      setConfirmDeleteIndustry(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.Error, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
      setConfirmDeleteIndustry(false);
    }
  };

  const editIndustry = async () => {
    if (industry?.title == "") {
      setError("Industry Name is required");
    } else {
      try {
        let res = await axios.put(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/industries`,
          {
            industry_id: industry?.id,
            title: industry?.title,
          },
          { withCredentials: true }
        );
        if (res.status === 200) {
          setIndustries((prevIndustries: any) => ({
            ...prevIndustries,
            data: prevIndustries?.data?.map((i: any) => {
              if (i.id === industry.id) {
                return {
                  ...i,
                  title: industry.title,
                };
              }
              return i;
            }),
          }));

          toast.success("Updated Industry Name", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
        }
        setConfirmEditIndustry(false);
      } catch (err: any) {
        toast.error(err?.response?.data?.Error, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
    }
  };

  const PageNumberChange = (pageNumber: number) => {
    setPagingNumber(pageNumber);
  };

  const PerPageNumberChange = (perPageNumber: number) => {
    setPerPagingNumber(perPageNumber);
  };

  return (
    <div className="min-h-screen">
      <div className="h-16">
        <DashboardHeader companyName="Admin" />
      </div>

      <div
        style={{
          backgroundColor: color?.outerBg,
          color: color?.secondaryAccent,
        }}
        className="flex flex-col w-full grow min-h-full px-6"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="flex flex-col w-full h-full min-h-[89vh] relative my-6 rounded-md"
        >
          <div className="flex w-full justify-between items-center px-5 pt-3">
            <div className="w-full text-lg font-bold cursor-pointer">
              Industries
            </div>
            <ButtonWrapper
              onClick={() => {
                setNewIndustry(true);
                setConfirmEditIndustry(true);
                setIndustry({
                  id: "",
                  title: "",
                });
              }}
              classNames="flex items-center justify-center rounded-md gap-2 border border-transparent px-5 py-2 text-sm font-medium shadow-sm focus:outline-none"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span className="hidden lg:block">Create</span>
            </ButtonWrapper>
          </div>
          {loading ? (
            <div className="h-[60vh] flex justify-center items-center">
              <Loader />
            </div>
          ) : industries?.data?.length ? (
            <div className="flex justify-between flex-col flex-1">
              <div className="grid grid-cols-12 gap-7 m-8">
                {industries.data.map((industry: any) => (
                  <div
                    key={industry.id}
                    style={{ backgroundColor: color?.innerBg }}
                    className="col-span-12 hover:shadow-lg md:col-span-6 lg:col-span-4 flex flex-row max-w-md px-3 py-1.5 items-center rounded-md shadow-md"
                  >
                    <div className="p-2 text-md text-left font-semibold w-full break-all">
                      {industry.title}
                    </div>
                    <div className="flex gap-3">
                      <button
                        style={{
                          backgroundColor: colorToRGBA(
                            color?.primaryAccent,
                            0.15
                          ),
                          color: color?.primaryAccent,
                        }}
                        className="cursor-pointer flex items-center justify-center px-3 py-2 rounded-md"
                        onClick={() => {
                          setNewIndustry(false),
                            setConfirmEditIndustry(true),
                            setIndustry(industry);
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        style={{
                          backgroundColor: colorToRGBA(
                            color?.primaryAccent,
                            0.15
                          ),
                          color: color?.primaryAccent,
                        }}
                        className="cursor-pointer flex items-center justify-center px-3 py-2 rounded-md"
                        onClick={() => {
                          setNewIndustry(false),
                            setConfirmDeleteIndustry(true),
                            setIndustry(industry);
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                totalPages={industries.total_pages}
                totalItems={industries.total_count}
                currentPage={industries.current_page}
                itemsPerPage={industries.per_page}
                PageNumberChange={PageNumberChange}
                PerPageNumberChange={PerPageNumberChange}
                setPerPagingNumber={setPerPagingNumber}
                perPagingNumber={perPagingNumber}
                setPageNumber={setPagingNumber}
                setCurrentPage={industries.current_page}
              />
            </div>
          ) : (
            <div
              style={{ color: color?.primaryAccent }}
              className="h-[80vh] flex items-center justify-center font-bold"
            >
              No Industries found
            </div>
          )}
          <Modal
            open={confirmDeleteIndustry}
            setOpen={setConfirmDeleteIndustry}
            header="Confirmation"
          >
            <div className="flex flex-col gap-6 mt-4">
              <div className="text-md">
                Are you sure you want to delete this industry?
              </div>

              <div className="flex items-center justify-end">
                <div className="ml-4">
                  <button
                    type="button"
                    style={{ color: color?.btnAccent }}
                    className="disabled:cursor-not-allowed flex justify-center items-center rounded border border-transparent px-4 py-1 text-base font-medium shadow-sm focus:outline-none mt-4  bg-red-500 hover:bg-red-400 disabled:bg-red-200"
                    onClick={() => deleteIndustry()}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </Modal>
          <Modal
            open={confirmEditIndustry}
            setOpen={setConfirmEditIndustry}
            header={newIndustry ? "Create Industry" : "Edit Industry"}
          >
            <div className="flex flex-col mt-4">
              <div className="text-md">
                Please enter the industry name below:
              </div>
              <div>
                <TextInput
                  label=""
                  section="advance_search"
                  value={industry?.title}
                  placeholder={"Industry Name"}
                  onChange={(e) => {
                    setError("");
                    setIndustry({
                      ...industry,
                      title: e.target.value,
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      newIndustry ? createIndustry() : editIndustry();
                    }
                  }}
                  error={error}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-end">
                <div className="ml-4">
                  <ButtonWrapper
                    classNames="flex justify-center items-center rounded border border-transparent px-4 py-1 text-base font-medium shadow-sm focus:outline-none mt-4"
                    onClick={() =>
                      newIndustry ? createIndustry() : editIndustry()
                    }
                  >
                    Submit
                  </ButtonWrapper>
                </div>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default IndustriesDashboard;
