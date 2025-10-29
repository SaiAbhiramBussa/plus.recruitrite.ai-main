import AdminCompaniesDashboard from "@/pages/admin/companies";
import ApolloJob from "@/pages/admin/apollo-job/create";
import ApolloJobEditPage from "@/pages/admin/apollo-job/[id]";
import DashboardView from "@/pages/admin/apollo-job/jobs";
import AdminCompanyJob from "@/pages/admin/company/[...id]";
import AdminAlerts from "@/pages/admin/alerts";
import AdminCandidatesDashboard from "@/pages/admin/candidates";
import AdminMappingsDashboard from "@/pages/admin/mappings";
import JobPostings from "@/pages/candidates/company/[...id]";
import CandidateDashboard from "@/pages/candidates/dashboard";
import EditProfileSection from "@/pages/candidates/edit";
import JobDetailPage from "@/pages/job/detail/[id]";
import JobEditPage from "@/pages/job/[id]";
import JobPage from "@/pages/job/create";
import Dashboard from "@/pages/dashboard";
import Plans from "@/pages/profile/plans/[plan]";
import Billing from "@/pages/profile/billing";
import SubscriptionAI from "@/pages/subscriptions";
import AdminCreateCompany from "@/pages/admin/company/create";
import IndustriesDashboard from "@/pages/admin/industries";
import JobTemplate from "@/pages/admin/jobTemplate";
import ModalTraining from "@/pages/admin/modal-training";
import ImportStats from "@/pages/admin/import-stats";

const routes: any = [
  // { path: '/', Component: SignInPage },

  // admin
  {
    path: "/admin/companies",
    allowedRoles: ["admin"],
    Component: AdminCompaniesDashboard,
  },
  {
    path: "/admin/mappings",
    allowedRoles: ["admin"],
    Component: AdminMappingsDashboard,
  },
  {
    path: "/admin/apollo-job/create",
    allowedRoles: ["admin"],
    Component: ApolloJob,
  },
  {
    path: "/admin/apollo-job/[id]",
    allowedRoles: ["admin"],
    Component: ApolloJobEditPage,
  },
  {
    path: "/admin/apollo-job/jobs",
    allowedRoles: ["admin"],
    Component: DashboardView,
  },
  {
    path: "/admin/company/[...id]",
    allowedRoles: ["admin"],
    component: AdminCompanyJob,
  },
  { path: "/admin/alerts", allowedRoles: ["admin"], Component: AdminAlerts },
  {
    path: "/admin/candidates",
    allowedRoles: ["admin"],
    Component: AdminCandidatesDashboard,
  },
  {
    path: "/admin/company/create",
    allowedRoles: ["admin"],
    Component: AdminCreateCompany,
  },
  {
    path: "/admin/industries",
    allowedRoles: ["admin"],
    Component: IndustriesDashboard,
  },
  {
    path: "/admin/jobTemplate",
    allowedRoles: ["admin"],
    Component: JobTemplate,
  },
  {
    path: "/admin/modal-training",
    allowedRoles: ["admin"],
    Component: ModalTraining,
  },
  {
    path: "/admin/import-stats",
    allowedRoles: ["admin"],
    Component: ImportStats,
  },

  // candidate
  {
    path: "/candidates/company/[...id]",
    allowedRoles: ["job_seeker"],
    Component: JobPostings,
  },
  {
    path: "/candidates/dashboard",
    allowedRoles: ["job_seeker"],
    Component: CandidateDashboard,
  },
  {
    path: "/candidates/edit",
    allowedRoles: ["job_seeker"],
    Component: EditProfileSection,
  },

  // employer
  { path: "/dashboard", allowedRoles: ["employer", "hiring_manager"], Component: Dashboard },
  {
    path: "/job/detail/[id]",
    allowedRoles: ["employer", "admin", "hiring_manager"],
    Component: JobDetailPage,
  },
  {
    path: "/job/[id]",
    allowedRoles: ["employer", "admin", "hiring_manager"],
    Component: JobEditPage,
  },
  {
    path: "/job/create",
    allowedRoles: ["employer", "admin", "hiring_manager"],
    Component: JobPage,
  },
  { path: "/profile/billing", allowedRoles: ["employer"], Component: Billing },
  {
    path: "/profile/plans/[plan]",
    allowedRoles: ["employer", "admin", "hiring_manager"],
    Component: Plans,
  },
  {
    path: "/subscriptions",
    allowedRoles: ["employer","hiring_manager"],
    Component: SubscriptionAI,
  },
];

export default routes;
