import { useState, useEffect, useMemo, useRef } from "react";
import { Search, MapPin, Briefcase, DollarSign, Clock, Bookmark, TrendingUp, Loader2, ExternalLink, Filter } from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  salary_raw?: number;
  posted: string;
  description: string;
  match?: number;
  logo: string;
  apply_link: string;
  source?: string;
}

const JOBS_PER_PAGE = 20;

// ── Spotlight-glow job card ───────────────────────────────────────────────────
function JobCard({ job, onSave }: { job: Job; onSave: (job: Job) => void | Promise<void> }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlow({ x, y, opacity: 1 });
  };

  const handleMouseLeave = () => setGlow((g) => ({ ...g, opacity: 0 }));

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative bg-white rounded-xl border border-slate-200 p-6 transition-all duration-200 hover:border-blue-300 hover:shadow-lg overflow-hidden"
      style={{
        background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(99,102,241,${glow.opacity * 0.07}) 0%, rgba(255,255,255,1) 60%)`,
      }}
    >
      {/* Subtle border glow layer */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
        style={{
          opacity: glow.opacity,
          background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(99,102,241,0.15) 0%, transparent 70%)`,
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {job.logo ? (
              <img src={job.logo} alt="logo" className="w-full h-full object-contain p-1" />
            ) : (
              "💼"
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                  {job.title}
                </h3>
                <p className="text-slate-600">
                  {job.company}{" "}
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                    {job.source}
                  </span>
                </p>
              </div>
              {job.match && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium shrink-0">
                  <TrendingUp className="w-4 h-4" />
                  {job.match}% Match
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-3">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {job.type}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {job.salary}
              </div>
              {job.posted && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {job.posted}
                </div>
              )}
            </div>

            <p className="text-slate-600 text-sm line-clamp-2 mb-4">{job.description}</p>

            <div className="flex gap-3">
              <a
                href={job.apply_link}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative cursor-pointer px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 overflow-hidden transition-all duration-200 hover:bg-blue-700 hover:shadow-[0_0_16px_rgba(99,102,241,0.6)] hover:scale-[1.03] active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  Apply Now
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </a>
              <button
                onClick={() => onSave(job)}
                className="cursor-pointer px-5 py-2 border-2 border-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-[0_0_12px_rgba(99,102,241,0.25)] hover:scale-[1.03] active:scale-95"
              >
                <Bookmark className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export function JobSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("Best Match");

  useEffect(() => {
    fetchJobs("");
  }, []);

  const fetchJobs = async (query: string) => {
    setIsLoading(true);
    setCurrentPage(1);
    try {
      const response = await fetch(
        `http://localhost:5000/api/jobs/web-search?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      if (data.status === "success") {
        setAllJobs(data.jobs);
      } else {
        console.error("Error fetching jobs:", data.error);
        setAllJobs([]);
      }
    } catch (error) {
      console.error("Network error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchJobs(searchQuery);
  };

  // Sort jobs based on dropdown
  const sortedJobs = useMemo(() => {
    const copy = [...allJobs];
    if (sortBy === "Most Recent") {
      return copy.sort((a, b) => (b.posted || "").localeCompare(a.posted || ""));
    }
    if (sortBy === "Salary: High to Low") {
      return copy.sort((a, b) => (b.salary_raw || 0) - (a.salary_raw || 0));
    }
    if (sortBy === "Salary: Low to High") {
      return copy.sort((a, b) => (a.salary_raw || 0) - (b.salary_raw || 0));
    }
    // "Best Match" — original interleaved order
    return copy;
  }, [allJobs, sortBy]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / JOBS_PER_PAGE));
  const paginatedJobs = sortedJobs.slice(
    (currentPage - 1) * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE
  );

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveJob = async (job: Job) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in to save jobs.");
        return;
      }
      const existingSavedJobs = user.user_metadata?.savedJobs || [];
      if (existingSavedJobs.some((j: Job) => j.id === job.id)) {
        alert("Job already saved!");
        return;
      }
      const updatedSavedJobs = [...existingSavedJobs, job];
      await supabase.auth.updateUser({ data: { savedJobs: updatedSavedJobs } });
      alert("Job saved successfully!");
    } catch (error) {
      console.error("Error saving job:", error);
      alert("Failed to save job.");
    }
  };

  // Build visible page numbers (show max 5 around current)
  const pageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Job Search</h1>
          <p className="text-slate-600">
            Discover opportunities matched to your skills and experience
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="md:col-span-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="City, state, or remote"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                Search Jobs
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Filters
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700">Clear all</button>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-3">Job Type</h3>
                  <div className="space-y-2">
                    {["Full-time", "Part-time", "Contract", "Internship"].map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-slate-600">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-3">Experience Level</h3>
                  <div className="space-y-2">
                    {["Entry Level", "Mid Level", "Senior Level", "Executive"].map((level) => (
                      <label key={level} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-slate-600">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-3">Salary Range</h3>
                  <div className="space-y-2">
                    {["$0 - $60k", "$60k - $100k", "$100k - $150k", "$150k+"].map((range) => (
                      <label key={range} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-slate-600">{range}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-3">Work Location</h3>
                  <div className="space-y-2">
                    {["Remote", "On-site", "Hybrid"].map((location) => (
                      <label key={location} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-slate-600">{location}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-9">
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-600">
                <span className="font-semibold text-slate-900">{sortedJobs.length} jobs</span> found
                {sortedJobs.length > 0 && (
                  <span className="ml-2 text-sm text-slate-400">
                    — page {currentPage} of {totalPages}
                  </span>
                )}
              </p>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option>Best Match</option>
                <option>Most Recent</option>
                <option>Salary: High to Low</option>
                <option>Salary: Low to High</option>
              </select>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-500 text-sm">Fetching live jobs from multiple sources...</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && sortedJobs.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <p className="text-slate-500">No jobs found. Try a different search keyword.</p>
              </div>
            )}

            {/* Job cards */}
            {!isLoading && (
              <div className="space-y-4">
                {paginatedJobs.map((job) => (
                  <JobCard key={job.id} job={job} onSave={saveJob} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="cursor-pointer px-4 py-2 border-2 border-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-all duration-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-[0_0_12px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none disabled:hover:bg-transparent disabled:hover:border-slate-200 disabled:hover:text-slate-700"
                >
                  ← Prev
                </button>

                {pageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-110 active:scale-95 ${
                      page === currentPage
                        ? "bg-blue-600 text-white shadow-[0_0_16px_rgba(99,102,241,0.55)] scale-105"
                        : "border-2 border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {currentPage + 2 < totalPages && (
                  <>
                    <span className="text-slate-400 font-bold">···</span>
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="cursor-pointer px-4 py-2 border-2 border-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-all duration-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-[0_0_12px_rgba(99,102,241,0.3)] hover:scale-110 active:scale-95"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="cursor-pointer px-4 py-2 border-2 border-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-all duration-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-[0_0_12px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none disabled:hover:bg-transparent disabled:hover:border-slate-200 disabled:hover:text-slate-700"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
