import { Link } from "react-router";
import { Home, Search } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-slate-200">404</h1>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Page Not Found</h2>
        <p className="text-lg text-slate-600 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            to="/job-search"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            Search Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
