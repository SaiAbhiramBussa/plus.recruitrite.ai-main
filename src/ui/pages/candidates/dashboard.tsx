import React, { useContext, useEffect, useState } from "react";
import CandidateNavbar from "@/src/component/candidates/CandidateNavbar";
import RecommendedSection from "@/src/component/candidates/RecommendedSection";
import FollowedEmployersSection from "@/src/component/candidates/FollowedEmployersSection";
import axios from "axios";
import _ from "lodash";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthGuard from "@/src/component/AuthGuard";
import Pagination from "@/src/component/Pagination";
import AppContext from "@/src/context/Context";

const CandidateDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [showFirst, setShowFirst] = useState(true);
  const [showSecond, setShowSecond] = useState(false);
  const [showThird, setShowThird] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagingNumber, setPagingNumber] = useState(1);
  const [companiesData, setCompaniesData] = useState<any>({});
  const [perPagingNumber, setPerPagingNumber] = useState(50);
  const [companiesToFollow, setCompaniesToFollow] = useState<any>();
  const [followedCompanies, setFollowedCompanies] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const { color } = useContext(AppContext);

  useEffect(() => {
    getCompaniesForAdmin(pagingNumber, perPagingNumber);
  }, [pagingNumber, perPagingNumber]);

  useEffect(() => {
    if (searchTerm.length > 1) {
      setPagingNumber(1);
      setPerPagingNumber(50);
      const debounceSearch = _.debounce(async () => {
        getCompaniesForAdmin(pagingNumber, perPagingNumber);
      }, 500);

      debounceSearch();
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  const fetchCandidateFollows = async () => {
    try {
      let res = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/candidate-follow?follow_type=company`,
        {
          withCredentials: true,
        }
      );
      setFollowedCompanies(res.data);
      return res;
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const filterFollowedCompaniesFromList = (companiesList: any) => {
    fetchCandidateFollows().then((response: any) => {
      const updateList = companiesList.map((company: any) => {
        const matchingCompany = response?.data?.find(
          (followedObject: any) => company.id === followedObject.followed_id
        );
        if (matchingCompany) {
          return {
            ...company,
            follow_id: matchingCompany.id,
            is_followed: true,
          };
        }
        return company;
      });
      setCompaniesToFollow(updateList);
    });
  };

  const getCompaniesForAdmin = async (page: number, per_page: number) => {
    try {
      const result = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/?page=${page}&per_page=${per_page}&query=${searchTerm}`,
        {
          withCredentials: true,
        }
      );
      filterFollowedCompaniesFromList(result.data.companies_data);
      // setCompaniesToFollow(result.data.companies_data);
      setCompaniesData(result.data);
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const openFirstSection = () => {
    setShowSecond(false);
    setShowFirst(true);
  };

  const openSecondSection = () => {
    setShowSecond(true);
    setShowFirst(false);
  };

  const openThirdSection = () => {
    setShowSecond(false);
    setShowFirst(false);
    setShowThird(true);
  };

  const PageNumberChange = (pageNumber: any) => {
    setPagingNumber(pageNumber);
  };

  const PerPageNumberChange = (perPageNumber: any) => {
    setPerPagingNumber(perPageNumber);
  };

  return (
    <div
      style={{
        backgroundColor: color?.outerBg,
        color: color?.secondaryAccent,
      }}
      className="min-h-screen flex flex-col"
    >
      <div className="h-16">
        <CandidateNavbar />
      </div>

      <div
        style={{ backgroundColor: color?.outerBg }}
        className="flex flex-col gap-4 w-full px-6 flex-grow"
      >
        <div
          style={{
            height: "inherit",
            backgroundColor: color?.innerBg,
          }}
          className="flex mt-6 flex-col w-full min-h-screen p-2"
        >
          <div className="flex justify-between px-2 py-2">
            <div className="text-sm font-medium text-center">
              <ul className="flex flex-wrap -mb-px">
                <li className="mr-2">
                  <div
                    style={
                      showFirst
                        ? {
                            color: color?.primaryAccent,
                            borderColor: color?.primaryAccent,
                          }
                        : {}
                    }
                    onClick={openFirstSection}
                    className="inline-block cursor-pointer p-4 hover:opacity-75 border-b-2 border-transparent rounded-t-lg"
                  >
                    Recommended Employers AI
                  </div>
                </li>
                <li className="mr-2">
                  <div
                    style={
                      showSecond
                        ? {
                            color: color?.primaryAccent,
                            borderColor: color?.primaryAccent,
                          }
                        : {}
                    }
                    onClick={openSecondSection}
                    className="inline-block p-4 cursor-pointer hover:opacity-75 rounded-t-lg mb-2`}"
                  >
                    Employers you follow
                  </div>
                </li>
              </ul>
            </div>

            {showFirst && (
              <div className="w-1/3 pt-2">
                <input
                  type="text"
                  style={{ backgroundColor: color?.innerBg }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs md:text-sm border w-full py-1 px-2 md:py-3 md:px-3 rounded"
                  placeholder="Search companies"
                />
              </div>
            )}
          </div>
          <div style={{ backgroundColor: color?.innerBg }} className="p-2">
            {loading && (
              <div className="text-center items-center justify-center flex py-5">
                <div aria-label="Loading..." role="status">
                  <svg className="h-6 w-6 animate-spin" viewBox="3 3 18 18">
                    <path
                      className="fill-gray-200"
                      d="M12 5C8.13401 5 5 8.13401 5 12c0 3.866 3.13401 7 7 7 3.866.0 7-3.134 7-7 0-3.86599-3.134-7-7-7zM3 12c0-4.97056 4.02944-9 9-9 4.9706.0 9 4.02944 9 9 0 4.9706-4.0294 9-9 9-4.97056.0-9-4.0294-9-9z"
                    >
                      {" "}
                    </path>
                    <path
                      className="fill-gray-800"
                      d="M16.9497 7.05015c-2.7336-2.73367-7.16578-2.73367-9.89945.0-.39052.39052-1.02369.39052-1.41421.0-.39053-.39053-.39053-1.02369.0-1.41422 3.51472-3.51472 9.21316-3.51472 12.72796.0C18.7545 6.02646 18.7545 6.65962 18.364 7.05015c-.390599999999999.39052-1.0237.39052-1.4143.0z"
                    >
                      {" "}
                    </path>
                  </svg>
                </div>
              </div>
            )}
            {showFirst && companiesToFollow && (
              <div>
                <div>
                  <RecommendedSection
                    data={searchTerm}
                    companies={companiesToFollow}
                    followedCompanies={followedCompanies}
                    setCompaniesToFollow={setCompaniesToFollow}
                    setFollowedCompanies={setFollowedCompanies}
                    color={color}
                  />
                </div>
                <div>
                  <Pagination
                    setCurrentPage={companiesData?.current_page}
                    totalItems={companiesData?.total_count}
                    currentPage={companiesData?.current_page}
                    itemsPerPage={companiesData?.per_page}
                    totalPages={companiesData?.total_pages}
                    PageNumberChange={PageNumberChange}
                    PerPageNumberChange={PerPageNumberChange}
                    setPerPagingNumber={setPerPagingNumber}
                    perPagingNumber={perPagingNumber}
                    setPageNumber={setPagingNumber}
                  />
                </div>{" "}
              </div>
            )}
            {showSecond && (
              <FollowedEmployersSection
                followedCompaniesData={followedCompanies}
                companies={companiesToFollow}
                setCompaniesToFollow={setCompaniesToFollow}
                setFollowedCompanies={setFollowedCompanies}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthGuard(CandidateDashboard);
