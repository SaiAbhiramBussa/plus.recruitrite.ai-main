import { useCallback, useContext, useState } from "react";
import TextInput from "../TextInput";
import _ from "lodash";
import dynamic from "next/dynamic";
import AppContext from "@/src/context/Context";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

interface SearchDataInterface {
  first_name?: any;
  last_name?: any;
  email?: any;
  source?: any;
  staged?: any;
  city?: any;
  state?: any;
  country?: any;
  zip?: any;
  title?: any;
  institution?: any;
  degree?: any;
  company?: any;
  credentials?: any;
}

export default function AdvanceSearch(props: any) {
  const { color } = useContext(AppContext);
  const {
    advSearchFilters,
    displayFilters,
    close,
    setKeywordQuery,
    keywordQuery,
    setAdvanceSearchQuery,
    getCandidatesForAdmin,
    setIsAdvancedSearch,
    setAdvSearchFilters,
    setDisplayFilters,
  } = props;
  const [searchData, setSearchData] = useState<any>(
    displayFilters ? displayFilters : advSearchFilters
  );
  const [form, setForm] = useState({
    first_name: searchData?.first_name,
    last_name: searchData?.last_name,
    email: searchData?.email,
    source: searchData?.source,
    staged: searchData?.staged,
    city: searchData?.city,
    state: searchData?.state,
    country: searchData?.country,
    zip: searchData?.zip,
    title: searchData?.title,
    institution: searchData?.institution,
    degree: searchData?.degree,
    company: searchData?.company,
    credentials: searchData?.company,
  });

  const setField = useCallback(
    (name: keyof typeof form, value: any) => {
      setSearchData((f: any) => {
        if (_.isEmpty(value)) return _.omit(f, [name]);
        else return { ...f, [name]: value };
      });
    },
    [setForm, setSearchData]
  );

  const submit = () => {
    if (!_.isUndefined(searchData) && !_.isEmpty(searchData)) {
      setIsAdvancedSearch(true);
      setDisplayFilters(searchData);
      const keys = Object.keys(searchData);
      const values = Object.values(searchData);
      const test = keys.map((key, index) => {
        const val = key + "=" + values[index];
        return val;
      });
      let queryString = test.join("&");
      (queryString = "&advanced_search=true&" + queryString),
        setAdvanceSearchQuery(queryString);
      getCandidatesForAdmin(queryString);
    }
  };

  const onKeyDownHandler = (e: any) => {
    if (e.keyCode === 13) {
      submit();
    }
  };

  return (
    <div className="absolute">
      <div
        style={{ backgroundColor: color.secondaryAccent }}
        className="fixed flex justify-end z-50 opacity-70 top-0 right-0 w-screen h-screen"
        onClick={close}
      ></div>
      <div
        style={{ backgroundColor: color.innerBg }}
        className="fixed top-0 right-0 w-[50vh] z-50  h-[100vh] overflow-auto  shadow-2xl transition-transform ease-in-out duration-300 translate-x-0"
      >
        <div style={{ backgroundColor: color.primaryAccent }} className="p-4">
          <p
            style={{ color: color.btnAccent }}
            id="drawer-navigation-label"
            className="text-base font-medium uppercase"
          >
            Advance Search
          </p>
          <button
            style={{
              backgroundColor: color.innerBg,
              color: color.secondaryAccent,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = color.outerBg)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = color.innerBg)
            }
            className="rounded-lg text-sm p-1.5 absolute top-2.5 right-2.5 inline-flex items-center"
            onClick={() => {
              setAdvSearchFilters(searchData);
              close();
            }}
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="white"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
            <span className="sr-only">Close menu</span>
          </button>
        </div>
        <div className="flex justify-end mr-5">
          <ButtonWrapper
            classNames="flex items-center justify-center mt-2 rounded border border-transparent px-4 py-2 text-sm font-medium shadow-sm focus:outline-none m-1"
            onClick={() => {
              setAdvanceSearchQuery({});
              setSearchData({});
              getCandidatesForAdmin("");
              setDisplayFilters({});
            }}
            disabled={_.isUndefined(searchData)}
          >
            <span className="hidden text-xs lg:block">CLEAR ALL</span>
          </ButtonWrapper>
          <ButtonWrapper
            classNames="flex items-center justify-center mt-2 rounded border border-transparent px-4 py-2 text-sm font-medium shadow-sm focus:outline-none m-1"
            onClick={submit}
            disabled={
              _.isUndefined(searchData) || Object.keys(searchData).length === 0
            }
          >
            <span className=" hidden text-xs lg:block">APPLY</span>
          </ButtonWrapper>
        </div>
        <div className=" pb-4 px-4" onKeyDown={(e: any) => onKeyDownHandler(e)}>
          <ul className="font-medium">
            <li className="flex items-center p-2">
              <TextInput
                name="first_name"
                value={searchData?.first_name}
                label={"First name"}
                placeholder={"Enter first name"}
                section="advance_search"
                onChange={(e) => setField("first_name", e.target.value)}
              />
            </li>
            <li className="flex items-center p-2">
              <TextInput
                name="last_name"
                value={searchData?.last_name}
                label={"Last name"}
                placeholder={"Enter last name"}
                section="advance_search"
                onChange={(e) => setField("last_name", e.target.value)}
              />
            </li>
            <li className="flex items-center p-2">
              <TextInput
                name="Email"
                value={searchData?.email}
                label={"Email"}
                placeholder={"Enter email"}
                section="advance_search"
                onChange={(e) => setField("email", e.target.value)}
              />
            </li>
            <li className="flex items-center p-2">
              <TextInput
                name="source"
                value={searchData?.source}
                label={"Source"}
                placeholder={"Enter source"}
                section="advance_search"
                onChange={(e) => setField("source", e.target.value)}
              />
            </li>
            <li className="flex items-center p-2">
              <TextInput
                name="Staged"
                value={searchData?.staged}
                label={"Staged"}
                placeholder={"Enter staged"}
                section="advance_search"
                onChange={(e) => setField("staged", e.target.value)}
              />
            </li>
            <li className="flex items-center p-2">
              <TextInput
                name="city"
                value={searchData?.city}
                label={"City"}
                placeholder={"Enter city"}
                section="advance_search"
                onChange={(e) => setField("city", e.target.value)}
              />
            </li>
            <li className="flex items-center p-2">
              <TextInput
                name="state"
                value={searchData?.state}
                label={"State"}
                placeholder={"Enter state"}
                section="advance_search"
                onChange={(e) => setField("state", e.target.value)}
              />
            </li>
            <li className="flex items-center p-2">
              <TextInput
                name="country"
                value={searchData?.country}
                label={"Country"}
                placeholder={"Enter country"}
                section="advance_search"
                onChange={(e) => setField("country", e.target.value)}
              />
            </li>
            <li className="flex items-center p-2">
              <TextInput
                name="zip"
                value={searchData?.zip}
                label={"Zip"}
                placeholder={"Enter zip"}
                section="advance_search"
                onChange={(e) => setField("zip", e.target.value)}
              />
            </li>
            <li className="flex items-center p-2">
              <TextInput
                name="title"
                value={searchData?.title}
                label={"Title"}
                placeholder={"Enter title"}
                section="advance_search"
                onChange={(e) => setField("title", e.target.value)}
              />
            </li>
            <li className="flex items-center p-2">
              <TextInput
                name="institution"
                value={searchData?.institution}
                label={"Institution"}
                placeholder={"Enter institution"}
                section="advance_search"
                onChange={(e) => setField("institution", e.target.value)}
              />
            </li>
            <li className="flex items-center p-2">
              <TextInput
                name="degree"
                value={searchData?.degree}
                label={"Degree"}
                placeholder={"Enter degree"}
                section="advance_search"
                onChange={(e) => setField("degree", e.target.value)}
              />
            </li>
            <li className="flex items-center p-2">
              <TextInput
                name="credentials"
                value={searchData?.credentials}
                label={"Credentials"}
                placeholder={"Enter Credentials"}
                section="advance_search"
                onChange={(e) => setField("credentials", e.target.value)}
              />
            </li>
            <li className="flex items-center p-2">
              <TextInput
                name="company"
                value={searchData?.company}
                label={"Company"}
                placeholder={"Enter company"}
                section="advance_search"
                onChange={(e) => setField("company", e.target.value)}
              />
            </li>
          </ul>
        </div>
        <div className="flex justify-end mr-5">
          <ButtonWrapper
            classNames="flex items-center justify-center my-2 rounded border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none m-1"
            onClick={submit}
            disabled={_.isUndefined(searchData)}
          >
            <span className=" hidden text-xs lg:block">APPLY</span>
          </ButtonWrapper>
        </div>
      </div>
    </div>
  );
}
