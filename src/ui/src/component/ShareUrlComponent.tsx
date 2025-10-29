import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NextPage } from "next";
import Link from "next/link";
import { toast } from "react-toastify";
import { colorToRGBA } from "../utils/misc";

interface Props {
  shareUrl: string;
  color: any;
}

const ShareUrlComponent: NextPage<Props> = ({ shareUrl, color }) => {
  return (
    <div
      style={{ backgroundColor: color?.innerBg }}
      className="w-full p-2 rounded mt-2 flex justify-between"
    >
      <span>
        <Link
          style={{ color: color?.primaryAccent }}
          href={shareUrl}
          target="_blank"
          tabIndex={0}
          className="ml-1"
        >
          {shareUrl}
        </Link>
      </span>
      <FontAwesomeIcon
        icon={faCopy}
        style={{ color: colorToRGBA(color?.secondaryAccent, color?.opacity) }}
        className="h-5 ml-2 cursor-pointer hover:scale-110 transition-all"
        onClick={() => {
          navigator.clipboard.writeText(shareUrl);
          toast.success("Share link is copied", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
        }}
      />
    </div>
  );
};

export default ShareUrlComponent;
