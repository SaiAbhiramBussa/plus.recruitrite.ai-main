import { colorToRGBA } from "@/src/utils/misc";
import axios from "axios";
import _ from "lodash";
import { useRouter } from "next/router";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CompanyCard(props: any) {
  const router = useRouter();
  const {
    isAdmin,
    companyName,
    image,
    job,
    id,
    is_followed,
    follow_id,
    updateCompanyList,
    color,
  } = props;
  const [followText, setFollowText] = useState(
    is_followed ? "Unfollow" : "Follow"
  );

  const followCompany = async (id: any) => {
    try {
      const followObj = {
        follow_type: "company",
        followed_ids: [id],
      };
      let result = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/candidate-follow`,
        followObj,
        {
          withCredentials: true,
        }
      );
      if (result.status === 200) {
        setFollowText("Unfollow");
        updateCompanyList(id, true, result.data.follows);
      }
      return result;
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  const unFollowCompany = async (follow_id: any) => {
    try {
      const obj = {
        data: {
          follow_ids: [follow_id],
        },
        withCredentials: true,
      };
      let res = await axios.delete(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/candidate-follow`,
        obj
      );
      let data = res.data;
      if (res.status === 200) {
        setFollowText("Follow");
      }
      updateCompanyList(id, false);
      return data;
    } catch (err) {
      toast.error("Something went wrong!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  return (
    <div
      style={{
        backgroundColor: color?.innerBg,
        color: color?.secondaryAccent,
        borderColor: colorToRGBA(color?.secondaryAccent, 0.1),
      }}
      className="flex-col items-center justify-center border shadow  px-2 py-2 rounded hover:shadow-lg"
    >
      <div
        className="flex items-center justify-between"
        onClick={() =>
          isAdmin ? router.push(`/admin/companies/${id}/users`) : ""
        }
      >
        <div className="flex">
          <svg
            onClick={() => {
              isAdmin ? "" : router.push(`/candidates/company/${id}`);
            }}
            className="cursor-pointer w-16 mr-3 h-16 lg:w-16 lg:h-16 md:w-8 md:h-8 mb-1 p-1"
            width="34"
            height="34"
            viewBox="0 0 34 34"
          >
            <g
              id="Grupo_4966"
              data-name="Grupo 4966"
              transform="translate(-1292 -14)"
            >
              <circle
                id="Elipse_419"
                data-name="Elipse 419"
                cx="17"
                cy="17"
                r="17"
                transform="translate(1292 14)"
                fill="#474a56"
              ></circle>
              <path
                id="company"
                d="M4.949,18.275a2.432,2.432,0,0,1-1.784-.741,2.43,2.43,0,0,1-.74-1.783V7.928a2.433,2.433,0,0,1,.74-1.784A2.433,2.433,0,0,1,4.949,5.4h.6V4.8a2.433,2.433,0,0,1,.74-1.784,2.433,2.433,0,0,1,1.784-.74h4.694a2.43,2.43,0,0,1,1.783.74A2.432,2.432,0,0,1,15.3,4.8V8.533h.6a2.527,2.527,0,0,1,2.524,2.524v4.694A2.528,2.528,0,0,1,15.9,18.275H11.207V14.186H9.643v4.089Zm0-2.524H6.514V14.186H4.949Zm0-3.129H6.514V11.057H4.949Zm0-3.129H6.514V7.928H4.949Zm3.129,3.129H9.643V11.057H8.078Zm0-3.129H9.643V7.928H8.078Zm0-3.129H9.643V4.8H8.078Zm3.129,6.258h1.565V11.057H11.207Zm0-3.129h1.565V7.928H11.207Zm0-3.129h1.565V4.8H11.207Zm3.129,9.387H15.9V14.186H14.336Zm0-3.129H15.9V11.057H14.336Z"
                transform="translate(1298.575 20.725)"
                fill="#fff"
              ></path>
            </g>
          </svg>
          <div>
            <div
              className="font-semibold text-xs max-w-[12vw] min-w-[12vw] truncate cursor-pointer"
              onClick={(e: any) => {
                isAdmin
                  ? router.push(`/admin/companies/${id}/users`)
                  : router.push(`/candidates/company/${id}`);
                e.stopPropagation();
              }}
            >
              {companyName}
            </div>
            <div className="inline-flex items-center hustify-center rounded-full py-2">
              <button
                style={{
                  backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
                  color: color?.primaryAccent,
                }}
                className="flex items-center justify-center h-8 rounded-xl px-2"
                onClick={(e: any) => {
                  !isAdmin
                    ? router.push(`/candidates/company/${id}`)
                    : router.push(`/admin/company/${id}`);
                  e.stopPropagation();
                }}
              >
                <div className="text-xs font-semibold">
                  {job} jobs available
                </div>
              </button>
            </div>
          </div>
        </div>
        {!isAdmin && (
          <button
            style={
              followText === "Unfollow"
                ? { backgroundColor: "#fecaca", color: "#ef4444" }
                : {
                    backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
                    color: color?.primaryAccent,
                  }
            }
            className="flex ml-1 duration-300 justify-center items-center rounded border border-transparent px-4 py-2 text-sm font-medium shadow-sm focus:outline-none hover:opacity-75"
            onClick={() => {
              is_followed ? unFollowCompany(follow_id) : followCompany(id);
            }}
          >
            {followText}
          </button>
        )}
      </div>
    </div>
  );
}
