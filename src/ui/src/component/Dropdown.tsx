import { useContext, useState } from "react";
import { useRouter } from "next/router";
import AppContext from "../context/Context";

export default function Dropdown(props: any) {
  const router = useRouter();
  const { color } = useContext(AppContext);
  const {
    list,
    placeholder,
    category,
    onDropDownChange,
    pushToTrainingData,
    downloadTrainingData,
    downloadPrescreenedData,
    data,
  } = props;

  const [selectedAction, setSelectedAction] = useState<string>();
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(
    router.query.companyid
  );
  const [selectedJob, setSelectedJob] = useState(" ");

  const handleDropdownChange = (event: any) => {
    const selectedValue = event.target.value;
    onDropDownChange(selectedValue);
    setSelectedJob(event.target.value);
    const optionId = event.target.value;
    const currentQuery = router.query;
    const newQuery = { ...currentQuery, jobid: optionId };
    router.push({ pathname: router.pathname, query: newQuery });
  };

  const selectOptionHandler = (event: any) => {
    const value = event.target.value;
    setSelectedOption(value);
    if (value === "2") {
      pushToTrainingData();
    }
    if (value === "0") {
      downloadTrainingData();
    }
  };

  const handleCompanyChange = (event: any) => {
    setSelectedCompany(event.target.value);
    const optionId = event.target.value;
    const currentQuery = router.query;
    const newQuery = { companyid: optionId };
    router.push({ pathname: router.pathname, query: newQuery });
  };

  return (
    <select
      style={{ backgroundColor: color.innerBg, color: color.secondaryAccent }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = color.outerBg)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = color.innerBg)
      }
      value={category === "job" ? selectedJob : selectedAction}
      onChange={
        category === "company"
          ? handleCompanyChange
          : category === "job"
          ? handleDropdownChange
          : category === "action"
          ? selectOptionHandler
          : (e) => setSelectedAction(e.target.value)
      }
      className="block appearance-none w-full border py-3 px-2 pr-8 rounded leading-tight focus:outline-none"
    >
      {list &&
        category === "company" &&
        list.map((option: any) => (
          <option key={option.value} value={option.id}>
            {option.name}
          </option>
        ))}
      {list &&
        category === "job" &&
        list.map((option: any) => (
          <option key={option.value} value={option?.job_id}>
            {option?.title}
          </option>
        ))}
      {list &&
        category === "action" &&
        list.map((option: any) => (
          <option key={option.value} value={option.id}>
            {option.title}
          </option>
        ))}
    </select>
  );
}
