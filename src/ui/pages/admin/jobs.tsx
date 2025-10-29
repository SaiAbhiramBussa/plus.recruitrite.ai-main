import Link from "next/link";
import React, { Key, useContext, useEffect, useState } from "react";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import axios from "axios";
import _ from "lodash";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faUsers,
  faColumns,
  faMagnifyingGlass,
  faSearch,
  faClock,
  faLocationCrosshairs,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "@/src/component/Pagination";
import Loader from "@/src/component/Loader";
import Select from "react-select";
import dynamic from "next/dynamic";
import { colorToRGBA } from "@/src/utils/misc";
import AppContext from "@/src/context/Context";
import { Option } from "@/src/common/common.comp";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

const options: any = [
  { value: "", label: `Show All` },
  { value: "adwerks", label: `Adwerks` },
  { value: "portal", label: `Portal` },
  { value: "ats", label: `ATS` },
];

const remoteType = [
  {
    key: "0",
    value: "Within State",
    option: "state",
  },
  {
    key: "1",
    value: "Within country",
    option: "country",
  },
  {
    key: "2",
    value: "Global",
    option: "any_region",
  },
];

const AdminJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [searchTitle, setSearchTitle] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [items, setItems]: any = useState();
  const [pagingNumber, setPagingNumber] = useState(1);
  const [perPagingNumber, setPerPagingNumber] = useState(50);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(options[0]);
  const { color, customStyles } = useContext(AppContext);

  useEffect(() => {
    const debounce = setTimeout(() => {
      getJobs();
    }, 500);

    return () => clearTimeout(debounce);
  }, [pagingNumber, perPagingNumber, selectedFilter]);

  const getJobs = async () => {
    try {
      setLoading(true);
      let res = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/?page=${pagingNumber}&per_page=${perPagingNumber}&title=${searchTitle}&location=${searchLocation}&source=${selectedFilter.value}`,
        {
          withCredentials: true,
        }
      );
      let data = res.data;
      setItems(data);
      setJobs(data.jobs_data);
      return data;
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event: any) => {
    event.preventDefault();
    getJobs();
  };

  const formatDateNew = (created_at: any) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const date = new Date(created_at);
    const day = date.getDate();
    const month = months[date.getMonth()].substring(0, 3);
    const year = date.getFullYear().toString().substring(2);

    return `${day} ${month}'${year}`;
  };

  const PerPageNumberChange = (perPageNumber: any) => {
    setPerPagingNumber(perPageNumber);
  };

  const PageNumberChange = (pageNumber: any) => {
    setPagingNumber(pageNumber);
  };

  const handleActionSelect = (event: any) => {
    const selectedValue = event.value;
    const selected = options.find((item: any) => item.value === selectedValue);
    setSelectedFilter(selected);
  };

  return (
    <div className="min-h-screen">
      <div className="h-16">
        <DashboardHeader companyName="Admin" section="jobs" />
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
          className="flex flex-col w-full h-full min-h-[89vh] relative my-6 "
        >
          <div className="flex w-full items-center py-2 justify-end">
            <div className="w-full text-lg font-bold px-4 pb-2 cursor-pointer">
              Job Postings
            </div>
            <Select
              defaultValue={selectedFilter}
              options={options}
              value={selectedFilter}
              onChange={handleActionSelect}
              placeholder={selectedFilter}
              components={{ Option }}
              className="md:mt-0 text-sm flex justify-end md:block mr-4 w-96 font-normal"
              styles={customStyles}
            />

            <div
              style={{ borderColor: color?.outerBg }}
              className="flex gap-3 items-center border mr-4 rounded"
            >
              <FontAwesomeIcon
                icon={faSearch}
                style={{ borderColor: color?.outerBg }}
                className="px-3 border-r"
              />
              <input
                type="text"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="text-sm w-32 md:mr-4 py-2 pr-3 rounded border-0 focus:outline-none focus:border-0"
                placeholder="Title"
                onKeyDown={(e: any) => {
                  if (e.keyCode === 13) handleSearch(e);
                }}
              />
            </div>
            <div
              style={{ borderColor: color?.outerBg }}
              className="flex gap-3 items-center border mr-4 rounded"
            >
              <FontAwesomeIcon
                icon={faSearch}
                style={{ borderColor: color?.outerBg }}
                className="px-3 border-r"
              />
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="text-sm w-32 md:mr-4 py-2 pr-3 rounded border-0 focus:outline-none focus:border-0"
                placeholder="Location"
                onKeyDown={(e: any) => {
                  if (e.keyCode === 13) handleSearch(e);
                }}
              />
            </div>
            <ButtonWrapper
              onClick={handleSearch}
              classNames="flex items-center justify-center rounded border border-transparent px-5 py-2 text-sm font-medium shadow-sm focus:outline-none mr-4"
            >
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="mr-1 cursor-pointer"
              />
              <span className="mx-1 hidden lg:block">Search</span>
            </ButtonWrapper>
          </div>
          {loading ? (
            <div className="h-[60vh] flex justify-center items-center">
              <Loader />
            </div>
          ) : (
            <div className="px-2">
              {jobs &&
                jobs.map((job: any, key: any) => (
                  <div
                    key={key}
                    className={`grid grid-cols-12 items-center w-full h-14 justify-between p-1 border-b min-w-[800px]`}
                  >
                    <div className="col-span-2 flex flex-col p-2 truncate">
                      <Link
                        href={`/admin/company/${job.company_id}/job_posting/${job.id}/job-info`}
                        passHref
                      >
                        <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                          {job.title}
                        </div>
                      </Link>
                    </div>
                    <div className="col-span-1 xl:col-span-2 flex flex-col p-2 truncate">
                      <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                        {job.company_name}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon
                        icon={faLocationCrosshairs}
                        style={{
                          color: colorToRGBA(
                            color?.primaryAccent,
                            color?.opacity
                          ),
                        }}
                        className="mr-1"
                      />
                      <div className="max-w-[5vw] min-w-[5vw] truncate text-sm">
                        {job.city ? job.city + ", " : ""}
                        {job.state ? job.state : ""}
                        {job.country ? ", " + job.country : ""}
                      </div>
                    </div>
                    <div className="flex justify-start items-center text-left">
                      <FontAwesomeIcon
                        icon={faClock}
                        style={{
                          color: colorToRGBA(
                            color?.primaryAccent,
                            color?.opacity
                          ),
                        }}
                        className="mr-1"
                      />
                      <div className="w-32 truncate text-sm lowercase">
                        {job.work_location_type}
                        {job.work_location_type === "remote" &&
                          `(${
                            remoteType.find(
                              (type: any) => type.option === job.remote_type
                            )?.value
                          })`}
                      </div>
                    </div>
                    <div className="ml-3 col-span-2 xl:col-span-1 text-sm">
                      $
                      {Math.abs(job.compensation) > 999
                        ? Math.sign(job.compensation) *
                            Number(
                              (Math.abs(job.compensation) / 1000).toFixed(1)
                            ) +
                          "k"
                        : Math.sign(job.compensation) *
                          Math.abs(job.compensation)}{" "}
                      / year
                    </div>
                    <div className="flex justify-center">
                      <div
                        style={{
                          backgroundColor: colorToRGBA(
                            color?.primaryAccent,
                            0.2
                          ),
                          color: color?.primaryAccent,
                        }}
                        className="flex items-center justify-center p-2 h-7 rounded-xl text-xs"
                      >
                        {job.source}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-end -space-x-2 overflow-hidden">
                      {job &&
                        job.top_profile_pictures?.map(
                          (picture: any, index: Key) => (
                            <img
                              key={index}
                              className="inline-block h-7 w-7 xl:h-8 xl:w-8 rounded-full ring-2"
                              src={picture}
                              alt=""
                            />
                          )
                        )}
                    </div>
                    <div className="col-span-2 font-thin flex justify-center">
                      <div className="w-100 text-sm">
                        Posted on{" "}
                        <span className="font-normal">
                          {formatDateNew(job.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full flex justify-end pr-1">
                      {job.subscription_type === "full_service" ? (
                        <Link
                          href={`/company/${job.company_id}/kanban/${job.id}`}
                          style={{
                            backgroundColor: colorToRGBA(
                              color?.primaryAccent,
                              0.2
                            ),
                            color: color?.primaryAccent,
                          }}
                          className="cursor-pointer mr-2 col-span-1 flex items-center justify-center hover:opacity-75 h-8 w-8"
                          passHref
                        >
                          <FontAwesomeIcon
                            icon={faColumns}
                            className="h-4 w-4 cursor-pointer"
                          />
                        </Link>
                      ) : (
                        <Link
                          href={`/job/detail/${job.id}`}
                          style={{
                            backgroundColor: colorToRGBA(
                              color?.primaryAccent,
                              0.2
                            ),
                            color: color?.primaryAccent,
                          }}
                          className="cursor-pointer mr-2 col-span-1 flex items-center justify-center hover:opacity-75 h-8 w-8"
                          passHref
                        >
                          <FontAwesomeIcon
                            icon={faUsers}
                            className="h-4 w-4 cursor-pointer"
                          />
                        </Link>
                      )}
                      <Link
                        href={`/job/${job.id}`}
                        style={{
                          backgroundColor: colorToRGBA(
                            color?.primaryAccent,
                            0.2
                          ),
                          color: color?.primaryAccent,
                        }}
                        className="cursor-pointer col-span-1 flex items-center justify-center hover:opacity-75 h-8 w-8"
                        passHref
                      >
                        <FontAwesomeIcon
                          icon={faPen}
                          className="h-4 w-4 cursor-pointer"
                        />
                      </Link>
                    </div>
                  </div>
                ))}
              {!jobs.length && (
                <div
                  style={{ color: color?.primaryAccent }}
                  className="h-[80vh] flex items-center justify-center font-bold"
                >
                  No jobs found
                </div>
              )}
            </div>
          )}
          {!loading && items?.jobs_data?.length > 0 && (
            <div className="mt-4">
              <Pagination
                setCurrentPage={items?.current_page}
                totalItems={items?.total_count}
                currentPage={items?.current_page}
                itemsPerPage={items?.per_page}
                totalPages={items?.total_pages}
                PageNumberChange={PageNumberChange}
                PerPageNumberChange={PerPageNumberChange}
                setPerPagingNumber={setPerPagingNumber}
                perPagingNumber={perPagingNumber}
                setPageNumber={setPagingNumber}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminJobs;