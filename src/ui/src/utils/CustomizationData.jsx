import Logo1 from "../component/SignUp/Logo1";
import Logo2 from "../component/SignUp/Logo2";
import Logo3 from "../component/SignUp/Logo3"

import {
  faBook,
  faBriefcase,
  faBuilding,
  faChartBar,
  faCogs,
  faIndustry,
  faMap,
  faMoneyBill,
  faPeopleCarry,
  faPeopleGroup,
  faRocket,
  faTriangleExclamation,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

const CustomizationsData = [
  {
    id: 0,
    name: "Global Styles",
    title: "RecruitRite",
    path: "*",
    data: {
      outerBg: "#E3E3E7",
      innerBg: "#ffffff",
      primaryAccent: "#006251",
      secondaryAccent: "#060E39",
      btnAccent: "#ffffff",
      kanbanBgAccent: "#f1f5f9",
      opacity: 0.5
    }
  },
  {
    id: 1,
    name: "Signup Page",
    path: "*/signup",
    data: {
      display: true,
      logo: "/Images/RecruitRite_white.svg",
      width: 170,
      height: 70,
      banner: {
        logo: "/Images/foto.png",
        title:
          "Welcome Back! RecruitRite exists to serve you with your talent management needs.",
        subtitles: [
          "Various options to meet your budget",
          "Various options to help with your internal recruiting capabilities",
          "Each service built upon a strong AI sourcing foundation",
        ],
      },
      signup: {
        title: "Signup",
        subtitle: "Welcome to RecruitRite",
        message:
          "Create your RecruitRite account and let our AI platform work for you!",
        btnText: "Sign up with email",
      },
      form: {
        title: "Sign Up",
        subtitle: "Let the jobs come to you.",
        message: "Create your RecruitRite account and find exclusive jobs in a modern and intelligent system.",
        btnText: "Sign up",
      },
      clientsList: true,
      info: {
        candidateTtle:
          "Our AI platform curates the best jobs for you in the marketplace.",
        employerTitle:
          "Our AI platform curates the best candidates for you in the marketplace.",
        message:
          "Thousands of companies and startups around the world are using RecruitRite to build their organizations.",
        tiles: [
          {
            title: "Subscription Sourcing",
            logo: <Logo1 />,
          },
          {
            title: "FullService Recruiting",
            logo: <Logo2 />,
          },
        ],
      },
      safety: {
        title:
          "We protect your data at all times. By signing up, you agree to the latest version of our",
        linkText: "privacy policy",
        link: "https://docs.google.com/document/d/1cEa3vyAqeEVC7AOcUhQVfS849H2LSv4JWHIYRXSpuf4/edit",
      },
      color: {
        bannerBg: "#006251",
        bannerText: "#ffffff",
        bg: "#ffffff",
        formBg: "#ffffff",
        text: "#000000",
        btnPrimary: "#006251",
        btnSecondary: "#ffffff",
        btnHoverPrimary: "#ffffff",
        btnHoverSecondary: "#006251",
        opacity: 1,
      },
    },
  },
  {
    id: 2,
    name: "SignIn Page",
    path: "*/signin",
    data: {
      display: true,
      logo: "/Images/RecruitRite_white.svg",
      width: 170,
      height: 70,
      banner: {
        logo: "/Images/work.png",
        title:
          "Welcome Back! RecruitRite exists to serve you with your talent management needs.",
        subtitles: [
          "Saving you time and money",
          "Matching you to the most optimized candidates, thereby solidifying retention",
          "Providing you with the best in class service",
        ],
      },
      login: {
        title: "Login",
        subtitle: "Welcome back!",
        message: "Enter your email below.",
        btnText: "Log in",
      },
      verify: {
        title: "Verify",
        subtitle: "Welcome",
        message: "Confirmation code has been sent to your email address!",
        btnText: "Verify code",
      }
    }
  },
  {
    id: 3,
    name: "Companies - Admin Dashboard",
    route: "/admin/companies",
    data:  {
      display: true,
      inner: {
        text: "Companies",
        placeholderInput: "Search companies",
      },
      color: {
        outerBg: "#E3E3E7",
        innerBg: "#ffffff",
        text: "#060E39",
        cardBg: "#ffffff",
        cardText: "#060E39",
        cardSpanText: "#006251",
        cardSpanBg: "#0062511A",
        btnPrimary: "#3730a3",
        btnSecondary: "#ffffff",
        btnHoverPrimary: "##4f46e5",
        btnHoverSecondary: "#ffffff",
        opacity: 1,
      },
    }
  },
  {
    id: 4,
    name: "Navbar - Dashboard",
    route: "*",
    data: {
      display: true,
      logo: "/Images/RecruitRite_Logo.svg",
      width: 150,
      height: 100,
      adminCards: [
        {
          title: "Companies",
          icon: faBuilding,
          linkTo: "/admin/companies",
        },
        {
          title: "Candidates",
          icon: faUsers,
          linkTo: "/admin/candidates",
        },
        {
          title: "Jobs",
          icon: faBriefcase,
          linkTo: "/admin/jobs",
        },
        {
          title: "Alerts",
          icon: faTriangleExclamation,
          linkTo: "/admin/alerts",
        },
      ],
      adminMenu: [
        { title: "Mappings", linkTo: "/admin/mappings", icon: faMap },
        { title: "Import Stats", linkTo: "/admin/import-stats", icon: faChartBar },
        { title: "Model Training", linkTo: "/admin/modal-training", icon: faCogs },
        { title: "Download Ranked Dataset", linkTo: "#", icon: faPeopleCarry },
        { title: "Industries", linkTo: "/admin/industries", icon: faIndustry },
        { title: "Job Templates", linkTo: "/admin/jobTemplate", icon: faBook },
        {
          title: "Import Candidates",
          linkTo: "/admin/candidates",
          icon: faPeopleGroup,
        },
        {
          title: "Upload Candidate Resume",
          linkTo: "/admin/candidates",
          icon: faUser,
        },
      ],
      userMenu: [
        { title: "Profile", linkTo: "/profile", icon: faUser },
        { title: "Candidates", linkTo: "/admin/candidates", icon: faPeopleGroup },
        { title: "Companies", linkTo: "/admin/companies", icon: faBriefcase },
        {
          title: "Recommended profiles AI",
          linkTo: "/recommended",
          icon: faRocket,
        },
      ],
    }
  },
  {
    id: 5,
    name: "Employer Dashboard",
    route: "/dashboard",
    data: {
      display: true,
      text: "Job Postings",
      btnPrimaryText: "Create Job",
      btnSecondaryText: "Import Jobs",
      color: {
        outerBg: "#E3E3E7",
        innerBg: "#ffffff",
        text: "#060E39",
        btnPrimary: "#006251",
        btnSecondary: "#ffffff",
        btnHoverPrimary: "#006251",
        btnHoverSecondary: "#ffffff",
        selectedBorder: "#006251",
        deselectedBorder: "#e5e7eb",
        border: "#e5e7eb",
        opacity: 1,
        spanBg: "#0062511A",
        spanText: "#006251",
      },
    }
  },
  {
    id: 6,
    name: "Employer Dashboard - Create Job",
    route: "/dashboard",
    data: {
      display: true,
      form: {
        primaryText: "Create Job",
        secondaryText: "Edit Job",
      },
      btnPrimaryText: "Upload multiple jobs",
      btnSecondaryText: "Create Job",
      btnTertiaryText: "Save",
      previewText: "Job Preview",
      color: {
        outerBg: "#E3E3E7",
        innerBg: "#ffffff",
        text: "#060E39",
        previewText: "#64748b",
        btnPrimary: "#006251",
        btnSecondary: "#ffffff",
        btnHoverPrimary: "#4f46e5",
        btnHoverSecondary: "#ffffff",
        opacity: 1,
      },
    }
  }, 
  {
    id: 7,
    name: "Admin Dashboard - View/Edit Company",
    route: "/admin/companies/:id",
    data:  {
      display: true,
      text: "Companies",
      btnText: "Full Service",
      color: {
        outerBg: "#E3E3E7",
        innerBg: "#ffffff",
        text: "#060E39",
        previewText: "#64748b",
        selectedText: "#006251",
        deselectedText: "#475569",
        btnConfirm: "#006251",
        btnDecline: "#ef4444",
        avatarBg: "#006251",
        avatarText: "#ffffff",
        iconText: "#006251",
        opacity: 1,
      },
    }
  }
]

export default CustomizationsData;