import { useEffect, useState } from "react";
import TextInput from "./TextInput";

export default function EduExCard(props: any) {
  const [showEditForm, setShowEditForm] = useState(false);
  const { color } = props;
  const [updateEnabled, setUpdatedEnabled] = useState(false);
  const [error, setError] = useState<{
    key: keyof typeof form | "";
    value: any;
  }>({ key: "" as any, value: "" });

  const [form, setForm] = useState({
    name: props?.data?.name || "",
    degree: props?.data?.degree || "",
    edu_from_date: props?.data?.from_date || null,
    edu_to_date: props?.data?.to_date || null,
  });

  const openEduCard = () => {
    setShowEditForm(true);
  };

  const changeKeyOfObj = (obj: any) => {
    if (obj.key == "edu_from_date") obj.key = "from_date";
    else if (obj.key == "edu_to_date") obj.key = "to_date";
    return obj;
  };
  const createEduHistory = () => {
    let error = props.validateEduHistory(form);
    if (error.key != "") {
      setError(error);
      return;
    }
    props.updateEduEx(props?.data?.id, changeKeyOfObj(form));
    setShowEditForm(false);
  };

  useEffect(() => {
    validateForm();
  }, [form]);

  const validateForm = () => {
    if (
      !form.degree ||
      !form.edu_from_date ||
      !form.edu_to_date ||
      !form.name
    ) {
      setUpdatedEnabled(false);
    } else {
      setUpdatedEnabled(true);
    }
  };

  return showEditForm ? (
    <div
      style={{ backgroundColor: color?.outerBg }}
      className="mb-4 px-2 pb-4 pt-2 rounded mt-2"
    >
      <TextInput
        name="University/College name"
        label={"University/College name"}
        value={form.name}
        placeholder={form.name}
        section="profile"
        onChange={(e) => {
          setError({ key: "name", value: "" });
          setForm((f: any) => ({ ...f, name: e.target.value }));
        }}
        error={error?.key === "name" ? error.value : ""}
      />
      <TextInput
        name="Degree"
        value={form.degree}
        label={"Degree"}
        placeholder={form.degree}
        section="profile"
        onChange={(e) => {
          setError({ key: "degree", value: "" });
          setForm((f: any) => ({ ...f, degree: e.target.value }));
        }}
        error={error?.key === "degree" ? error.value : ""}
      />
      <TextInput
        name="Start date"
        value={form.edu_from_date}
        label={"Start date"}
        type="Date"
        placeholder={form.edu_from_date || "YYYY-MM-DD"}
        section="profile"
        onChange={(e) => {
          setError({ key: "edu_from_date", value: "" });
          setForm((f: any) => ({
            ...f,
            edu_from_date: e.target.value,
          }));
        }}
        error={error?.key === "edu_from_date" ? error.value : ""}
      />
      <TextInput
        name="End date"
        value={form.edu_to_date}
        type="Date"
        label={"End date"}
        placeholder={form.edu_to_date || "YYYY-MM-DD"}
        section="profile"
        onChange={(e) => {
          setError({ key: "edu_to_date", value: "" });
          setForm((f: any) => ({
            ...f,
            edu_to_date: e.target.value,
          }));
        }}
        error={error?.key === "edu_to_date" ? error.value : ""}
      />
      <div
        style={{ color: color?.primaryAccent }}
        className="flex justify-end mt-2"
      >
        <button
          onClick={() => {
            createEduHistory();
          }}
          disabled={!updateEnabled}
          className={`mr-6 text-sm ${
            updateEnabled ? "" : "cursor-not-allowed opacity-80"
          }`}
        >
          Update
        </button>
        <button onClick={() => setShowEditForm(false)} className="text-sm">
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <div>
      <div
        style={{ borderColor: color?.outerBg }}
        className="border flex rounded justify-between px-4 py-4 w-full shadow mb-1"
      >
        <div onClick={openEduCard} className="cursor-pointer">
          <div className="font-semibold text-sm">{props?.data?.name}</div>
          <div className="text-xs font-light">{props?.data?.degree}</div>
        </div>
        <div
          style={{ color: color?.primaryAccent }}
          className="text-sm cursor-pointer"
          onClick={() => props.deleteEduCard(props.data.id, "is_deleted", true)}
        >
          Remove
        </div>
      </div>
    </div>
  );
}
