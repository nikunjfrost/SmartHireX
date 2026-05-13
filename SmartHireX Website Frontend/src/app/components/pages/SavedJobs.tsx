import { useState, useEffect } from "react";
import { MapPin, Briefcase, DollarSign, Clock, TrendingUp, ExternalLink, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  posted: string;
  description: string;
  match?: number;
  logo: string;
  apply_link: string;
  source?: string;
}

export function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.savedJobs) {
        setSavedJobs(user.user_metadata.savedJobs);
      }
    } catch (error) {
      console.error("Error loading saved jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeJob = async (jobId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedJobs = savedJobs.filter((job) => job.id !== jobId);
      await supabase.auth.updateUser({
        data: { savedJobs: updatedJobs }
      });
      setSavedJobs(updatedJobs);
    } catch (error) {
      console.error("Error removing job:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Saved Jobs</h1>
          <p className="text-slate-600">
            Keep track of the opportunities you're interested in
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading your saved jobs...</div>
        ) : savedJobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No saved jobs yet</h3>
            <p className="text-slate-600 mb-6">Explore the job board and save opportunities you like.</p>
            <a href="/jobs" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Browse Jobs
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {savedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                      {job.logo ? <img src={job.logo} alt="logo" className="w-full h-full object-contain p-1" /> : "💼"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {job.title}
                          </h3>
                          <p className="text-slate-600">{job.company} {job.source && `• ${job.source}`}</p>
                        </div>
                        {job.match && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
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
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.posted}
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <a 
                          href={job.apply_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                        >
                          Apply Now
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button 
                          onClick={() => removeJob(job.id)}
                          className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
