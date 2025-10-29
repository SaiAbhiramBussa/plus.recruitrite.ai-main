import { useContext, useEffect, useState } from "react";
import SignIn from "@/src/component/SignIn";
import AppContext from "@/src/context/Context";

export default function SignInPage() {
  const [loading, setLoading] = useState(true);
  const { theme } = useContext(AppContext);

  useEffect(() => {
    if (localStorage.getItem("user")) {
      window.location.href = "/candidates/dashboard";
      history.pushState(null, "/candidates/dashboard"); //removed null from bwteen
    } else {
      setLoading(false);
    }
  }, []);

  return !loading && <SignIn role="job-seeker" theme={theme} />;
}
