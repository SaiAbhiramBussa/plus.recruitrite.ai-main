import { useRouter } from "next/router";
import React from "react";
import AdminCompanyJob from "./admin/company/[...id]";

function AdminPage({ query }: any) {
  const router = useRouter();

  const companyid=router.query.companyid;

  return (
      <AdminCompanyJob companyid={companyid} />
  );
}

export default AdminPage;
