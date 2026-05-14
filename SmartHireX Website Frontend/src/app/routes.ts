import { createBrowserRouter } from "react-router";
import { Root } from "./components/layout/Root";
import { Home } from "./components/pages/Home";
import { ResumeBuilder } from "./components/pages/ResumeBuilder";
import { JobSearch } from "./components/pages/JobSearch";
import { RecruiterDashboard } from "./components/pages/RecruiterDashboard";
import { Profile } from "./components/pages/Profile";
import { ResumeScanner } from "./components/pages/ResumeScanner";
import { NotFound } from "./components/pages/NotFound";
import { RecruiterProfile } from "./components/pages/RecruiterProfile";
import { SavedJobs } from "./components/pages/SavedJobs";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "resume-builder", Component: ResumeBuilder },
      { path: "job-search", Component: JobSearch },
      { path: "scanner", Component: ResumeScanner },
      { path: "recruiters", Component: RecruiterDashboard },
      { path: "profile", Component: Profile },
      { path: "saved-jobs", Component: SavedJobs },
      { path: "recruiter/profile", Component: RecruiterProfile },
      { path: "*", Component: NotFound },
    ],
  },
]);
