import { Switch } from "@headlessui/react";
import { Dispatch, Fragment, SetStateAction, useContext } from "react";
import AppContext from "../context/Context";

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

type Props = {
  enabled: boolean;
  setEnabled: Dispatch<SetStateAction<any>>;
};
export default function Toggle({ enabled, setEnabled }: Props) {
  const { color } = useContext(AppContext);

  return (
    <Switch
      checked={enabled}
      onChange={setEnabled}
      className="group relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none"
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        style={{ backgroundColor: color.innerBg }}
        className="pointer-events-none absolute h-full w-full rounded-md"
      />
      <span
        aria-hidden="true"
        style={
          enabled
            ? { backgroundColor: color.primaryAccent }
            : { backgroundColor: color.outerBg }
        }
        className="pointer-events-none absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out"
      />
      <span
        aria-hidden="true"
        style={{ backgroundColor: color.innerBg, borderColor: color.outerBg }}
        className={classNames(
          enabled ? "translate-x-5" : "translate-x-0",
          "pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border shadow ring-0 transition-transform duration-200 ease-in-out"
        )}
      />
    </Switch>
  );
}
