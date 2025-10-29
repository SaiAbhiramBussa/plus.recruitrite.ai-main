import axios from "axios"
import { toast } from "react-toastify";
import { showErrorToast, showSuccessToast } from "../common/common.util";
import _ from "lodash";

const baseUrl = `${process.env.NEXT_PUBLIC_DOMAIN}/api`

export const getCreditsLeft = async () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '')

        const response = await axios.get(`${baseUrl}/companies/${user.company_id}/subscriptions/`, {
            withCredentials: true,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return response?.data?.find(
            (item: any) => item.subscription === "screening_records"
        );
    } catch (error) {
        toast.error(`Something went wrong`, {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 10000,
            hideProgressBar: true,
        });
        return error;
    }
}

export const rankCandidates = async (jobId: string, payload: any) => {
    try {
        let res = await axios.patch(`${baseUrl}/machine_learning/training_candidates/${jobId}/update`, payload, { withCredentials: true });
        showSuccessToast("Updated rank");
        return res;
    } catch (err : any) {
        showErrorToast(err.response.data.Error || err.message)
    }
}

export const postWeightages = async (payload: any, jobId: string) => {
    try {
        let res = await axios.post(`${baseUrl}/jobs/${jobId}/label_weightages`, payload, { withCredentials: true });
        showSuccessToast("Weightage Updated");
        return res;
    } catch (err: any) {
        showErrorToast(err.response.data?.Error?.pop() || err.response.data?.Error || err.message)
    }
}

export const getWeightages = async (jobId: string) => {
    try {
        let res = await axios.get(`${baseUrl}/jobs/${jobId}/label_weightages`, { withCredentials: true });
        return res;
    } catch (err : any) {
        showErrorToast(err.response.data.Error || err.message)
    }
}

export const getDefaultWeightages = async (jobId: string) => {
    try {
        let res = await axios.get(`${baseUrl}/jobs/${jobId}/label_weightages/defaults`, { withCredentials: true });
        return res;
    } catch (err : any) {
        showErrorToast(err.response.data.Error || err.message)
    }
}

export const deleteJobTitleMappings = async (jobId: string) => {
    try {
        let res = await axios.delete(`${baseUrl}/job_titles/${jobId}/mappings`, { withCredentials: true });
        return res;
    } catch (err : any) {
        showErrorToast(err.response.data.Error || err.message)
    }
}

export const deleteJobTitle = async (jobId: string) => {
    try {
        let res = await axios.delete(`${baseUrl}/job_titles/${jobId}`, { withCredentials: true });
        return res;
    } catch (err : any) {
        showErrorToast(err.response.data.Error || err.message)
    }
}

export const getAllJobTitles = async (searchQuery: string) => {
    try {
        let url = searchQuery ? `${baseUrl}/job_titles/?title=${searchQuery}` : `${baseUrl}/job_titles/`
        let res = await axios.get(url, { withCredentials: true });
        return res;
    } catch (err : any) {
        showErrorToast(_.get(err, 'response.data.Error') || err.message)
    }
}

export const getSpecificJobTitles = async (jobId: string) => {
    try {
        let url = `${baseUrl}/job_titles/${jobId}/mappings`
        let res = await axios.get(url, { withCredentials: true });
        return res;
    } catch (err : any) {
        showErrorToast(_.get(err, 'response.data.Error') || err.message)
    }
}

export const addMappingToJobTitle = async (jobId: string, payload: any) => {
    try {
        let url = `${baseUrl}/job_titles/${jobId}/mappings`
        let res = await axios.post(url, payload, { withCredentials: true });
        return res;
    } catch (err : any) {
        showErrorToast(_.get(err, 'response.data.Error') || err.message)
    }
}

export const newJobTitle = async (payload: {'job_title': string}) => {
    try {
        let url = `${baseUrl}/job_titles/`
        let res = await axios.post(url, payload, { withCredentials: true });
        return res;
    } catch (err : any) {
        showErrorToast(_.get(err, 'response.data.Error') || err.message)
    }
}

export const getHelpWithJobs = async(payload: {'job_title': string, 'help_type': string}) => {
    try {
        let url = `${baseUrl}/subscriptions/get_help_with_jobs`
        let res = await axios.post(url, payload, { withCredentials: true });
        return res;        
    } catch (err : any) {
        showErrorToast(_.get(err, 'response.data.Error') || err.message)
    }
}


export const getEmployees = async (params: { [key: string]: any }) => {
    try {
        let url = `${baseUrl}/accounts/fetch_employees`;
        let res = await axios.get(url, { params, withCredentials: true });
        return res;
    } catch (err: any) {
        showErrorToast(_.get(err, 'response.data.Error') || err.message);
    }
};

export const shareCreditsAPI = async (payload: {}, params: {}) => {
        const url = `${baseUrl}/accounts/share_credits`; // Ensure baseUrl is defined
        const res = await axios.post(url, payload, {
            params,
            withCredentials: true,
        });
        console.log(res);
        return res;
};

export const getCandidatesForJobs = async(payload: {'job_ids': string[], 'candidates': number}) => {
    try {
        let url = `${baseUrl}/candidates/fetch_candidates`;
        let res = await axios.post(url, payload, { withCredentials: true });
        return res;        
    } catch (err : any) {
        console.log(err)
        showErrorToast(_.get(err, 'response.data.error') || err.message)
    }
}

export const setLanguage = async(payload: {'language': string}) => {
    try {
        let url = `${baseUrl}/accounts/user_language`;
        let res = await axios.patch(url, payload, { withCredentials: true });
        return res;        
    } catch (err : any) {
        console.log(err)
        showErrorToast(_.get(err, 'response.data.error') || err.message)
    }
}

export const getUserLanguage = async(params: {}) => {
    try {
        let url = `${baseUrl}/accounts/user_language`;
        let res = await axios.get(url, { withCredentials: true });
        return res;        
    } catch (err : any) {
        console.log(err)
        showErrorToast(_.get(err, 'response.data.error') || err.message)
    }
}

