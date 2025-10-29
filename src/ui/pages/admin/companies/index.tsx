import React, { useContext, useEffect, useState } from "react";
import DashboardHeader from "@/src/component/Dashboard/DashboardNavbar";
import axios from "axios";
import _ from "lodash";
import Loader from "@/src/component/Loader";
import AppContext from "@/src/context/Context";
import Pagination from "@/src/component/Pagination";
import CompanyCard from "@/src/component/candidates/CompanyCard";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthGuard from "@/src/component/AuthGuard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faSearch } from "@fortawesome/free-solid-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { colorToRGBA } from "@/src/utils/misc";
import CustomizationsData from "@/src/utils/CustomizationData";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

interface Context {
  setCompaniesList?: any;
}

const AdminCompaniesDashboard = () => {
  const router = useRouter();
  const context: Context = useContext(AppContext);

  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagingNumber, setPagingNumber] = useState(1);
  const [companiesData, setCompaniesData] = useState<any>({});
  const [perPagingNumber, setPerPagingNumber] = useState(50);
  const [form, openForm] = useState(false);
  const [focussedTab, setFocussedTab] = useState("company");
  const [companyForm, setCompanyForm] = useState<any>();
  const [locationForm, setLocationForm] = useState<any>();
  const [userForm, setuserForm] = useState<any>();
  const [submit, setSubmit] = useState(false);
  const [isCompanyCreated, setIsCompanyCreated] = useState<any>();
  const [isLocationCreated, setIsLocationCreated] = useState<any>();
  const [isUserCreated, setIsUserCreated] = useState<any>();
  const [error, setError] = useState<any>();
  const [lastVal, setLastVal] = useState<any>();
  const customizationsData: any = CustomizationsData[3].data;
  const { color } = useContext(AppContext);

  useEffect(() => {
    const debounce = setTimeout(() => {
      getCompaniesForAdmin(pagingNumber, perPagingNumber);
    }, 500);

    return () => clearTimeout(debounce);
  }, [pagingNumber, perPagingNumber]);

  useEffect(() => {
    submission();
  }, [submit]);

  const submission = async () => {
    try {
      let companyRes: any = isCompanyCreated ? isCompanyCreated : "";
      let locationRes: any = isLocationCreated ? isLocationCreated : "";
      let userRes: any = isUserCreated ? isUserCreated : "";
      setLoading(true);
      if (companyForm && _.isUndefined(isCompanyCreated)) {
        const companyFormObj = {
          name: companyForm.name,
          logo: companyForm.logo,
          description: companyForm.description,
          industry: companyForm.industry.value,
          is_full_service: companyForm.isFullServiceEnabled
            ? companyForm.isFullServiceEnabled
            : false,
          website_url: companyForm.websiteUrl,
        };
        setCompanyForm(_.omit(companyForm, "industry"));
        companyRes = await axios.post(
          `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/`,
          companyFormObj,
          {
            withCredentials: true,
          }
        );
      }
      if (companyRes?.status === 200) {
        try {
          setLastVal("company");
          setIsCompanyCreated(companyRes);
          if (locationForm && _.isUndefined(isLocationCreated)) {
            locationForm.country = locationForm.country.name;
            locationForm.state = locationForm.state.name;
            locationRes = await axios.post(
              `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${companyRes?.data?.id}/locations/`,
              locationForm,
              {
                withCredentials: true,
              }
            );
          }

          if (locationRes?.status === 200) {
            try {
              setLastVal("location");
              setIsLocationCreated(locationRes);
              if (userForm && _.isUndefined(isUserCreated)) {
                const userFormObj = {
                  location_id: locationRes.data?.id,
                  first_name: userForm.first_name,
                  last_name: userForm.last_name,
                  email: userForm.email,
                  phone: userForm.code + userForm.phoneNumber,
                };
                userForm.location_id = locationRes.data.id;
                userRes = await axios.post(
                  `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${locationRes?.data?.id}/users/`,
                  userFormObj,
                  {
                    withCredentials: true,
                  }
                );
              }
              if (userRes?.status === 200) {
                setLastVal("user");
                setIsUserCreated(userRes);
                router.push(`/admin/companies/${companyRes.data?.id}/users`);
              }
            } catch (err: any) {
              setLoading(false);
              setFocussedTab("user");
              setError(err?.response?.data);
            }
          }
        } catch (err: any) {
          setLoading(false);
          setFocussedTab("location");
          setError(err?.response?.data);
        }
      }
    } catch (err: any) {
      setLoading(false);
      setFocussedTab("company");
      setError(err?.response?.data);
    }
  };

  const getCompaniesForAdmin = async (page: number, per_page: number) => {
    try {
      setLoading(true);
      setCompaniesData(null);
      const result = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/?page=${page}&per_page=${per_page}&query=${searchTerm}`,
        {
          withCredentials: true,
        }
      );
      if (result.status === 200) {
        setItems(result.data.companies_data);
        setCompaniesData(result.data);
        context.setCompaniesList(result.data.companies_data);
      }
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

  const PageNumberChange = (pageNumber: any) => {
    setPagingNumber(pageNumber);
  };

  const PerPageNumberChange = (perPageNumber: any) => {
    setPerPagingNumber(perPageNumber);
  };

  const handleSearch = async (event: any) => {
    event.preventDefault();
    try {
      setLoading(true);
      setPagingNumber(1);
      const result = await axios.get(
        `${
          process.env.NEXT_PUBLIC_DOMAIN
        }/api/companies/?page=${1}&per_page=${perPagingNumber}&query=${searchTerm}`,
        {
          withCredentials: true,
        }
      );
      setItems(result.data.companies_data);
      setCompaniesData(result.data);
      context.setCompaniesList(result.data.companies_data);
    } catch (error) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: any) => {
    const value = event.target.value;
    setQuery(value);
    handleSearch(query);
  };

  const createCompany = () => {
    router.push("/admin/company/create");
  };

  return (
    <div className="min-h-screen">
      <div className="h-16">
        <DashboardHeader companyName="Admin" section="companies" />
      </div>

      <div
        style={{
          backgroundColor: color?.outerBg,
          color: color?.secondaryAccent,
        }}
        className="flex flex-col w-full grow min-h-full px-6"
      >
        <div
          style={{
            backgroundColor: color?.innerBg,
          }}
          className="flex flex-col w-full h-full min-h-[89vh] relative my-6 rounded-sm"
        >
          <div className="flex w-full justify-between items-center">
            <div className="w-full text-lg font-bold px-4 py-2 cursor-pointer">
              {customizationsData.inner.text}
            </div>
            <div className="flex w-full items-center py-2 justify-end my-2">
              {/* <h2 className="font-semibold text-base">Companies</h2> */}
              <div className="flex w-4/5 items-center justify-end">
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-sm w-64 pr-3 py-2 border-0 focus:outline-none focus:ring-0"
                    placeholder={customizationsData.inner.placeholderInput}
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
                    className="h-4 mr-1 cursor-pointer"
                  />
                  <span className="mx-1 hidden lg:block">Search</span>
                </ButtonWrapper>
                <ButtonWrapper
                  onClick={createCompany}
                  classNames="flex items-center justify-center rounded border border-transparent px-5 py-2 text-sm font-medium shadow-sm focus:outline-none mr-4"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className="h-4 mr-1 cursor-pointer"
                  />
                  <span className="mx-1 hidden lg:block">Create</span>
                </ButtonWrapper>
              </div>
            </div>
          </div>
          {!form && (
            <div>
              {loading ? (
                <div className="mt-[10%]">
                  <Loader />
                </div>
              ) : (
                <>
                  {items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 px-4 mb-28 md:mb-16">
                      {items.map((item: any, key: any) => (
                        <div key={key} className="cursor-pointer">
                          <CompanyCard
                            id={item.id}
                            isAdmin={true}
                            companyName={item.name}
                            job={item.jobs_count}
                            color={color}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[70vh] flex items-center justify-center font-bold">
                      No such companies found
                    </div>
                  )}
                </>
              )}

              {companiesData && !loading && items?.length > 0 && (
                <div className="absolute bottom-0 w-[99%] m-auto">
                  <Pagination
                    setCurrentPage={companiesData.current_page}
                    totalItems={companiesData.total_count}
                    currentPage={companiesData.current_page}
                    itemsPerPage={companiesData.per_page}
                    totalPages={companiesData.total_pages}
                    PageNumberChange={PageNumberChange}
                    PerPageNumberChange={PerPageNumberChange}
                    setPerPagingNumber={setPerPagingNumber}
                    perPagingNumber={perPagingNumber}
                    setPageNumber={setPagingNumber}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthGuard(AdminCompaniesDashboard);
