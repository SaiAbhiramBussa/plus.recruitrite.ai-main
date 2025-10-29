import { useState } from "react";
import Loader from "../Loader";
import FollowedEmployersCard from "./FollowedEmployersCard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function FollowedEmployersSection(props: any) {
  const [loading, setLoading] = useState<boolean>(false);
  const {
    followedCompaniesData,
    setFollowedCompanies,
    companies,
    setCompaniesToFollow,
    color,
  } = props;

  const updateCompanyList = (id: any, followedId: any) => {
    const updatedItems = followedCompaniesData.filter(
      (company: any) => company.id !== id
    );
    setFollowedCompanies(updatedItems);

    const updateList = companies.map((company: any) => {
      if (company.id == followedId) {
        return { ...company, follow_id: id, is_followed: false };
      }
      return company;
    });
    setCompaniesToFollow(updateList);
  };

  return (
    <div>
      {loading && (
        <div className={"w-full h-full m-auto items-center mt-[24vh]"}>
          <Loader />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 px-2">
        {followedCompaniesData.length &&
          followedCompaniesData.map((company: any) => (
            <FollowedEmployersCard
              updateCompanyList={updateCompanyList}
              followed_id={company.followed_id}
              key={company?.id}
              id={company?.id}
              job={company.jobs_count}
              image={company.image}
              companyName={company.followed_company}
              color={color}
            />
          ))}
      </div>
      {!followedCompaniesData.length && !loading && (
        <div className="h-full justify-center flex items-center font-bold">
          <div
            style={{
              backgroundColor: color?.innerBg,
              color: color?.primaryAccent,
            }}
            className="text-center justify-center items-center flex py-5"
          >
            <div aria-label="Empty" role="status">
              You are not following any companies
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
