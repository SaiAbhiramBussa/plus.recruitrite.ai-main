import { Dispatch, Fragment, SetStateAction, useContext } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import Alert from "./Alerts";
import _ from "lodash";
import AppContext from "../context/Context";

type Props = {
  label?: string;
  items: any;
  error?: string;
  placeholder: string;
  selected: any;
  dense?: boolean;
  width?: string;
  disabled?: boolean;
  setSelected: Dispatch<SetStateAction<any>>;
  section?: any;
  onKeyDown?: any;
  isLocation?: any;
};

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

const getOptionLabel = (option: any) => {
  const addressParts = _.compact([
    option?.state,
    option?.city,
    option?.address,
  ]);
  const formattedAddress = `${addressParts[1] && addressParts[1]} (${
    addressParts[0] && addressParts[0]
  }, ${addressParts[2] && addressParts[2]})`;
  return formattedAddress;
};

export default function Select(props: Props) {
  const { isLocation } = props;
  const { color } = useContext(AppContext);

  return (
    <Listbox
      disabled={props.disabled ? true : false}
      value={props.selected}
      onChange={props.setSelected}
    >
      {({ open }) => (
        <div className="flex-col">
          {props.label && (
            <Listbox.Label
              className={`${
                props.section === "employer" ? "mt-8" : "mt-5"
              } block text-sm`}
            >
              {props.label}
            </Listbox.Label>
          )}
          <div className={`relative mt-1`}>
            <Listbox.Button
              className={classNames(
                "flex relative mt-1 cursor-default border w-full rounded-md sm:text-sm font-light content-center",
                props.dense ? "h-12" : "",
                props.width ? props.width : "",
                props.section === "employer" || props.section === "admin"
                  ? "h-10 pt-2 pl-2 "
                  : "py-3 px-2"
              )}
            >
              <span
                className={
                  props.selected
                    ? "block truncate"
                    : "block truncate font-light"
                }
              >
                {props.selected ? (
                  props.selected.value ? (
                    props.selected.value
                  ) : props.selected?.name ? (
                    props.selected.name
                  ) : (
                    props.selected
                  )
                ) : (
                  <span
                    className={`${
                      props.section === "employer" || props.section === "admin"
                        ? "text-sm font-light"
                        : ""
                    }`}
                  >
                    {props.placeholder}
                  </span>
                )}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                style={{ backgroundColor: color?.innerBg }}
                className="absolute z-10 mt-1 w-full max-h-60 w-inherit overflow-auto rounded-md py-1 text-base shadow-lg ring-1 ring-opacity-5 focus:outline-none sm:text-sm"
              >
                {props.items.map((item: any, index: any) => (
                  <Listbox.Option
                    key={item.key}
                    style={{
                      backgroundColor: color?.innerBg,
                      color: color?.secondaryAccent,
                    }}
                    onMouseEnter={(e: any) => {
                      e.currentTarget.style.backgroundColor =
                        color?.primaryAccent;
                      e.currentTarget.style.color = color?.innerBg;
                    }}
                    onMouseLeave={(e: any) => {
                      e.currentTarget.style.backgroundColor = color?.innerBg;
                      e.currentTarget.style.color = color?.secondaryAccent;
                    }}
                    className="relative cursor-default select-none py-4 pl-3 pr-9"
                    value={item}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={classNames(
                            selected ? "font-medium" : "font-normal",
                            "block truncate"
                          )}
                        >
                          {isLocation
                            ? getOptionLabel(item)
                            : item.value
                            ? item.value
                            : item.name}
                        </span>

                        {selected ? (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
          {props.error && (
            <div className="mt-4">
              <Alert type={"error"} msg={props.error} />
            </div>
          )}
        </div>
      )}
    </Listbox>
  );
}
