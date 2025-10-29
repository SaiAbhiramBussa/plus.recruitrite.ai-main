import Link from "next/link";
import { useRouter } from "next/router";
import { useContext } from "react";
import AppContext from "../context/Context";
import { colorToRGBA } from "../utils/misc";

type Props = {
  title: string;
  backPage: any;
  role?: any;
  link?: any;
};
export default function Breadcrumbs(props: Props) {
  const router = useRouter();
  const { color } = useContext(AppContext);

  return (
    <div
      style={{ color: color.secondaryAccent }}
      className="flex justify-start items-center"
    >
      {props.link ? (
        <Link
          style={{
            backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
            stroke: colorToRGBA(color?.secondaryAccent, color?.opacity),
          }}
          href={
            props.link
              ? props.link
              : props.role === "job-seeker"
              ? "/candidates/dashboard"
              : "/dashboard"
          }
          className="h-10 w-10 bg-opacity-10 flex justify-center items-center"
          passHref
        >
          <svg
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={3}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
            />
          </svg>
        </Link>
      ) : (
        <div
          style={{
            backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
            stroke: colorToRGBA(color?.secondaryAccent, color?.opacity),
          }}
          onClick={() => router.back()}
          className="h-10 w-10 cursor-pointer bg-opacity-10 flex justify-center items-center"
        >
          {/* <Link href={props.link ? props.link : props.role ==='job-seeker' ? "/candidates/dashboard" : "/dashboard"} className="h-10 w-10 bg-[#929AAB] bg-opacity-10 flex justify-center items-center"> */}
          <svg
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={3}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
            />
          </svg>
        </div>
      )}
      <div className="text-sm md:text-lg font-light mr-3">{props.backPage}</div>
      <div className="text-sm w-max md:text-lg font-bold">{props.title}</div>
    </div>
  );
}
