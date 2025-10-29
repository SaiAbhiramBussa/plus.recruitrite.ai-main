import { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

export default function Filter(props: any){

  const {filterBySkill, filterByKeyword, filterByPosition, filterByLocation} = props;
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFilteringOptions, setShowFilteringOptions] = useState<boolean>(false);
  const [showFilteringOptions2, setShowFilteringOptions2] = useState<boolean>(false);
  const [showFilteringOptions3, setShowFilteringOptions3] = useState<boolean>(false);
  const [filterBySkillValue, setFilterBySkillValue] = useState<any>('');
  const [filterByKeywordValue, setFilterByKeywordValue] = useState<any>('');
  const [filterByPositionValue, setFilterByPositionValue] = useState<any>('');
  const [filterByLocationValue, setFilterByLocationValue] = useState<any>('');

  useEffect(() => {
    setLoading(false)
  }, [])

  const handleLocationChange = (event: any) => {
    setLocation(event.target.value);
  };

  const handleCategoryChange = (event: any) => {
    setCategory(event.target.value);
  };

  return (
    <>
    {!loading &&
    <div className="w-full flex flex-col justify-center items-center">
      <div className="items-center my-4">
        <div className="w-1/4 text-sm ml-2">Keyword:</div>
        <input type="text" className="border w-3/4 rounded mx-2" value={filterByKeywordValue} onChange={(e) => setFilterByKeywordValue(e.target.value)} onKeyDown={(e:any)=>{if(e.keyCode === 13) filterByKeyword(filterByKeywordValue)}} />
      </div>
      <div className="items-center my-4">
        <div className="w-1/4 text-sm ml-2">Skill:</div>
        <input type="text" className="border w-3/4 rounded mx-2" value={filterBySkillValue} onChange={(e) => setFilterBySkillValue(e.target.value)} onKeyDown={(e:any)=>{if(e.keyCode === 13) filterBySkill(filterBySkillValue)}} />
      </div>
      <div className="items-center my-4">
        <div className="w-1/4 text-sm ml-2">Position:</div>
        <input type="text" className="border w-3/4 rounded mx-2" value={filterByPositionValue} onChange={(e) => setFilterByPositionValue(e.target.value)} onKeyDown={(e:any)=>{if(e.keyCode === 13) filterByPosition(filterByPositionValue)}} />
      </div>
      <div className="items-center my-4">
        <div className="w-1/4 text-sm ml-2">Location:</div>
        <input type="text" className="border w-3/4 rounded mx-2" value={filterByLocationValue} onChange={(e) => setFilterByLocationValue(e.target.value)} onKeyDown={(e:any)=>{if(e.keyCode === 13) filterByLocation(filterByLocationValue)}} />
      </div>
    </div>
    }
    </>
  );
};