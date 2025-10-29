import { useContext, useEffect, useState } from "react";
import SignInBanner from "./SignInBanner";
import SignInEmail from "./SignInEmail";
import CustomizationsData from "../../utils/CustomizationData";
import SignInHero from "./SignInHero";
import { useRouter } from "next/router";
import AppContext from "@/src/context/Context";

export default function SignIn(props: any) {
  const { role, page, theme } = props;
  const [name, setName] = useState<string>("");
  const customizationsData: any = CustomizationsData[2].data;
  const { color } = useContext(AppContext);
  const [company, setCompany] = useState<any>();
  const [loginState, setLoginState] = useState<string>("login");
  const router = useRouter();

  useEffect(() => {
    let fname = router.query.first_name;
    let lname = router.query.last_name;
    let company = router.query.company
      ? router.query.company
      : router.query.name;
    let source = router.query.source;

    if ((fname && lname && source == "Adwerk") || source == "self") {
      setName(fname + " " + lname);
    }

    setCompany(company);
  }, [
    router.query,
    router.query.first_name,
    router.query.last_name,
    router.query.company,
  ]);

  useEffect(() => {
    if (router.query.id) {
      let email = router.query.id;

      if (typeof email === "string" && email.includes(" ")) {
        let emailWithoutSpaces: any = email?.split(" ");
        emailWithoutSpaces = emailWithoutSpaces?.join("+");
        email = emailWithoutSpaces;
      }

      setLoginState("verify");
    }
  }, [router.query.id]);

  return (
    <div
      style={{
        backgroundColor: color?.innerBg,
        color: color?.secondaryAccent,
      }}
      className="p-4 sm:p-6 lg:p-8 flex min-h-screen justify-between items-center"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row md:justify-between">
          <SignInBanner
            page={page}
            theme={theme}
            company={company}
            customizationsData={customizationsData}
            color={color}
          />
          <div className="px-6 md:px-8  xl:px-10 flex items-center justify-start w-full">
            <div className="flex flex-col w-full">
              <div>
                <div className="text-3xl mb-3 font-semibold">
                  {customizationsData[loginState].title}
                </div>
                <div className="text-xl font-semibold">
                  {customizationsData[loginState].subtitle} {name}
                </div>
                <div className="text-sm font-thin mt-1">
                  {customizationsData[loginState].message}
                </div>
              </div>
              <SignInEmail
                role={role}
                page={page}
                company={company}
                theme={theme}
                customizationsData={customizationsData}
                color={color}
              />
              {!router.query.id && (
                <SignInHero
                  role={role}
                  page={page}
                  company={company}
                  color={color}
                  theme={theme}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
