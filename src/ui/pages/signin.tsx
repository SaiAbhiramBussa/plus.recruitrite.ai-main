import Loader from "@/src/component/Loader";
import SignIn from "@/src/component/SignIn";
import AppContext from "@/src/context/Context";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";

const SignInPage = () => {
  const router = useRouter();
  const { theme } = useContext(AppContext);
  const [user, setUser] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if(localStorage.getItem("user")){
      var user = JSON.parse(localStorage.getItem("user")!) || {};
    }
    else{
      user = {};
    }
    setUser(user);
    setIsLoading(false);

    if (user.role === "admin") router.push("/admin/companies");
    else if (user.role === "employer" || user.role === 'hiring_manager') router.push("/dashboard");
    else if (user.role === "job_seeker") router.push("/candidates/dashboard");
  }, []);

  return isLoading ? (
    <div className="h-screen flex justify-center items-center">
      <Loader />
    </div>
  ) : (
    <SignIn role={user.role} theme={theme} />
  );
};

export default SignInPage;
