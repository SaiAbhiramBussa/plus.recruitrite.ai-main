import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import Alert from "./Alerts";

type Props = {
  label: string;
  value: string;
  error?: string;
  placeholder: string;
  onChange(value: React.ChangeEvent<HTMLInputElement>): void;
};

export default function PasswordInput({
  label,
  value,
  error = "",
  placeholder,
  onChange,
}: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="w-full">
      <label htmlFor={label} className="block text-sm font-semibold">
        {label}
      </label>
      <div className="relative mt-4 rounded-md">
        <input
          type={show ? "text" : "password"}
          name={label}
          value={value}
          id={label}
          className="block border-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-lg font-light py-4 px-2"
          placeholder={placeholder}
          autoComplete="new-password"
          onChange={onChange}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {show && (
            <EyeIcon
              className="h-6 w-6 text-gray-700 cursor-pointer"
              onClick={() => setShow(!show)}
            />
          )}
          {!show && (
            <EyeSlashIcon
              className="h-6 w-6 text-gray-700 cursor-pointer"
              onClick={() => setShow(!show)}
            />
          )}
        </div>
      </div>
      {error && (
        <div className="mt-4">
          <Alert type={"error"} msg={error} />
        </div>
      )}
    </div>
  );
}
