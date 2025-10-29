import Image from "next/image";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import Pagination from "./Pagination";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleDown,
  faAngleUp,
  faFile,
  faPlayCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { setDatasets } from "react-chartjs-2/dist/utils";
import AppContext from "../context/Context";
import _ from "lodash";
import { colorToRGBA } from "../utils/misc";

const ITEMS_PER_PAGE = 10;

interface Context {
  companiesList?: any;
  selectedCompany?: any;
  setSelectedCompany?: any;
  color: any;
}

interface CandidateCard {
  id: string;
  picture: any;
  first_name: any;
  last_name: any;
  profile: any;
  currentDesignation: any;
  work_history: any;
  location: any;
  email: any;
  phone: any;
  education_history: any;
  skills: any;
  tags: any;
  resumes: any;
}

export default function Page(props: any) {
  const { items, category } = props;

  // const [data,setData] = useState();

  const [expandedCards, setExpandedCards] = useState<any[]>([]);

  const context: Context = useContext(AppContext);
  const { color } = context;
  // useEffect(() => {
  //   setData(items)
  // },[items, props])
  // const isExpanded = id === expandedCard;

  const handleCardExpand = (id: any) => {
    setExpandedCards((prevExpandedCards): any => [...prevExpandedCards, id]);
  };

  const handleCardCollapse = (id: any) => {
    setExpandedCards((prevExpandedCards) =>
      prevExpandedCards.filter((cardId) => cardId !== id)
    );
  };

  return (
    <>
      {category !== "candidate" ? (
        <div>
          {/* <div className="grid grid-cols-12 items-center my-2 py-3 px-3 md:py-6 md:px-6 w-full mt-2 justify-between bg-white gap-3 overflow-x-scroll">
          <div className="col-span-3 flex flex-col" >
            <div className="text-xs md:text-lg text-left text-[#060E39] font-medium">
              Name
            </div>
          </div>
          <div className="col-span-2 flex flex-col" >
            <div className="text-xs md:text-lg text-left text-[#060E39] font-medium">
              Jobs
            </div>
          </div>
          <div className="col-span-2 flex flex-col" >
            <div className="text-xs md:text-lg text-left text-[#060E39] font-medium">
              Location
            </div>
          </div>
          <div className="col-span-3 flex flex-col" >
            <div className="text-xs md:text-lg text-left text-[#060E39] font-medium">
              Creator
            </div>
          </div>
          <div className="col-span-2 flex flex-col" >
            <div className="text-xs md:text-lg text-left text-[#060E39] font-medium">
              Created Date
            </div>
          </div>
          </div> */}
          <div className="overflow-auto">
            {items.map((item: any, key: any) => (
              <div
                style={{
                  backgroundColor: color?.innerBg,
                  borderColor: color?.outerBg,
                  color: color?.secondaryAccent,
                }}
                className="grid grid-cols-12 border-b items-center py-2 px-3 w-full justify-between gap-3"
                key={key}
              >
                <div className="col-span-3 flex">
                  <Link
                    href={`/admin/company/${item?.id}`}
                    className="text-left text-xs md:text-sm font-semibold"
                  >
                    {item.name}
                  </Link>
                </div>
                <div className="col-span-2 flex flex-col justify-start">
                  <Link
                    href={`/admin/company/${item?.id}`}
                    onClick={() => {
                      context.setSelectedCompany(item.name);
                    }}
                    style={{
                      backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
                      color: color?.primaryAccent,
                    }}
                    className="w-max flex items-center h-6 rounded-2xl px-4 "
                  >
                    <div className="text-sm md:text-xs font-semibold">
                      {item.jobs_count}
                    </div>
                  </Link>
                </div>
                <div className="col-span-2 flex flex-col">
                  <div className="md:text-base max-w-[8vw] min-w-[8vw] truncate text-sm">
                    {item?.locations.length > 1 ? item.locations[0].state : "-"}
                  </div>
                </div>
                <div className="col-span-3 flex flex-col">
                  <div className="md:text-base text-left max-w-[8vw] min-w-[8vw] truncate text-sm">
                    {/* {item.creator} */}John Doe
                  </div>
                </div>
                <div className="col-span-2 flex flex-col">
                  <div className="text-left md:text-base max-w-[8vw] min-w-[8vw] truncate text-sm">
                    {new Date(item.created_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {items.map((candidate: CandidateCard) => (
            <div
              style={{ backgroundColor: color?.innerBg }}
              key={candidate.id}
              className="rounded-lg "
            >
              <div
                className={`flex justify-between p-2 ${
                  expandedCards.includes(candidate.id)
                    ? "max-h-max"
                    : "max-h-80 overflow-hidden relative"
                } `}
              >
                {/* left column */}
                <div className="flex flex-col justify-start w-1/2 flex-shrink-0">
                  {/* Candidate bio */}
                  <div
                    style={{ color: color?.primaryAccent }}
                    className="flex w-full justify-end"
                  >
                    <Link
                      href={
                        candidate?.resumes.length ? candidate?.resumes[0] : "#"
                      }
                      style={{
                        backgroundColor: color?.primaryAccent,
                        color: color?.btnAccent,
                      }}
                      className=" flex items-center justify-end rounded border border-transparent hover:opacity-75 px-4 py-2 shadow-sm focus:outline-none text-xs font-light"
                      // onClick={uploadFile}
                    >
                      Download resume
                    </Link>
                    {candidate &&
                      _.size(candidate.resumes) > 0 &&
                      candidate?.resumes?.map((resume: any) =>
                        resume.resume_type === "doc" ? (
                          <div key={resume.resume_id} className="mt-2">
                            <FontAwesomeIcon icon={faFile} className="mr-2" />
                            <Link
                              href={resume.resume_url}
                              className="mr-2 text-sm"
                              target="_blank"
                            >
                              Download Resume
                            </Link>
                          </div>
                        ) : (
                          <div key={resume.resume_id} className="mt-2">
                            <FontAwesomeIcon
                              icon={faPlayCircle}
                              className="mr-2"
                            />
                            <Link
                              href={resume.resume_url}
                              className="mr-2 text-sm"
                            >
                              Download Video Resume
                            </Link>
                          </div>
                        )
                      )}
                  </div>
                  <div className="flex">
                    <Image
                      className="inline-block h-20 w-20 ring-2 ring-white mr-10 rounded-full"
                      src={candidate.picture}
                      alt=""
                      height={12}
                      width={12}
                    />
                    <div>
                      <div className="flex items-center mb-1">
                        <div className="font-bold ">
                          {candidate.first_name} {candidate.last_name}
                        </div>
                        <button className="cursor-pointer ml-5">
                          {/* <Image className=" h-5 w-8" src="https://w7.pngwing.com/pngs/276/472/png-transparent-linkedin-computer-icons-blog-logo-watercolor-butterfly-angle-text-rectangle.png" alt='Linkedin Profile' height={12} width={12} /> */}
                          <Link href={candidate.profile}>
                            <FontAwesomeIcon icon={faLinkedin} />
                          </Link>
                        </button>
                      </div>
                      <div>{candidate.currentDesignation}</div>
                      <div className="font-thin text-xs">
                        {candidate.location}
                      </div>
                      <div className="flex justify-end mb-5">
                        <a
                          className="font-thin text-xs"
                          href="mailto:example@example.com"
                        >
                          {candidate.email} |
                        </a>
                        <a
                          className="font-thin text-xs ml-1"
                          href="tel:+1234567890"
                        >
                          {candidate.phone}
                        </a>

                        <div></div>
                      </div>
                    </div>
                  </div>

                  {/* Work ex */}
                  <div className="mt-5">
                    <div className="font-bold text-md mb-5 text-[#DADBDC]">
                      WORK EXPERIENCE
                    </div>

                    {candidate.work_history.map((experience: any) => (
                      <div key={experience.id} className="flex mb-6">
                        {/* <Image
                          className="inline-block h-10 w-10 ring-2 ring-white mr-4 rounded-full"
                          src={experience.companyLogo}
                          alt=""
                          height={12}
                          width={12}
                        /> */}
                        <svg
                          className="h-10 w-10 ring-2 ring-white mr-4 rounded-full"
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
                            />
                            <path
                              id="company"
                              d="M4.949,18.275a2.432,2.432,0,0,1-1.784-.741,2.43,2.43,0,0,1-.74-1.783V7.928a2.433,2.433,0,0,1,.74-1.784A2.433,2.433,0,0,1,4.949,5.4h.6V4.8a2.433,2.433,0,0,1,.74-1.784,2.433,2.433,0,0,1,1.784-.74h4.694a2.43,2.43,0,0,1,1.783.74A2.432,2.432,0,0,1,15.3,4.8V8.533h.6a2.527,2.527,0,0,1,2.524,2.524v4.694A2.528,2.528,0,0,1,15.9,18.275H11.207V14.186H9.643v4.089Zm0-2.524H6.514V14.186H4.949Zm0-3.129H6.514V11.057H4.949Zm0-3.129H6.514V7.928H4.949Zm3.129,3.129H9.643V11.057H8.078Zm0-3.129H9.643V7.928H8.078Zm0-3.129H9.643V4.8H8.078Zm3.129,6.258h1.565V11.057H11.207Zm0-3.129h1.565V7.928H11.207Zm0-3.129h1.565V4.8H11.207Zm3.129,9.387H15.9V14.186H14.336Zm0-3.129H15.9V11.057H14.336Z"
                              transform="translate(1298.575 20.725)"
                              fill="#fff"
                            />
                          </g>
                        </svg>
                        <div>
                          <div className="font-bold">{experience.title}</div>
                          <div className="font-light text-sm mb-1">
                            {experience.company_name}
                          </div>
                          <div className="font-thin text-xs">
                            {experience.start_date} - {experience.end_date}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Education */}
                  <div className="mt-5">
                    <div
                      style={{
                        color: colorToRGBA(
                          color?.secondaryAccent,
                          color?.opacity
                        ),
                      }}
                      className="font-bold text-md mb-5"
                    >
                      EDUCATION
                    </div>
                    {candidate.education_history.map((item: any, key: any) => (
                      <div key={key} className="flex mb-6">
                        {/* <Image
                          className="inline-block h-10 w-10 ring-2 ring-white mr-4 rounded-full"
                          src={item.orgLogo}
                          alt=""
                          height={12}
                          width={12}
                        /> */}
                        <svg
                          className="h-10 w-10 ring-2 ring-white mr-4 rounded-full"
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
                            />
                            <path
                              id="company"
                              d="M4.949,18.275a2.432,2.432,0,0,1-1.784-.741,2.43,2.43,0,0,1-.74-1.783V7.928a2.433,2.433,0,0,1,.74-1.784A2.433,2.433,0,0,1,4.949,5.4h.6V4.8a2.433,2.433,0,0,1,.74-1.784,2.433,2.433,0,0,1,1.784-.74h4.694a2.43,2.43,0,0,1,1.783.74A2.432,2.432,0,0,1,15.3,4.8V8.533h.6a2.527,2.527,0,0,1,2.524,2.524v4.694A2.528,2.528,0,0,1,15.9,18.275H11.207V14.186H9.643v4.089Zm0-2.524H6.514V14.186H4.949Zm0-3.129H6.514V11.057H4.949Zm0-3.129H6.514V7.928H4.949Zm3.129,3.129H9.643V11.057H8.078Zm0-3.129H9.643V7.928H8.078Zm0-3.129H9.643V4.8H8.078Zm3.129,6.258h1.565V11.057H11.207Zm0-3.129h1.565V7.928H11.207Zm0-3.129h1.565V4.8H11.207Zm3.129,9.387H15.9V14.186H14.336Zm0-3.129H15.9V11.057H14.336Z"
                              transform="translate(1298.575 20.725)"
                              fill="#fff"
                            />
                          </g>
                        </svg>
                        <div>
                          <div className="font-bold">{item.name}</div>
                          <div className="font-light text-sm mb-1 ">
                            {item.degree}
                          </div>
                          <div className="font-thin text-xs">
                            {item.start_date} {item.end_date}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* right column */}
                <div className="flex flex-col justify-start w-1/2 flex-shrink-0">
                  {/* Last education and work detail */}
                  <div>
                    <div className="flex w-full items-center mb-2">
                      {/* <Image
                          className="inline-block h-10 w-10 ring-2 ring-white mr-2 rounded-full"
                          src={candidate.work_history[0].companyLogo}
                          alt=""
                          height={12}
                          width={12}
                        /> */}
                      <svg
                        className="w-10 h-10 mr-2"
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
                          />
                          <path
                            id="company"
                            d="M4.949,18.275a2.432,2.432,0,0,1-1.784-.741,2.43,2.43,0,0,1-.74-1.783V7.928a2.433,2.433,0,0,1,.74-1.784A2.433,2.433,0,0,1,4.949,5.4h.6V4.8a2.433,2.433,0,0,1,.74-1.784,2.433,2.433,0,0,1,1.784-.74h4.694a2.43,2.43,0,0,1,1.783.74A2.432,2.432,0,0,1,15.3,4.8V8.533h.6a2.527,2.527,0,0,1,2.524,2.524v4.694A2.528,2.528,0,0,1,15.9,18.275H11.207V14.186H9.643v4.089Zm0-2.524H6.514V14.186H4.949Zm0-3.129H6.514V11.057H4.949Zm0-3.129H6.514V7.928H4.949Zm3.129,3.129H9.643V11.057H8.078Zm0-3.129H9.643V7.928H8.078Zm0-3.129H9.643V4.8H8.078Zm3.129,6.258h1.565V11.057H11.207Zm0-3.129h1.565V7.928H11.207Zm0-3.129h1.565V4.8H11.207Zm3.129,9.387H15.9V14.186H14.336Zm0-3.129H15.9V11.057H14.336Z"
                            transform="translate(1298.575 20.725)"
                            fill="#fff"
                          />
                        </g>
                      </svg>
                      <div className="font-bold">
                        {candidate?.work_history[0]?.title}
                      </div>
                      {/* <div className='font-bold'>{candidate.work_history[0].companyName}</div> */}
                    </div>
                    <div className="flex items-center">
                      {/* <Image
                          className="inline-block h-10 w-10 ring-2 ring-white mr-2 rounded-full"
                          src={candidate.education[0].orgLogo}
                          alt=""
                          height={12}
                          width={12}
                        /> */}
                      <div className="font-bold">
                        {candidate?.education_history[0]?.name}
                      </div>
                    </div>
                  </div>

                  {/* skills */}
                  {candidate?.skills.length > 0 && (
                    <div
                      style={{ backgroundColor: color?.outerBg }}
                      className="mt-10 pb-5 px-5 pt-3 rounded-lg"
                    >
                      <div className="font-bold text-md mb-5">SKILLS</div>
                      <div className="flex flex-wrap">
                        {candidate?.skills.map((skill: any, key: any) => (
                          <div key={key} className="mr-5">
                            <div
                              style={{
                                backgroundColor: colorToRGBA(
                                  color?.secondaryAccent,
                                  color?.opacity
                                ),
                              }}
                              className="text-sm py-1 mt-2 px-2 rounded-md"
                            >
                              {skill}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* tags */}
                  {candidate?.tags && (
                    <div
                      style={{ backgroundColor: color?.outerBg }}
                      className="mt-10 pb-5 px-5 pt-3 rounded-lg"
                    >
                      <div className="font-bold text-md mb-5">TAGS</div>
                      <div className="flex flex-wrap">
                        {candidate.tags?.map((tag: any, key: any) => (
                          <div key={key} className="mr-5">
                            <div
                              style={{
                                backgroundColor: colorToRGBA(
                                  color?.secondaryAccent,
                                  color?.opacity
                                ),
                              }}
                              className="text-sm py-1 mt-2 px-2 rounded-md"
                            >
                              {tag.title}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <hr />
              {expandedCards.includes(candidate.id) ? (
                <div className="p-4 cursor-pointer flex items-center justify-center">
                  <button
                    onClick={() => {
                      handleCardCollapse(candidate.id);
                    }}
                  >
                    See less
                  </button>
                  <FontAwesomeIcon className="ml-2 mt-1" icon={faAngleUp} />
                </div>
              ) : (
                <div className="p-4 cursor-pointer flex items-center justify-center">
                  <button
                    onClick={() => {
                      handleCardExpand(candidate.id);
                    }}
                  >
                    See more
                  </button>
                  <FontAwesomeIcon className="ml-2 mt-1" icon={faAngleDown} />
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </>
  );
}
