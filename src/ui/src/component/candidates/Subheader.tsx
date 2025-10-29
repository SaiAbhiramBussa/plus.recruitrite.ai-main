import AppContext from "@/src/context/Context";
import { useContext } from "react";

export default function Subheader(props: any) {
  const { color } = useContext(AppContext);
  const { subHeader } = props;

  return (
    <div
      style={{ backgroundColor: color.innerBg, borderColor: color.outerBg }}
      className="py-6 font-bold flex items-center justify-between border-b-2"
    >
      <div className="w-2/4 mx-auto">{subHeader}</div>
    </div>
  );
}
