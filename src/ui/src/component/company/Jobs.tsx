import {
  faColumns,
  faEdit,
  faPlus,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loader from "../Loader";

const Jobs = (props: any) => {
  const router = useRouter();

  const { companyid, color } = props;

  const [jobs, setJobs] = useState<any>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    companyid && fetchJobs();
  }, [companyid]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyid}/job_posting`,

        {
          withCredentials: true,
        }
      );
      if (response.status === 200) {
        setJobs(response.data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

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
          <p className="ml-3 font-semibold">Jobs</p>
        </div>
        <button
          style={{ color: color?.primaryAccent }}
          onClick={() => {
            router.push(`/admin/companies/${companyid}/job/create`);
            // direct to create hiv page
            // setJob({});
            // setError("");
            // setShowAddIntegrationModal(true);
          }}
          className="flex items-center justify-center rounded border border-transparent px-2 py-1 text-sm font-medium shadow-sm focus:outline-none"
        >
          <FontAwesomeIcon icon={faPlus} className="h-4 cursor-pointer" />
        </button>
      </div>

      <div className="table w-full">
        <div className="">
          {loading ? (
            <div className="h-[50vh] flex justify-center items-center">
              <Loader />
            </div>
          ) : (
            <table
              style={{ color: color?.secondaryAccent }}
              className="table-auto w-full"
            >
              <thead
                style={{ backgroundColor: color?.innerBg }}
                className="sticky top-0 border-b"
              >
                <tr>
                  <th className="w-3/12 py-4 text-left">Title</th>
                  <th className="w-3/12 text-left">Location</th>
                  <th className="w-3/12 py-4 text-left">Work location</th>
                  <th className="w-3/12 py-4 text-left pl-2">Compensation</th>
                </tr>
              </thead>
              {jobs && (
                <tbody className="h-10 min-h-full overflow-auto">
                  {jobs?.length &&
                    jobs.map((item: any, key: any) => {
                      return (
                        <tr
                          key={key}
                          className="h-12 items-center table-row w-full border-b"
                        >
                          <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
                            <Link
                              href={`/admin/company/${companyid}/job_posting/${item.id}/pre-screening`}
                              className=""
                              passHref
                            >
                              <div
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.color =
                                    color?.primaryAccent)
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.color =
                                    color?.secondaryAccent)
                                }
                                className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis"
                              >
                                {item.title ? item.title : "-"}
                              </div>
                            </Link>
                          </td>
                          <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
                            <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                              {item.state ? item.state : "-"}
                            </div>
                          </td>
                          <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
                            <div className="flex flex-wrap text-sm text-left font-semibold w-full truncate overflow-hidden overflow-ellipsis">
                              {item.work_location_type
                                ? item.work_location_type
                                : "-"}
                            </div>
                          </td>
                          <td className="truncate px-1 text-xs lg:text-sm lg:max-w-[16vw] lg:min-w-[16vw]">
                            <div className="font-semibold ml-4 text-sm">
                              <span className="max-w-[4vw] min-w-[4vw] text-sm">
                                {" "}
                                {Math.abs(item.compensation) > 999
                                  ? Math.sign(item.compensation) *
                                      Number(
                                        (
                                          Math.abs(item.compensation) / 1000
                                        ).toFixed(1)
                                      ) +
                                    "k"
                                  : Math.sign(item.compensation) *
                                    Math.abs(item.compensation)}{" "}
                              </span>
                              USD / year
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center">
                              {item.subscription_type !== "full_service" && (
                                <Link
                                  href={`/job/detail/${item.id}`}
                                  style={{ color: color?.primaryAccent }}
                                  className="cursor-pointer mr-1 col-span-1 flex items-center justify-center h-4 w-4"
                                  passHref
                                >
                                  <FontAwesomeIcon
                                    icon={faUsers}
                                    className="h-4 w-4 cursor-pointer"
                                  />
                                </Link>
                              )}
                              {item.subscription_type === "full_service" && (
                                <Link
                                  href={`/company/${item.company_id}/kanban/${item.id}`}
                                  style={{ color: color?.primaryAccent }}
                                  className="cursor-pointer mr-1 col-span-1 flex items-center justify-center h-4 w-4"
                                  passHref
                                >
                                  <FontAwesomeIcon
                                    icon={faColumns}
                                    className="h-4 w-4 cursor-pointer"
                                  />
                                </Link>
                              )}
                              <Link
                                href={`/job/${item.id}`}
                                style={{ color: color?.primaryAccent }}
                                className="cursor-pointer col-span-1 flex items-center justify-center h-8 w-8"
                                passHref
                              >
                                <FontAwesomeIcon
                                  icon={faEdit}
                                  className="h-4 mr-1 cursor-pointer"
                                />
                              </Link>
                            </div>
                          </td>
                          <td></td>
                        </tr>
                      );
                    })}
                </tbody>
              )}
            </table>
          )}
          {!jobs?.length && (
            <div className="flex justify-center mt-6">
              <div>No jobs found.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
