import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
import AppContext from "../context/Context";
import { colorToRGBA } from "../utils/misc";

export const Option = ({
  innerProps,
  label,
  data,
  isDisabled,
  isSelected,
  value,
}: any) => {
  const { color } = useContext(AppContext);

  return (
    <div
      {...innerProps}
      style={{
        backgroundColor: isSelected ? color?.outerBg : color?.innerBg,
        color: isDisabled
          ? colorToRGBA(color?.secondaryAccent, color.opacity)
          : color?.secondaryAccent,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = colorToRGBA(
          color?.outerBg,
          color.opacity
        ))
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = isSelected
          ? color?.outerBg
          : color?.innerBg)
      }
      className="flex items-center px-2 py-2 border-b disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
    >
      {data.icon ? <FontAwesomeIcon icon={data.icon} className="mr-4" /> : null}
      <span className="font-normal text-sm">{label}</span>
    </div>
  );
};
