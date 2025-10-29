import Image from "next/image";
import Link from "next/link";

export default function BlogSection() {
  return (
    <div className="flex flex-col items-center mx-auto mb-6">
      <div className="text-sm mb-6">
        You can read some of our in-house blogs while we curate candidates for
        you!
      </div>
      <div className="flex w-1/2 mx-auto">
        <Link
          target="_blank"
          href="https://www.linkedin.com/pulse/your-employees-finding-productive-work-company-craig-hardy-wf2dc/"
          passHref
        >
          <div className=" border mr-4 shadow hover:scale-105 transition-all duration-500">
            <div className="">
              <Image
                src="https://neilpatel.com/wp-content/uploads/2017/08/Statistical_Case_Company_Culture_Growth_Everywhere_png__800_8714_-6.png"
                className="h-44"
                alt="image"
                width={1000}
                height={64}
              />
            </div>
            <div className="flex flex-wrap py-6 px-2 font-bold h-28">
              Are your employees finding productive work at your company?
            </div>
          </div>
        </Link>
        <Link
          target="_blank"
          href="https://www.linkedin.com/pulse/arranging-interviews-highlight-your-companys-culture-craig-hardy-r28xc/?trackingId=TFxCTjCdATMW3F82HUMoCA%3D%3D"
          passHref
        >
          <div className=" border shadow hover:scale-105 transition-all duration-500">
            <div className="">
              <Image
                src="https://images.ctfassets.net/pdf29us7flmy/nFQzlQRFpWdpAaVgN1bUV/7b4dc7d3b728810c8194555f759e8e3d/motivational_interview_GettyImages-1142966869-red_.jpg"
                className="h-44"
                alt="image"
                width={1000}
                height={64}
              />
            </div>
            <div className="flex flex-wrap py-6 px-2 font-bold h-28">
            Arranging Interviews that Highlight your Company's Culture
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
