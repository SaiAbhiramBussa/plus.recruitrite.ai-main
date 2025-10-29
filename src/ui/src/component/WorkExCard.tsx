import { useEffect, useState } from "react";
import TextArea from "./TextArea";
import TextInput from "./TextInput";
import momment from "moment";
import { colorToRGBA } from "../utils/misc";

export default function WorkExCard(props: any) {
  const { color } = props;
  const [showEditForm, setShowEditForm] = useState(false);
  const [updateEnabled, setUpdatedEnabled] = useState(false);

  const openCard = () => {
    setShowEditForm(true);
  };

  const createWorkHistory = () => {
    if (props.validateWorkHistory(form)?.key != "") {
      setError(props.validateWorkHistory(form));
      return;
    }
    props.updateWorkEx(props?.data?.id, form);
    setShowEditForm(false);
  };

  const [error, setError] = useState<{
    key: keyof typeof form | "";
    value: any;
  }>({ key: "" as any, value: "" });

  const [form, setForm] = useState({
    title: props?.data?.title || "",
    description: props?.data?.description || "",
    from_date: props?.data?.from_date || "",
    company: props?.data?.company || "",
    to_date: props?.data?.to_date || "",
  });

  useEffect(() => {
    validateForm();
    momment(form.to_date).isSameOrAfter(
      momment(new Date()).format("YYYY-MM-DD")
    )
      ? setShowCurrentDate(true)
      : setShowCurrentDate(false);
  }, [form]);

  const validateForm = () => {
    if (!form.company || !form.from_date || !form.to_date || !form.title) {
      setUpdatedEnabled(false);
    } else {
      setUpdatedEnabled(true);
    }
  };

  const [showCurrentDate, setShowCurrentDate] = useState<boolean>(false);

  const takeCurrentDate = () => {
    if (showCurrentDate) setForm((f: any) => ({ ...f, to_date: "" }));
    else
      setForm((f: any) => ({
        ...f,
        to_date: new Date().toISOString().split("T")[0],
      }));
    setShowCurrentDate(!showCurrentDate);
  };

  return showEditForm ? (
    <div
      style={{ backgroundColor: colorToRGBA(color?.outerBg, 0.25) }}
      className="px-2 pb-4 pt-2 mb-4 rounded-sm mt-2 shadow-md"
    >
      <TextInput
        name="Company"
        value={form.company}
        label={"Company"}
        placeholder={form.company || "Company name"}
        section="profile"
        onChange={(e) => {
          setError({ key: "company", value: "" });
          setForm((f: any) => ({ ...f, company: e.target.value }));
        }}
        error={error?.key === "company" ? error.value : ""}
      />
      <TextInput
        name="Title"
        value={form.title}
        label={"Title"}
        placeholder={form.title || "Designation"}
        section="profile"
        onChange={(e) => {
          setError({ key: "title", value: "" });
          setForm((f: any) => ({ ...f, title: e.target.value }));
        }}
        error={error?.key === "title" ? error.value : ""}
      />
      <TextInput
        name="Start date"
        value={form.from_date}
        label={"Start date"}
        type="Date"
        placeholder={form.from_date || "YYYY-MM-DD"}
        section="profile"
        onChange={(e) => {
          setError({ key: "from_date", value: "" });
          setForm((f: any) => ({ ...f, from_date: e.target.value }));
        }}
        error={error?.key === "from_date" ? error.value : ""}
      />
      <TextInput
        name="End date"
        value={form.to_date}
        type="Date"
        label={"End date"}
        placeholder={form.to_date || "YYYY-MM-DD"}
        section="profile"
        onChange={(e) => {
          setError({ key: "to_date", value: "" });
          setForm((f: any) => ({ ...f, to_date: e.target.value }));
        }}
        error={error?.key === "to_date" ? error.value : ""}
      />
      <label className="text-xs font-light mt-3 ml-2 flex">
        <input
          type="checkbox"
          className="mr-1"
          onChange={takeCurrentDate}
          checked={showCurrentDate}
        />
        I currently work here
      </label>
      <TextArea
        name="Description"
        value={form?.description}
        label={"Description"}
        rows={4}
        placeholder={form?.description}
        section="profile"
        onChange={(e) =>
          setForm((f: any) => ({
            ...f,
            description: e.target.value,
          }))
        }
        onValue={(value) => setForm((f: any) => ({ ...f, description: value }))}
      />
      <div className="flex justify-end mt-2">
        <div>
          <button
            style={{ color: color?.primaryAccent }}
            onClick={() => {
              createWorkHistory();
            }}
            disabled={!updateEnabled}
            className={`mr-6 text-sm ${
              updateEnabled ? "" : "cursor-not-allowed opacity-80"
            }`}
          >
            Update
          </button>
        </div>
        <div>
          <button
            style={{ color: color?.primaryAccent }}
            onClick={() => setShowEditForm(false)}
            className="text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div
      className="border flex rounded justify-between px-4 py-4 border-gray-200 w-full shadow mb-1 hover:shadow-sm cursor-pointer"
      onClick={openCard}
    >
      <div>
        <div className="font-semibold text-sm">{props?.data?.title}</div>
        <div className="text-xs font-light">{props?.data?.company}</div>
      </div>
      <button
        style={{ color: color?.primaryAccent }}
        className="text-sm cursor-pointer"
        onClick={() => props.deleteWorkCard(props.data.id, "is_deleted", true)}
      >
        Remove
      </button>
    </div>
  );
}
