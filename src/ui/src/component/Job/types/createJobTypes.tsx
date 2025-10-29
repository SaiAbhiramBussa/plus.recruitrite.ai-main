export interface Job {
  title: string;
  compensation: string;
  description: string;
  jobLocation: any;
  jobIndustry: any;
  city: string;
  state: string;
  country: string;
  workLocation: any;
  remoteType: any;
  skills: any;
  status: string;
  companyName: string;
  id: string;
  minimum_match:number;
  location_id: any;
}

export interface ICreateJob {
  job: object | undefined;
  confirm?: object | null;
  error?: CognitoError;
}

export type CognitoError = {
  code: string;
  message: string;
};
