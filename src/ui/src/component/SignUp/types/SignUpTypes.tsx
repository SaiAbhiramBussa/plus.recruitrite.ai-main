export interface Profile {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  name: string;
  state: any;
  zip: string;
  setSignUpWith: any;
  industry: {
    key: string;
    value: string;
  }
}

export interface ISignUp {
  user: object | undefined | any;
  confirm?: object | null;
  error?: CognitoError;
}

export type CognitoError = {
  code: string;
  message: string;
};
