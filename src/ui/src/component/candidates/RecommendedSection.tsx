import _ from "lodash";
import { useState } from "react";
import Loader from "../Loader";
import CompanyCard from "./CompanyCard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RecommendedSection(props: any) {
  const {
    data,
    companies,
    followedCompanies,
    setCompaniesToFollow,
    setFollowedCompanies,
    color,
  } = props;
  const [loading, setLoading] = useState(false);

  function updateCompanyList(
    companyId: any,
    isFollowed: boolean,
    followedData: any
  ) {
    setCompaniesToFollow(
      companies.map((company: any) => {
        if (company.id == companyId) {
          return { ...company, is_followed: isFollowed };
        }
        return company;
      })
    );
    if (!isFollowed) {
      setFollowedCompanies(
        followedCompanies.filter((followed: any) => {
          if (followed.followed_id != companyId) {
            return followed;
          }
        })
      );
    } else if (isFollowed) {
      const addFollowed = companies.find((company: any) => {
        if (company.id == companyId) {
          return company;
        }
      });
      if (addFollowed) {
        const addFollowedCompany = {
          id: followedData[0].follow_id,
          follow_type: "company",
          followed_id: followedData[0].followed_id,
          followed_company: addFollowed.name,
          jobs_count: addFollowed.jobs_count,
          locations: null,
        };
        followedCompanies.push(addFollowedCompany);
        setFollowedCompanies(followedCompanies);

        const updateList = companies.map((company: any) => {
          if (company.id == companyId) {
            return {
              ...company,
              follow_id: followedData[0].follow_id,
              is_followed: true,
            };
          }
          return company;
        });
        setCompaniesToFollow(updateList);
      }
    }
  }

  return (
    <div className="relative">
      <div
        className={
          companies ? "hidden" : "w-full h-full m-auto items-center mt-[24vh]"
        }
      >
        <Loader />
      </div>

      {companies && companies.length ? (
        <div>
          <div className="grid grid-cols-1 gap-4 md:mb-10 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company: any) => (
              <CompanyCard
                follow_id={company.follow_id}
                is_followed={company.is_followed}
                key={company?.id}
                id={company?.id}
                job={company.jobs_count}
                image={company.image}
                companyName={company.name}
                updateCompanyList={updateCompanyList}
              />
            ))}
          </div>
          <br />
        </div>
      ) : (
        <>
          <div>
            {!loading ? (
              <div
                style={{ color: color?.primaryAccent }}
                className="flex h-[50vh] justify-center items-center font-bold"
              >
                No recommended employers
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
