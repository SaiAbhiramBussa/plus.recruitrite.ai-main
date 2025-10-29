import { useState, useCallback } from "react";
import Select from "../Select";
import SkillTab from "../SkillTab";
import TextArea from "../TextArea";
import TextInput from "../TextInput";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("@/src/component/ButtonWrapper"), {
  ssr: false,
});

export default function AddExperienceForm() {
  let industries = [
    {
      key: "0",
      value: "Technology",
    },
    {
      key: "1",
      value: "Art",
    },
    {
      key: "2",
      value: "Science",
    },
  ];

  let months = [
    {
      key: "0",
      value: "Jan",
    },
    {
      key: "1",
      value: "Feb",
    },
    {
      key: "2",
      value: "Mar",
    },
  ];

  const [selectedMonth, setSelectedMonth] = useState("");
  const [description, setDescription] = useState("");

  const skillsPlaceholder = () => {
    let ele = <SkillTab skills={["skill"]} />;
    return ele;
  };

  const [form, setForm] = useState({
    otp: "",
    password: "",
    repassword: "",
    first_name: "",
    last_name: "",
    aboutMe: "",
    setSignUpWith: () => {},
    name: "",
    state: {
      value: "",
      key: "",
    },
    zip: "",
    industry: {
      key: "",
      value: "",
    },
  });

  const setField = useCallback(
    (name: keyof typeof form, value: any) =>
      setForm((f) => ({ ...f, [name]: value })),
    [setForm]
  );

  return (
    <div>
      <div className="container mx-auto py-10 flex-col">
        <div className="font-semibold mb-5">Add your work experience</div>
        <div className="font-thin">
          Tell us about the experience you have had with different companies.
        </div>
        <TextInput
          name="jobRole"
          // value={showPreview ? updatedData.title : form.title}
          label={"Job role"}
          placeholder="Example: Advertising Manager"
          // onChange={(e) => setField("title", e.target.value)}
          // error={error?.key === "title" ? error.value : ""}
        />
        <TextInput
          name="companyName"
          // value={showPreview ? updatedData.title : form.title}
          label={"Company Name"}
          placeholder="Example: Startdate"
          // onChange={(e) => setField("title", e.target.value)}
          // error={error?.key === "title" ? error.value : ""}
        />
        <input
          type="checkbox"
          id="vehicle1"
          name="vehicle1"
          value="Bike"
          className="mr-3 ml-1 mt-4"
        />
        <label>Currently I have this job</label>
        <br></br>
        <div className="container flex">
          <div className="w-full pr-1">
            <Select
              items={months}
              label={"Start date"}
              selected={selectedMonth}
              placeholder={"Month"}
              setSelected={(e) => setSelectedMonth(e.target.value)}
              error={""}
            />
          </div>
          <div className="w-full pl-1 mt-6">
            <Select
              items={months}
              label={" "}
              selected={selectedMonth}
              placeholder={"Year"}
              setSelected={(e) => setSelectedMonth(e.target.value)}
              error={""}
            />
          </div>
        </div>
        <div className="container flex">
          <div className="w-full pr-1">
            <Select
              items={months}
              label={"End date"}
              selected={selectedMonth}
              placeholder={"Month"}
              setSelected={(e) => setSelectedMonth(e.target.value)}
              error={""}
            />
          </div>
          <div className="w-full pl-1 mt-6">
            <Select
              items={months}
              label={" "}
              selected={selectedMonth}
              placeholder={"Year"}
              setSelected={(e) => setSelectedMonth(e.target.value)}
              error={""}
            />
          </div>
        </div>
        <Select
          items={months}
          label={"Sector"}
          selected={selectedMonth}
          placeholder={"Select data"}
          setSelected={(e) => setSelectedMonth(e.target.value)}
          error={""}
        />
        <TextArea
          rows={6}
          label={"Description"}
          value={description}
          placeholder={"Description"}
          onChange={(e) => setDescription(e.target.value)}
          error={""}
          onValue={(value) => setDescription(value)}
        />
        <ButtonWrapper classNames="flex w-max items-center rounded-sm border border-transparent px-8 py-4 text-base font-medium shadow-sm focus:outline-none mt-8">
          Save Changes
        </ButtonWrapper>
      </div>
    </div>
  );
}
