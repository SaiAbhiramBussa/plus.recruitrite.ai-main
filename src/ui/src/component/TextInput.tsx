import { useContext } from "react";
import { colorToRGBA } from "../utils/misc";
import Alert from "./Alerts";
import AppContext from "../context/Context";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  section?: any;
  labelHelpIcon?: any;
  onValue?(
    value: string,
    event: React.ChangeEvent<HTMLInputElement>
  ): void | Promise<void>;
}

export default function TextInput({
  label,
  error = "",
  onValue,
  labelHelpIcon,
  ...props
}: Props) {
  const { color } = useContext(AppContext);
  props.value = String(props.value || "");

  return (
    <div className="w-full">
      <label
        htmlFor={label}
        className={`block ${
          props.section === "create_company"
            ? "mt-5"
            : props.section === "profile"
            ? "mt-6"
            : props.section === "advance_search"
            ? "mt-2"
            : "mt-8"
        } ${
          props.section === "advance_search" ? "text-xs" : "text-sm"
        } font-semibold`}
      >
        {label} {labelHelpIcon ? labelHelpIcon : ""}
      </label>
      <div
        className={`${
          props.section === "employer" ||
          props.section === "admin" ||
          props.section === "create_company" ||
          props.section === "advance_search"
            ? "mt-1"
            : "mt-1"
        }`}
      >
        <input
          id={label}
          name={label}
          {...props}
          style={{
            backgroundColor: color?.innerBg,
            borderColor: colorToRGBA(color?.secondaryAccent, 0.2),
          }}
          className={`block border-[1px] w-full rounded-md sm:text-sm py-2 font-light ${
            props.section === "profile" ||
            props.section === "advance_search" ||
            props.section === "employer" ||
            props.section === "admin" ||
            props.section === "create_company"
              ? "py-1 placeholder:text-sm"
              : "py-3"
          } px-2`}
          onChange={async (event) => {
            if (onValue)
              await onValue.call(event.target, event.target.value, event);
            return props.onChange && props.onChange(event);
          }}
        />
      </div>
      {error && (
        <div className="mt-4">
          <Alert type={"error"} msg={error} />
        </div>
      )}
    </div>
  );
}
