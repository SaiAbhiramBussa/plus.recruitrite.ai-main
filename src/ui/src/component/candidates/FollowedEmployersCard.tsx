import { colorToRGBA } from "@/src/utils/misc";
import axios from "axios";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function FollowedEmployersCard(props: any) {
  const router = useRouter();

  const { companyName, job, id, followed_id, updateCompanyList, color } = props;

  const unFollowCompany = async () => {
    try {
      const obj = {
        data: {
          follow_ids: [id],
        },
        withCredentials: true,
      };
      let res = await axios.delete(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/candidate-follow`,
        obj
      );
      let data = res.data;
      if (res.status === 200) updateCompanyList(id, followed_id);
      return data;
    } catch (err) {
      toast.error("Something went wrong unfollowing this company!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
  };

  return (
    <div
      style={{ backgroundColor: color?.innerBg }}
      className="flex-col items-center justify-center border-slate-200 border px-4 py-4 rounded hover:shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex">
          <svg
            className="w-16 mr-3 h-16 mb-1 border p-1"
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
            <div className="font-semibold text-sm max-w-[12vw] min-w-[12vw] truncate">
              {companyName}
            </div>
            <div className="inline-flex items-center hustify-center rounded-full py-2">
              <button
                style={{
                  backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
                  color: color?.primaryAccent,
                }}
                className="flex items-center justify-center h-8 rounded-xl px-2"
                onClick={() => {
                  router.push(`/candidates/company/${followed_id}`);
                }}
              >
                <div className="text-xs font-semibold">
                  {job} jobs available
                </div>
              </button>
            </div>
          </div>
        </div>
        <button
          className="flex ml-1 duration-300 justify-center items-center rounded border border-transparent px-2 py-1 font-medium text-sm shadow-sm bg-red-200 text-red-500 hover:bg-red-500 hover:text-white focus:outline-none"
          onClick={unFollowCompany}
        >
          Unfollow
        </button>
      </div>
    </div>
  );
}
