import { useEffect, useState } from "react";
import TextInput from "./TextInput";

export default function EduExParsedCard(props: any) {
  const { color } = props;
  const [showEditForm, setShowEditForm] = useState(false);
  const [updateEnabled, setUpdatedEnabled] = useState(false);
  const [error, setError] = useState<{
    key: keyof typeof form | "";
    value: any;
  }>({ key: "" as any, value: "" });

  const [form, setForm] = useState({
    name: props?.data?.name || "",
    degree: props?.data?.degree || "",
    from_date: props?.data?.from_date || null,
    to_date: props?.data?.to_date || null,
  });

  const openEduCard = () => {
    setShowEditForm(true);
  };

  const createEduHistory = () => {
    props.updateEduEx(props?.data?.id, form);
    setShowEditForm(false);
  };

  useEffect(() => {
    validateForm();
  }, [form]);

  const validateForm = () => {
    if (!form.degree || !form.from_date || !form.to_date || !form.name) {
      setUpdatedEnabled(false);
    } else {
      setUpdatedEnabled(true);
    }
  };

  return (
    <div
      style={{ backgroundColor: color?.outerBg }}
      className="mb-4 px-2 pb-4 pt-2 rounded mt-2"
    >
      <div className="flex">
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
      </div>
      <div className="flex">
        <TextInput
          name="Start date"
          value={form.from_date}
          label={"Start date"}
          type="Date"
          placeholder={form.from_date || "YYYY-MM-DD"}
          section="profile"
          onChange={(e) => {
            setForm((f: any) => ({
              ...f,
              from_date: e.target.value,
            }));
          }}
        />
        <TextInput
          name="End date"
          value={form.to_date}
          type="Date"
          label={"End date"}
          placeholder={form.to_date || "YYYY-MM-DD"}
          section="profile"
          onChange={(e) => {
            setForm((f: any) => ({
              ...f,
              to_date: e.target.value,
            }));
          }}
        />
      </div>
      <div
        style={{ color: color?.primaryAccent }}
        className="flex justify-end mt-2"
      >
        <div>
          <button
            onClick={createEduHistory}
            disabled={!updateEnabled}
            className={`mr-6 text-sm ${
              updateEnabled ? "" : "cursor-not-allowed opacity-80"
            }`}
          >
            Update
          </button>
        </div>
        <div>
          <button onClick={() => setShowEditForm(false)} className="text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
