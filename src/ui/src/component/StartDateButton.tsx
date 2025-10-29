import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NextPage } from "next";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("./ButtonWrapper"), { ssr: false });
interface Props {
  isDisabled: boolean;
  action?: any;
  btnLabel: string;
  icon?: any;
}

const StartDateButton: NextPage<Props> = ({
  isDisabled,
  action,
  btnLabel,
  icon,
}) => {
  const handleAction = () => {
    if (action) action();
  };

  return (
    <ButtonWrapper
      disabled={isDisabled}
      classNames="cursor-pointer pl-3 pr-5 gap-1 py-2 rounded items-center flex font-medium"
      onClick={handleAction}
    >
      {icon ? <FontAwesomeIcon className="mx-1 h-4 w-4" icon={icon} /> : ""}{" "}
      {btnLabel}
    </ButtonWrapper>
  );
};

export default StartDateButton;
