import Alert from "./Alerts"

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string | null
  section?: any;
  scetion?: any;
  onValue?(value: string, event: React.ChangeEvent<HTMLTextAreaElement>): void | Promise<void>
}

export default function TextArea({ label, error = '', onValue, ...props }: Props) {
  return <div className={`w-full ${props.section === "profile" ? 'mt-6' : 'mt-8'}`}>
      <label htmlFor={label} className="block text-sm font-semibold">{label}</label>
      <div className="border-[1px] rounded-md border-gray-200 mt-1">
          <textarea id={label} name={label} {...props}
              className={`block w-full  ${props.section === "profile" || props.section === "employer" ? 'placeholder:text-sm border-gray-200 py-2' : 'border-gray-300  py-4'}  rounded-md  shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-light px-2`}
              onChange={async (event) => {
                  await onValue?.call(event.target, event.target.value, event)
                  return props.onChange?.call(event.target, event)
              }}
          />
      </div>
      {error && (
        <div className="mt-4">
          <Alert type={"error"} msg={error} />
        </div>
      )}
  </div>
}