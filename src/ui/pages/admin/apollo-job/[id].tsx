import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CreateNewJob, getDataById } from "@/src/component/Job/JobServices";
import JobPage from "./create";
import Loader from "@/src/component/Loader";
import axios from "axios";
import ApolloJob from "./create";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthGuard from "@/src/component/AuthGuard";
import Page404 from "@/src/component/404Page";
import _ from "lodash";

type Props = {};

const ApolloJobEditPage = (props: Props) => {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [show404, setShow404] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData(id);
  }, [id]);

  const fetchData = async (id: any) => {
    setIsLoading(true);
    try {
      const result = await axios.get(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/apollo-jobs/${id}`,
        {
          withCredentials: true,
        }
      );
      result.status === 200 && setData(result.data);
    } catch (err: any) {
      if (err?.response?.status === 404) setShow404(true);
      else
        toast.error(err?.response?.statusText, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
          hideProgressBar: true,
        });
    } finally {
      setIsLoading(false);
    }
  };

  return isLoading ? (
    <Loader />
  ) : show404 && _.isEmpty(data) ? (
    <Page404 />
  ) : (
    !_.isEmpty(data) && (
      <div>
        <ApolloJob showPreview={true} apolloJobData={data} />
      </div>
    )
  );
};

export default AuthGuard(ApolloJobEditPage);
