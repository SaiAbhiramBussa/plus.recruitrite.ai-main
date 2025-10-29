import axios from "axios";
import { toast } from "react-toastify";

export const createJob = async (job: any) => {
  try {
    let res = await axios.post(`${process.env.NEXT_PUBLIC_DOMAIN}/api/locations/${job.location_id}/jobs/`, { job }, {
      withCredentials: true,
    });
    return res;
  }
  catch (err) {
    return err;
  }
}

export const checkApolloJobCount = async (form: any) => {
  try {
    let res = await axios.post(`${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/apollo-jobs/total-count`, form, {
      withCredentials: true,
    });
    return res;
  }
  catch (err) {
    return err;
  }


}
export const createApolloJob = async (form: any) => {
  try {
    let res = await axios.post(`${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/apollo-jobs/detail`, form, {
      withCredentials: true,
    });
    return res;
  }
  catch (err) {
    return err;
  }
}

export const fetchJobsData = async (job_type: string, perPagingNumber: number, pagingNumber: number) => {
  try {
    let res = await axios.get(`${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/offers?page=${pagingNumber}&per_page=${perPagingNumber}&status=${job_type}`, {
      withCredentials: true,
    });
    let data = res.data;
    return data;
  }
  catch (err) {
    return err;
  }
}

export const fetchJobDataById = async (id: any) => {
  let res = await axios.get(`${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/${id}`, {
    withCredentials: true,
  });
  let data = res.data;
  return data;
}

export const fetchCompanyJobsById = async (id: any) => {
  let res = await axios.get(`${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${id}/job_posting`, {
    withCredentials: true,
  });
  let data = res.data;
  return data;
}

export const fetchCompanyById = async (id: any) => {
  let res = await axios.get(`${process.env.NEXT_PUBLIC_DOMAIN}/api/companies/${id}`, {
    withCredentials: true,
  });
  let data = res.data;
  return data;
}

let remoteType = [
  {
    'key': '0',
    'value': 'Within State',
    'option': 'state',
  },
  {
    'key': '1',
    'value': 'Within country',
    'option': 'country',
  },
  {
    'key': '2',
    'value': 'Global',
    'option': 'any_region',
  },
]

const checkIsAdmin = (): boolean => {
  let user = localStorage.getItem('user')
  let isAdmin: boolean = false
  if (user) {
    let userParsed = JSON.parse(user);
    if (userParsed?.role == 'admin') {
      isAdmin = true;
    }
  }
  return isAdmin
}

export const UpdateData = async (updatedJob: any, id: any) => {
  let remote_type = null;

  const geoLocation = updatedJob.jobLocation.split(", ");
  if (updatedJob.workLocation === "remote") {
    remote_type = remoteType.find((type: any) => type.value === updatedJob.remoteType)?.option;
  }

  let job: any = {
    title: updatedJob.title,
    compensation: updatedJob.compensation,
    description: updatedJob.description,
    city: geoLocation[0],
    state: geoLocation[1],
    country: geoLocation[2],
    workLocation: updatedJob.workLocation,
    skills: updatedJob.skills,
    status: updatedJob.status,
    remote_type: remote_type,
    work_location_type: updatedJob.workLocation,
  }

  if (checkIsAdmin()) {
    job = {
      ...job,
      minimum_match: updatedJob.minimum_match
    }
  }

  try {
    const res = await axios.patch(`${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/${id}/update`, { job }, {
      withCredentials: true,
    });
    return res;
  }
  catch (err) {
    return err;
  }
}

export const deleteJobById = async (id: any) => {
  try {
    const res = await axios.delete(`${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/${id}/delete`, {
      withCredentials: true,
    });
    return res;
  }
  catch (err) {
    return err;
  }
}

export const getCandidatesBySkills = async (id: any, pagingNumber?: any, perPagingNumber?: number, candidate_type?: any) => {
  try {
    let res = await axios.get(`${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/recommended/${id}?page=${pagingNumber}&per_page=${perPagingNumber}&candidate_type=${candidate_type}`, {
      withCredentials: true,
    });
    return res;
  }
  catch (err) {
    return err;
  }
}

export const getPreScreenedCandidates = async (id: string, page: number, per_page: number) => {
  try {
    let res = await axios.get(`${process.env.NEXT_PUBLIC_DOMAIN}/api/machine_learning/prescreen_candidates/${id}?page=${page}&per_page=${per_page}`, { withCredentials: true });
    return res;
  }
  catch (err) {
    return err;
  }
}

export const importCandidateFile = async (formData: any) => {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: true,
    });
    return response;
  } catch (error) {
    return error;
  }
}

export const importMultipleJobPosting = async (formData: any) => {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/multiple-import`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response;
  } catch (error) {
    return error;
  }
}

export const postOtherCandidate = async (formData: FormData, id: any) => {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/${id}/other_candidates`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return { data: response, success: true };
  } catch (error: any) {
    toast.error(error?.response?.data?.Error, {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000,
      hideProgressBar: true,
    });
    return { data: error, success: false };
  }
}

export const getOtherCandidate = async (pagingNumber: any, perPagingNumber: number, id: any, hiring_stage_null: boolean = false) => {

  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/${id}/other_candidates?page=${pagingNumber}&per_page=${perPagingNumber}&hiring_stage_null=${hiring_stage_null}`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response;
  } catch (error) {
    toast.error(`Something went wrong`, {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 10000,
      hideProgressBar: true,
    });
    return error;
  }
}

export const candidatesFromLoxo = async () => {
  try {
    const response = await axios.get('https://app.loxo.co/api/startdate-inc/people?fields=', {
      headers: {
        accept: 'application/json',
        authorization: 'Basic c3RhcnRkYXRlLWluY19hcGk6cWZkMmNlciFqcHI0S1pHKmdjbQ=='
      }
    })
    return response;
  }
  catch (err) {
    return err;
  }
}
