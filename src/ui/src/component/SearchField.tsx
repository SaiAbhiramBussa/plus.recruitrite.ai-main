import { useContext, useState } from "react";
import AppContext from "../context/Context";

export const SearchField = ({ onChange }: any) => {
  const [query, setQuery] = useState("");
  const { color } = useContext(AppContext);

  const handleSubmit = (event: any) => {
    event.preventDefault();
    onChange(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mr-4">
      <input
        style={{ backgroundColor: color.outerBg }}
        type="text"
        className="w-full py-3 px-3 rounded"
        placeholder="Search companies"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {/* <button type="submit">Search</button> */}
    </form>
  );
};
