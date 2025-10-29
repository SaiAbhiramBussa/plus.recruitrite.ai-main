import Loader from "@/src/component/Loader";
import SignIn from "@/src/component/SignIn";
import AppContext from "@/src/context/Context";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";

const SignInPage = () => {
  const router = useRouter();
  const { name } = router.query;
  const { theme } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let user = JSON.parse(localStorage.getItem("user")!) || {};
    setIsLoading(false);

    switch (user.role) {
      case "admin":
        router.push("/admin/companies");
        break;
      case "employer":
        router.push("/dashboard");
        break;
      case "job_seeker":
        router.push("/candidates/dashboard");
        break;
      default:
        break;
    }
  }, []);

  return isLoading ? (
    <div className="h-screen flex justify-center items-center">
      <Loader />
    </div>
  ) : (
    <SignIn page={name} role="employer" theme={theme} />
  );
};

export default SignInPage;
