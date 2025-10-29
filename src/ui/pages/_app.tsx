import { AuthContextProvider } from "@/src/component/context/authProvider";
import AppContext from "@/src/context/Context";
import { AuthContext } from "@/src/component/context/authProvider";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import routes from "@/src/routes";
import { getThemeForRoute } from "../src/utils/theme";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomizationsData from "@/src/utils/CustomizationData";
import { colorToRGBA, genrateRandomAccents } from "@/src/utils/misc";
import { set } from "lodash";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const customizationsData = CustomizationsData[0];
  const { asPath } = router;
  const theme = getThemeForRoute(asPath);
  const [companiesList, setCompaniesList] = useState<any>();
  const [selectedCompany, setSelectedCompany] = useState({});
  const [auth, setAuth] = useState(false);
  const [user, setUser] = useState({});
  const [screeningCredits, setScreeningCredits] = useState(0); 
  const [colors, setColors] = useState<any>([]);
  const [stripePricing, setStripePricing] = useState({
    price: 0,
    quantity: 0,
    total_credits: 0,
    is_custom_screening: false
  });
  const [trainedCandidatesModal, setTrainedCandidatesModal] =
    useState<boolean>(false);
  const [selectedCredits, setSelectedCredits] = useState<number>(10);
  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: 38,
      height: 35,
      borderColor: customizationsData?.data?.outerBg,
      boxShadow: state.isFocused ? null : null,
      "&:active": {
        borderColor: customizationsData?.data?.outerBg,
      },
      "&:hover": {
        borderColor: customizationsData?.data?.outerBg,
      },
    }),
    placeholder: (provided: any, state: any) => ({
      ...provided,
      height: 25,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: 14,
      marginTop: 3,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      fontSize: 14,
      backgroundColor: state.isSelected
        ? "inherit"
        : customizationsData?.data?.innerBg,
      color: customizationsData?.data?.secondaryAccent,
      "&:hover": {
        backgroundColor: state.isSelected
          ? customizationsData?.data?.outerBg
          : customizationsData?.data?.innerBg,
      },
    }),
  };

  useEffect(() => {
    const newColors = genrateRandomAccents(
      10,
      customizationsData?.data?.primaryAccent
    );

    setColors(newColors);
  }, []);

  useEffect(() => {
    const handleUnauthorized = (url: string) => {
      router.push(`/signin?redirectUrl=${url}`);
      localStorage.clear();
      Cookies.remove("startdatetoken");
      Cookies.remove("userdata");
    };

    const handleForbidden = (url: string) => {
      let user: any = localStorage.getItem("user");
      let userRole: string = user.role;
      if (userRole === "employer" || userRole === "hiring_manager") {
        router.push(`/dashboard`);
      }
    };
    // Listen for `401 Unauthorized` responses
    const unAuthorizedInterceptor = axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response && error.response.status === 403) {
          handleForbidden(router.asPath);
        } else if (error.response && error.response.status === 401) {
          handleUnauthorized(router.asPath);
        }
        return Promise.reject(error);
      }
    );
    // Remove the interceptor when the component is unmounted
    return () => {
      axios.interceptors.response.eject(unAuthorizedInterceptor);
    };
  }, []);

  useEffect(() => {
    if (router.pathname === '/signup' || router.pathname === '/signin' || router.pathname === '/') {
      document.body.classList.add('no-gtranslate')
    } else {
      document.body.classList.remove('no-gtranslate')
    }
  }, [router.pathname]);

  const route = routes.find((r: any) => r.path === router.pathname);

  return (
    <AppContext.Provider
      value={{
        companiesList,
        setCompaniesList,
        selectedCompany,
        setSelectedCompany,
        color: customizationsData.data,
        customStyles,
        theme,
        trainedCandidatesModal,
        setTrainedCandidatesModal,
        colors,
        stripePricing,
        setStripePricing,
        screeningCredits,
        setScreeningCredits,
        selectedCredits,
        setSelectedCredits
      }}
    >
      <AuthContext.Provider value={{ auth, setAuth, user, setUser }}>
        <Head>
          <meta name="viewport" content="initial-scale=1, width=device-width" />
          <title>{customizationsData.title || "StartDate"}</title>
          <meta
            name="description"
            content={customizationsData.title || "StartDate"}
          />
        </Head>
        <ToastContainer />
        <Component {...pageProps} theme={theme} />
      </AuthContext.Provider>
    </AppContext.Provider>
  );
}