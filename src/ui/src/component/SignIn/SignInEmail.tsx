import { useEffect, useState } from "react";
import TextInput from "../TextInput";
import { ArrowSmallRightIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/router";
import Alert from "../Alerts";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import dynamic from "next/dynamic";
const ButtonWrapper = dynamic(() => import("../ButtonWrapper"), { ssr: false });
import _ from "lodash";

export default function SignInEmail(props: any) {
  const router = useRouter();

  const { page, company, theme, customizationsData, color } = props;
  const { redirectUrl, id } = router.query;
  const [email, setEmail]: any = useState(id ? id : "");
  const [emailErr, setEmailErr] = useState("");
  const [otp, setOtp] = useState<any>("");
  const [otpErr, setOtpErr] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showOtpField, setShowOtpField] = useState<boolean>(id ? true : false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showRegenerateOtp, setShowRegenerateOtp] = useState<boolean>(false);
  const [resentOtp, setResentOtp] = useState<boolean>(false);
  const [source, setSource] = useState("");
  const [jobId, setJobId]: any = useState("");

  useEffect(() => {
    let source = router.query.source;
    let emailId = router.query.email;
    let jobIb = router.query.job_id;

    if (emailId && source == "Adwerk") {
      setEmail(emailId);
      setSource(source);
      setJobId(jobIb);
      generateOtp(emailId);
    }
  }, [router.query.source, router.query.email]);

  const validateFields = () => {
    if (!email) {
      setLoading(false);
      return setEmailErr("E-mail can not be empty");
    } else if (!email.includes("@")) {
      setLoading(false);
      return setEmailErr("Invalid email!");
    }

    setEmailErr("");
    return true;
  };

  const validateOTP = () => {
    if (!otp) {
      setLoading(false);
      return setOtpErr("OTP can not be empty");
    } else if (_.isNaN(Number(otp))) {
      setLoading(false);
      return setOtpErr("Invalid one time password (enter digits only).");
    } else if (otp?.toString().length != 6) {
      setLoading(false);
      return setOtpErr("OTP minimum length should be 6 digits.");
    }

    setOtpErr("");
    return true;
  };

  const verifyOtp = async () => {
    const validationResponse = validateOTP();

    if (!validationResponse === true) return;

    setLoading(true);

    try {
      let postEmail = email;

      if (postEmail.includes(" ")) {
        const emailWithoutSpaces = postEmail.split(" ").join("+");
        setEmail(emailWithoutSpaces);
        postEmail = emailWithoutSpaces;
      }

      let result = await axios.post(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/accounts/verify/otp`,
        { email: postEmail, otp: otp },
        {
          withCredentials: true,
        }
      );

      setLoading(false);

      if (result.status === 200 || result.status === 201) {
        localStorage.setItem("user", JSON.stringify(result.data.user));

        const { role } = result.data.user;

        if (role === "employer" && source === "Adwerk" && jobId) {
          router.push(`/job/detail/${jobId}`);
        } else if (redirectUrl) {
          router.push(redirectUrl.toString());
        } else {
          switch (role) {
            case "job_seeker":
              router.push("/candidates/dashboard");
              break;
            case "admin":
              router.push("/admin/jobs");
              break;
            case "employer":
              router.push("/dashboard");
              break;
            case "hiring_manager":
              router.push("/dashboard");
              break;
            default:
              break;
          }
        }
      }
    } catch (error: any) {
      setLoading(false);
      setOtpErr(error.response.data.Error);
      setShowRegenerateOtp(true);
    }
  };

  const generateOtp = async (emailId: any) => {
    try {
      const validationResponse = validateFields();
      if (!validationResponse === true) return;

      if (!showRegenerateOtp) {
        setLoading(true);
      } else {
        setResentOtp(true);
      }

      setOtpErr("");

      if (email || emailId) {
        let postEmail = email || emailId;

        if (postEmail.includes(" ")) {
          const emailWithoutSpaces = postEmail.split(" ").join("+");
          setEmail(emailWithoutSpaces);
          postEmail = emailWithoutSpaces;
        }

        let result: any;

        result = await axios
          .post(
            `${process.env.NEXT_PUBLIC_DOMAIN}/api/accounts/send/otp`,
            { email: postEmail || emailId },
            {
              withCredentials: true,
            }
          )
          .catch((err) => {
            setLoading(false);
            setShowError(true);
            setEmailErr("");
            err.response
              ? setErrorMsg(err.response?.data?.error)
              : setErrorMsg(err.message);
          });
        if (result?.status === 200) {
          company
            ? router.push(
                `/signin?source=self&id=${
                  result?.data?.email || postEmail
                }&first_name=${result?.data?.first_name}&last_name=${
                  result?.data?.last_name
                }&company=${company}`,
                undefined
              )
            : router.push(
                `/signin?source=self&id=${
                  result?.data?.email || postEmail
                }&first_name=${result?.data?.first_name}&last_name=${
                  result?.data?.last_name
                }`,
                undefined
              );

          setOtp("");
          setLoading(false);
          setShowOtpField(true);

          toast.success("Code has been sent to your email!", {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true,
          });
        }
      }
    } finally {
      if (showRegenerateOtp) {
        setResentOtp(false);
      }
    }
  };

  return (
    <div className="flex flex-col w-full">
      {showOtpField ? (
        <TextInput
          label={"Enter confirmation code"}
          value={otp}
          disabled={loading}
          error={otpErr}
          placeholder={"Confirmation code"}
          onChange={(e) => {
            setOtpErr("");
            setOtp(e.target.value);
          }}
          onKeyDown={(e: any) => {
            if (e.keyCode === 13) {
              verifyOtp();
            }
          }}
        />
      ) : (
        <TextInput
          label={"Email"}
          disabled={loading}
          value={email}
          error={emailErr !== "" ? emailErr : null}
          placeholder={"Your mail"}
          onChange={(e) => {
            setEmailErr("");
            setErrorMsg("");
            setShowError(false);
            setEmail(e.target.value);
          }}
          onKeyDown={(e: any) => {
            if (e.keyCode === 13) {
              generateOtp(null);
            }
          }}
        />
      )}
      {source == "Adwerk" && email ? (
        <span className="mt-2 text-sm">
          OTP has been sent to your email : {email}
        </span>
      ) : null}
      {showRegenerateOtp && (
        <div
          style={{
            color: theme ? theme?.colors?.primary : color?.primaryAccent,
          }}
          className="w-full flex justify-end text-sm font-light mt-1"
        >
          <button onClick={generateOtp}>Resend code</button>
        </div>
      )}
      {showError && (
        <div className="mt-2">
          <Alert type={"error"} msg={errorMsg} />
        </div>
      )}
      {showOtpField ? (
        <ButtonWrapper
          theme={theme}
          disabled={loading || resentOtp}
          classNames="w-full md:w-1/3 py-6 text-sm font-medium text-white shadow-sm flex items-center justify-center rounded-sm border border-transparent mt-6 focus:outline-none"
          onClick={verifyOtp}
        >
          {loading ? "Verifying..." : customizationsData?.verify?.btnText}
          <ArrowSmallRightIcon
            className="ml-3 -mr-1 h-5 w-5"
            aria-hidden="true"
          />
        </ButtonWrapper>
      ) : (
        <ButtonWrapper
          theme={theme}
          disabled={!email || loading}
          type="button"
          classNames="w-full md:w-1/3 py-6 text-sm font-medium shadow-sm flex items-center justify-center rounded-sm border border-transparent mt-6 focus:outline-none"
          onClick={generateOtp}
        >
          {loading ? "Sending code..." : customizationsData?.login?.btnText}
          <ArrowSmallRightIcon
            className="ml-3 -mr-1 h-5 w-5"
            aria-hidden="true"
          />
        </ButtonWrapper>
      )}

      {/* Commented code - Signup with Google and linkedin buttons */}
      {/* {
        role === 'job-seeker' && 
        <>
          <div className="text-lg font-light mt-4">If you registered from another account login here</div>
          <div className="block md:flex">
            <button type="button" className="h-max m-1 mr-6 flex items-center justify-center rounded-sm border border-gray-300 bg-white w-full md:w-1/3 py-6 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none">Sign up with Google<svg className="ml-3 -mr-1 h-5 w-5" viewBox="0 0 24 24"><path fill="#EA4335 " d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"></path><path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"></path><path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"></path><path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"></path></svg></button>
            <button type="button" className="h-max m-1 flex items-center justify-center rounded-sm border border-gray-300 bg-white w-full md:w-1/3 py-6 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none">Sign up with Linkedin<svg className="ml-3 -mr-1 h-5 w-5" viewBox="0 0 72 72"><defs></defs><g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"><g id="Social-Icons---Rounded" transform="translate(-376.000000, -267.000000)"><g id="Linkedin" transform="translate(376.000000, 267.000000)"><path d="M8,72 L64,72 C68.418278,72 72,68.418278 72,64 L72,8 C72,3.581722 68.418278,-8.11624501e-16 64,0 L8,0 C3.581722,8.11624501e-16 -5.41083001e-16,3.581722 0,8 L0,64 C5.41083001e-16,68.418278 3.581722,72 8,72 Z" id="Rounded" fill="#007EBB"></path><path d="M62,62 L51.315625,62 L51.315625,43.8021149 C51.315625,38.8127542 49.4197917,36.0245323 45.4707031,36.0245323 C41.1746094,36.0245323 38.9300781,38.9261103 38.9300781,43.8021149 L38.9300781,62 L28.6333333,62 L28.6333333,27.3333333 L38.9300781,27.3333333 L38.9300781,32.0029283 C38.9300781,32.0029283 42.0260417,26.2742151 49.3825521,26.2742151 C56.7356771,26.2742151 62,30.7644705 62,40.051212 L62,62 Z M16.349349,22.7940133 C12.8420573,22.7940133 10,19.9296567 10,16.3970067 C10,12.8643566 12.8420573,10 16.349349,10 C19.8566406,10 22.6970052,12.8643566 22.6970052,16.3970067 C22.6970052,19.9296567 19.8566406,22.7940133 16.349349,22.7940133 Z M11.0325521,62 L21.769401,62 L21.769401,27.3333333 L11.0325521,27.3333333 L11.0325521,62 Z" fill="#FFFFFF"></path></g></g></g></svg></button>
          </div>
        </>
      } */}
    </div>
  );
}
