import AuthGuard from "@/src/component/AuthGuard";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import Loader from "@/src/component/Loader";
import Modal from "@/src/component/Modal";
import AddJobTemplate from "@/src/component/jobtemplate/AddJobTemplate";
import AppContext from "@/src/context/Context";
import { colorToRGBA } from "@/src/utils/misc";
import {
  faAdd,
  faEye,
  faPen,
  faSearch,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import _ from "lodash";
import { NextPage } from "next";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Pagination from "@/src/component/Pagination";
import Select from "react-select";
import { Option } from "@/src/common/common.comp";

function removeHtmlTags(inputString: string): string {
  return inputString?.replace(/<[^>]*>/g, " ");
}

const JobTemplate: NextPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isTemplateDelete, setIsTemplateDelete] = useState<boolean>(false);
  const [isEditMode, setEditMode] = useState<boolean>(false);
  const [jobTemplates, setJobTemplates] = useState<any>();
  const [selectJobTemplate, setSelectedJobTemplate] = useState<any>();
  const [industries, setIndustries] = useState<any>([]);
  const { color, customStyles } = useContext(AppContext);
  const [pagingNumber, setPagingNumber] = useState<number>(1);
  const [perPagingNumber, setPerPagingNumber] = useState<number>(50);
  const [isViewMode, setIsViewMode] = useState<boolean>(false);
  const [searchTemplate, setSearchTemplate] = useState<string>("");
  const options: any = [
    { value: "all", label: `Show All` },
    { value: "admin", label: `Admin` },
    { value: "user", label: `User` },
  ];
  const [selectedFilter, setSelectedFilter] = useState<any>(options[0]);

  useEffect(() => {
    getIndustries();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      getAllJobTemplate();
    }, 500);

    return () => clearTimeout(debounce);
  }, [pagingNumber, perPagingNumber, selectedFilter]);

  const openJobTemplateModal = (isEditable = false): void => {
    setIsModalOpen(true);
    if (isEditable) {
      setEditMode(true);
    } else {
      setEditMode(false);
    }
  };

  const getAllJobTemplate = async () => {
    setIsLoading(true);
    await axios
      .get(
        `${
          process.env.NEXT_PUBLIC_DOMAIN
        }/api/jobs/jobposting_templates?page=${pagingNumber}&per_page=${perPagingNumber}&filter=${
          selectedFilter.value
        }${searchTemplate ? `&title=${searchTemplate}` : ""}`,
        {
          withCredentials: true,
        }
      )
      .then((response) => {
        setIsLoading(false);

        response.data.data = _.map(response.data.data, (data) => {
          data["job_title"] = data.title;
          return data;
        });

        setJobTemplates(response.data);
      })
      .catch((err) => {
        toast.error(err?.message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
      });
  };

  const deleteJobTemplate = async (id: string) => {
    setIsTemplateDelete(true);
    await axios
      .delete(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/jobposting_templates?template_id=${id}`,
        {
          withCredentials: true,
        }
      )
      .then(() => {
        toast.success("Job Template Deleted", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
        getAllJobTemplate();
      })
      .catch((err: any) => {
        toast.error(err?.message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
      })
      .finally(() => {
        setIsDeleteModalOpen(false);
        setIsTemplateDelete(false);
      });
  };

  const getIndustries = async () => {
    try {
      setIsLoading(true);
      let res = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/industries`,
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
      setIsLoading(false);
    }
  };

  const PageNumberChange = (pageNumber: number) => {
    setPagingNumber(pageNumber);
  };

  const PerPageNumberChange = (perPageNumber: number) => {
    setPerPagingNumber(perPageNumber);
  };

  const handleActionSelect = (event: any) => {
    const option = options.find((option: any) => option.value === event.value);
    setSelectedFilter(option);
  };

  return (
    <div className="min-h-screen">
      <div className="h-16">
        <DashboardHeader companyName="Admin" section="Job Template" />
      </div>

      <div
        style={{
          backgroundColor: color?.outerBg,
          color: color?.secondaryAccent,
        }}
        className="flex flex-col w-full grow min-h-full p-6"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="flex flex-col w-full h-full min-h-[89vh] relative rounded-md"
        >
          <div className="w-full text-lg font-bold flex justify-between p-3 items-center">
            Job Templates
            <div className="flex items-center font-medium gap-2">
              <Select
                defaultValue={selectedFilter.label}
                options={options}
                value={selectedFilter.label}
                onChange={handleActionSelect}
                placeholder={selectedFilter.label}
                components={{ Option }}
                className="md:mt-0 text-sm flex justify-end md:block mr-4 w-52 font-normal"
                styles={customStyles}
              />
              <div
                style={{ borderColor: color?.outerBg }}
                className="flex gap-3 items-center border mr-4 rounded"
              >
                <FontAwesomeIcon
                  icon={faSearch}
                  style={{ borderColor: color?.outerBg }}
                  className="px-3 text-sm border-r"
                />
                <input
                  type="text"
                  value={searchTemplate}
                  onChange={(e) => setSearchTemplate(e.target.value)}
                  className="text-sm w-44 md:mr-4 py-2 pr-3 rounded border-0 focus:outline-none focus:border-0"
                  placeholder="Location"
                  onKeyDown={(e: any) => {
                    if (e.keyCode === 13) getAllJobTemplate();
                  }}
                />
              </div>
              <ButtonWrapper
                classNames="flex items-center gap-2 justify-center rounded border border-transparent px-5 py-2 text-sm font-medium shadow-sm focus:outline-none"
                onClick={() => {
                  openJobTemplateModal(false);
                  setEditMode(false);
                }}
              >
                <FontAwesomeIcon icon={faAdd} />
                <span className="hidden lg:block">Add Job Template</span>
              </ButtonWrapper>
            </div>
          </div>
          {isLoading ? (
            <div className="h-[60vh] flex justify-center items-center">
              <Loader />
            </div>
          ) : (
            <div className="px-2 flex flex-col">
              <div
                style={{ backgroundColor: colorToRGBA(color?.outerBg, 0.3) }}
                className={`grid grid-cols-12 items-center w-full justify-between px-2.5 py-2 border-b rounded-t-md`}
              >
                <div className="col-span-2 flex-col truncate font-medium text-base">
                  Industry
                </div>
                <div className="col-span-2 flex-col truncate font-medium text-base">
                  Title
                </div>
                <div className="col-span-3 flex-col truncate font-medium text-base">
                  Skill
                </div>
                <div className="col-span-2 flex-col truncate font-medium text-base">
                  Description
                </div>
                <div className="col-span-1 flex-col truncate font-medium text-base text-center">
                  Created on
                </div>
                <div className="col-span-2 text-center flex-col truncate font-medium text-base">
                  Actions
                </div>
              </div>
              {jobTemplates?.data?.length ? (
                <>
                  <div className="flex-1 min-h-[calc(100vh-300px)]">
                    {jobTemplates.data.map((job: any, key: any) => (
                      <div
                        key={key}
                        className={`grid grid-cols-12 items-center text-sm w-full justify-between p-1 border-b min-w-[800px]`}
                      >
                        <div className="col-span-2 flex flex-col p-2 truncate">
                          <div className="flex flex-wrap text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                            {_.find(industries, ["id", job.industry_id]).title}
                          </div>
                        </div>
                        <div className="col-span-2 flex flex-col p-2 truncate">
                          <div className="flex flex-wrap text-sm text-left w-full truncate overflow-hidden overflow-ellipsis">
                            {job.title}
                          </div>
                        </div>
                        <div className="col-span-3 py-2">
                          {job.skill?.split(" ").slice(0, 3)?.join(" ")}
                          {job.skill?.split(" ").length > 3 ? "..." : null}
                        </div>
                        <div className="col-span-2 py-2">
                          {removeHtmlTags(job.description)
                            ?.split(" ")
                            .slice(0, 4)
                            .join(" ")}
                          {job.description?.split(" ").length > 4
                            ? "..."
                            : null}
                        </div>
                        <div className="col-span-1 text-xs text-center">
                          {new Date(job.created_at).toLocaleDateString("en-US")}
                        </div>
                        <div className="col-span-2 flex gap-2 justify-center w-full">
                          <ButtonWrapper
                            style={{
                              backgroundColor: colorToRGBA(
                                color?.primaryAccent,
                                0.15
                              ),
                              color: color?.primaryAccent,
                            }}
                            classNames="cursor-pointer flex items-center justify-center hover:opacity-75 px-3 py-2 rounded-md"
                            onClick={() => {
                              setIsViewMode(true);
                              setSelectedJobTemplate(job);
                            }}
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </ButtonWrapper>
                          <ButtonWrapper
                            style={{
                              backgroundColor: colorToRGBA(
                                color?.primaryAccent,
                                0.15
                              ),
                              color: color?.primaryAccent,
                            }}
                            classNames="cursor-pointer flex items-center justify-center hover:opacity-75 px-3 py-2 rounded-md"
                            onClick={() => {
                              openJobTemplateModal(true);
                              const industry = industries.find(
                                (industry: any) =>
                                  industry.id === job.industry_id
                              );
                              setSelectedJobTemplate({
                                ...job,
                                industry: {
                                  value: industry.title,
                                  label: industry.id,
                                },
                              });
                            }}
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </ButtonWrapper>
                          <ButtonWrapper
                            style={{
                              backgroundColor: colorToRGBA(
                                color?.primaryAccent,
                                0.15
                              ),
                              color: color?.primaryAccent,
                            }}
                            classNames="cursor-pointer flex items-center justify-center px-3 py-2 rounded-md"
                            onClick={() => {
                              setSelectedJobTemplate(job);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </ButtonWrapper>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination
                    totalPages={jobTemplates.total_pages}
                    totalItems={jobTemplates.total_count}
                    currentPage={jobTemplates.current_page}
                    itemsPerPage={jobTemplates.per_page}
                    PageNumberChange={PageNumberChange}
                    PerPageNumberChange={PerPageNumberChange}
                    setPerPagingNumber={setPerPagingNumber}
                    perPagingNumber={perPagingNumber}
                    setPageNumber={setPagingNumber}
                    setCurrentPage={jobTemplates.current_page}
                  />
                </>
              ) : (
                <div className="h-[80vh] flex items-center justify-center font-bold">
                  No job templates found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Modal
        open={isModalOpen}
        setOpen={setIsModalOpen}
        header={`${isEditMode ? "Update" : "New"} Job Template`}
        section="New Job Template"
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="w-full align-bottom rounded-lg"
        >
          <AddJobTemplate
            modalState={setIsModalOpen}
            getAllJob={getAllJobTemplate}
            jobTemplateData={selectJobTemplate}
            isEdit={isEditMode}
            industriesData={industries}
          />
        </div>
      </Modal>
      <Modal
        open={isViewMode}
        setOpen={setIsViewMode}
        header={selectJobTemplate?.title}
        section={selectJobTemplate?.title}
      >
        <div
          style={{ backgroundColor: color?.innerBg }}
          className="w-full align-bottom rounded-lg max-h-[70vh] overflow-y-auto flex flex-col gap-4 py-4 px-1"
        >
          <div className="flex flex-col gap-2">
            <span className="font-medium">Industry: </span>
            <span className="text-sm">
              {
                _.find(industries, ["id", selectJobTemplate?.industry_id])
                  ?.title
              }
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium">Skills:</span>
            <span className="text-sm">{selectJobTemplate?.skill}</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium">Description:</span>
            <span className="text-sm">
              {removeHtmlTags(selectJobTemplate?.description)}
            </span>
          </div>
        </div>
      </Modal>
      <Modal
        open={isDeleteModalOpen}
        setOpen={setIsDeleteModalOpen}
        header="Confirmation"
        section="Confirmation"
      >
        <div className="flex flex-col gap-6 mt-4">
          <div className="text-md">
            Are you sure you want to delete this job template?
          </div>
          <div className="flex items-center justify-end">
            <div>
              <button
                style={{ color: color?.btnAccent }}
                onClick={() => deleteJobTemplate(selectJobTemplate.id)}
                disabled={isTemplateDelete}
                className="disabled:cursor-not-allowed flex justify-center items-center rounded-md border border-transparent bg-red-500 px-5 py-2 text-sm font-medium shadow-sm hover:bg-red-700 disabled:bg-red-400 focus:outline-none mt-4"
              >
                <FontAwesomeIcon
                  icon={faTrash}
                  className="h-4 mr-1 cursor-pointer"
                />
                <span className="mx-1 hidden lg:block">Delete</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AuthGuard(JobTemplate);
