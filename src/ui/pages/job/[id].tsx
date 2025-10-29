import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getDataById } from "@/src/component/Job/JobServices";
import JobPage from "./create";
import Loader from "@/src/component/Loader";
import AuthGuard from "@/src/component/AuthGuard";

type Props = {
};

const JobEditPage = (props: Props) => {
  const router = useRouter();
  const {id} = router.query

  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if(localStorage.getItem('user')){
      fetchData(id);
    }
    else{
      window.location.href = '/signin'
      history.pushState(null, '/signin'); 
    }
  }, [id])

  const fetchData = async(id: any) => {
    setIsLoading(true);
    try{
      const result = await getDataById(id);
      setData(result);
    }
    catch(err){
    }
    finally{
      setIsLoading(false)
    }
  }

  return (
    <div>
      {isLoading ? <div className="flex h-screen w-full justify-center items-center"><Loader /></div> : <JobPage showPreview={true} companyData={data} />}
    </div>
  );
}

export default AuthGuard(JobEditPage);
