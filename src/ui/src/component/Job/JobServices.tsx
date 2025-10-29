import { createJob, fetchJobDataById, fetchJobsData } from "@/src/services/job";
import { CognitoError, ICreateJob, Job } from "./types/createJobTypes";


const checkIsAdmin = () : boolean => {
  let user = localStorage.getItem('user')
  let isAdmin : boolean = false
  if(user)
  {
    let userParsed = JSON.parse(user);
    if(userParsed?.role == 'admin'){
      isAdmin = true;
    }
  }
  return isAdmin
}

export async function CreateNewJob({
  title,
  compensation,
  description,
  jobLocation,
  jobIndustry,
  workLocation,
  remoteType,
  location_id,
  skills,
  status,
  minimum_match
}: Job) {
  try {
    const geoLocation = jobLocation.value.split(", ");
    let job : any = {
      title,
      compensation,
      description,
      location_id,
      jobLocation: jobLocation.value,
      job_industry: jobIndustry.value,
      remote_type: workLocation.value === "remote" ? remoteType.option : null,
      city: geoLocation[0],
      state: geoLocation[1],
      country: geoLocation[2],
      work_location_type: workLocation.value,
      skills,
      status,
    }
    if(checkIsAdmin()){
      job = {
        ...job,
        minimum_match
      }
    }
    const result = await createJob(job);
    return {
      job: result,
    };
} catch (error) {
    return {
      job: undefined,
      error: error as CognitoError,
    };
  }
}

export const fetchJobs = async (job_type:string,perPagingNumber:number,pagingNumber:number) => {
  try {
    const response = await fetchJobsData(job_type,perPagingNumber,pagingNumber);
    return response;
  } catch (error) {
    return {
      job: undefined,
      error: error as CognitoError,
    };
  }
};

export const getDataById = async (id: any) => {
  try{
    const response = await fetchJobDataById(id);
    response.jobLocation = response?.city+', ' + response?.state+', ' + response?.country;
    return response;
  }
  catch(error){
    return {
      job: undefined,
      error: error as CognitoError,
    }
  }
}
