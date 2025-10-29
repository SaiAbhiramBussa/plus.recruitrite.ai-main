import React, { useContext, useState } from "react";
import CandidateNavbar from "@/src/component/candidates/CandidateNavbar";
import Image from "next/image";
import SkillTab from "@/src/component/SkillTab";
import Link from "next/link";
import WorkExCard from "@/src/component/candidates/WorkExCard";
import GeneralInfoCard from "@/src/component/candidates/GeneralInfoCard";
import Subheader from "@/src/component/candidates/Subheader";
import { colorToRGBA } from "@/src/utils/misc";
import dynamic from "next/dynamic";
import AppContext from "@/src/context/Context";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

export default function CandidateProfile() {
  const [loading, setLoading] = useState(false);
  const { color } = useContext(AppContext);

  return (
    <>
      <CandidateNavbar />
      <div
        style={{ backgroundColor: color?.outerBg }}
        className="flex flex-col gap-4 w-full pl-10 pr-10 grow min-h-screen"
      >
        <div className="flex mt-10 flex-col w-full divide-y">
          <div style={{ backgroundColor: color?.innerBg }}>
            <div
              style={{
                borderColor: colorToRGBA(color?.primaryAccent, color?.opacity),
              }}
              className="flex text-center items-center py-6 px-6 border"
            >
              <Image
                width={100}
                height={10000}
                src="/Images/seeker-icon.svg"
                alt=""
                className="w-12 h-12 mr-5"
              />
              <div className="mr-8">Seeker Name</div>
              <Link href="#about-me" className="mr-8 font-bold">
                About me
              </Link>
              <Link href="#work-experience" className="mr-8 font-bold">
                Work Experience
              </Link>
              <Link href="#general-info" className="mr-8 font-bold">
                General information
              </Link>
            </div>
          </div>
          <br />
          <div
            style={{
              backgroundColor: colorToRGBA(
                color?.primaryAccent,
                color?.opacity
              ),
            }}
          >
            <div className="w-2/4 mx-auto py-6 px-6 flex justify-center text-center">
              <div className="py-6 px-6">
                <div
                  style={{ color: color?.btnAccent }}
                  className=" px-6 text-3xl font-bold"
                >
                  Work @Seeker Name
                </div>
                <div
                  style={{ color: color?.btnAccent }}
                  className="mt-10 font-bold underline"
                >
                  Video Presentation
                </div>
                <div className="mt-10 mx-auto w-max">
                  <SkillTab skills={["Skill1", "Skill2", "Skill3", "Skill4"]} />
                </div>
                <ButtonWrapper classNames="mt-10 px-8 py-4 cursor-pointer">
                  View CV
                </ButtonWrapper>
              </div>
            </div>
          </div>

          {/* About me section */}
          <div id="about-me-section" className="mt-10">
            <Subheader subHeader="About me" />
            <div
              style={{
                backgroundColor: color?.innerBg,
              }}
            >
              <div className="font-thin w-2/4 mx-auto py-6">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam
                pellentesque laoreet risus, non aliquet sem scelerisque ac.
                Pellentesque nec consequat odio. Proin rutrum, ligula a porta
                hendrerit, nulla mauris tempor elit, ut varius dui tellus eget
                nulla. Etiam suscipit, est ac semper efficitur, erat lacus
                pharetra massa. Vivamus commodo sapien eros, non laoreet metus
                pretium et. Integer lobortis turpis porttitor, efficitur dolor
                at, ultrices sem. Vestibulum facilisis porttitor quam sed
                pretium. Maecenas lorem enim, commodo non commodo ac, pharetra
                id velit. Curabitur non euismod sapien.
              </div>
            </div>
          </div>

          {/* Work Ex Section */}
          <div
            style={{ backgroundColor: color?.innerBg }}
            id="work-experience"
            className="mt-10"
          >
            <Subheader subHeader="Work Experience" />
            <div className="w-2/4 mx-auto">
              <WorkExCard />
              <br />
              <WorkExCard />
            </div>
          </div>

          {/* General Info Section */}
          <div
            style={{ backgroundColor: color?.innerBg }}
            id="general-info"
            className="mt-10"
          >
            <Subheader subHeader="General information" />
            <GeneralInfoCard />
          </div>
        </div>
      </div>
    </>
  );
}
