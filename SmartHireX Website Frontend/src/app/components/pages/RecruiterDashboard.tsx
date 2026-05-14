import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../../lib/supabase";
import { Search, Users, Briefcase, TrendingUp, Star, MapPin, Mail, Filter, BarChart2, FileText, Check, X, User, LogOut } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface Candidate {
  id: string;
  name: string;
  title: string;
  location: string;
  experience: string;
  skills: string[];
  match: number;
  atsScore?: number;
  avatar: string;
  availability: string;
}

// We will fetch these from our database instead of hardcoding


export function RecruiterDashboard() {
  const navigate = useNavigate();
  

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("analytics");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Ranking System State
  const [candidateList, setCandidateList] = useState<Candidate[]>([]);
  const [initialCandidates, setInitialCandidates] = useState<Candidate[]>([]);
  const [showRankingPanel, setShowRankingPanel] = useState(false);
  const [rankRole, setRankRole] = useState("");
  const [rankLocation, setRankLocation] = useState("");
  const [rankQualification, setRankQualification] = useState("");
  const [candidateStatuses, setCandidateStatuses] = useState<Record<string, 'accepted' | 'rejected' | null>>({});

  useEffect(() => {
    // Fetch candidates from backend
    const fetchCandidates = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
        const response = await fetch(`${API_URL}/api/candidates`);
        if (!response.ok) throw new Error("Failed to fetch candidates");
        const data = await response.json();
        
        // Map backend data to frontend interface
        const formattedData: Candidate[] = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          title: c.title,
          location: c.location,
          experience: c.experience || "N/A",
          skills: c.skills || [],
          match: c.match_score || 0,
          atsScore: c.ats_score || 0,
          avatar: "👤", // Default avatar
          availability: "Available",
        }));
        
        setCandidateList(formattedData);
        setInitialCandidates(formattedData);
        
        // Initialize statuses from database
        const statuses: Record<string, any> = {};
        data.forEach((c: any) => {
          if (c.status === 'accepted' || c.status === 'rejected') {
            statuses[c.id] = c.status;
          }
        });
        setCandidateStatuses(statuses);
      } catch (err) {
        console.error("Error fetching candidates:", err);
      }
    };
    
    fetchCandidates();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      await fetch(`${API_URL}/api/candidates/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" })
      });
      setCandidateStatuses(prev => ({ ...prev, [id]: 'accepted' }));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      await fetch(`${API_URL}/api/candidates/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" })
      });
      setCandidateStatuses(prev => ({ ...prev, [id]: 'rejected' }));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    if (activeTab === "analytics") {
      setIsLoadingAnalytics(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      fetch(`${API_URL}/api/analytics/recruiter`)
        .then(res => res.json())
        .then(data => {
          if (data.status === "success") {
            setAnalyticsData(data.data);
          }
        })
        .catch(err => console.error("Error fetching analytics:", err))
        .finally(() => setIsLoadingAnalytics(false));
    }
  }, [activeTab]);

  const handleRankCandidates = () => {
    // If no criteria, reset to original data
    if (!rankRole && !rankLocation && !rankQualification) {
      setCandidateList([...initialCandidates]);
      return;
    }

    const ranked = candidateList.map(c => {
      let matchScore = 40; // baseline match
      let atsScore = 30; // baseline ATS

      if (rankRole && c.title.toLowerCase().includes(rankRole.toLowerCase())) {
        matchScore += 30;
        atsScore += 35;
      }
      if (rankLocation && c.location.toLowerCase().includes(rankLocation.toLowerCase())) {
        matchScore += 15;
        atsScore += 10;
      }
      if (rankQualification && c.skills.some(s => s.toLowerCase() === rankQualification.toLowerCase())) {
        matchScore += 15;
        atsScore += 25;
      }

      return { 
        ...c, 
        match: Math.min(100, matchScore),
        atsScore: Math.min(100, atsScore)
      };
    }).sort((a, b) => b.match - a.match);

    setCandidateList(ranked);
  };

  const stats = [
    { label: "Active Jobs", value: "12", icon: Briefcase, color: "blue" },
    { label: "Total Candidates", value: "2,847", icon: Users, color: "indigo" },
    { label: "Interviews Scheduled", value: "18", icon: TrendingUp, color: "purple" },
    { label: "Hires This Month", value: "5", icon: Star, color: "green" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Recruiter Dashboard</h1>
            <p className="text-slate-600">
              Find and connect with top talent using AI-powered matching
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/recruiter/profile"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
            <button 
              onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
          <div className="border-b border-slate-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "analytics"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                Analytics Overview
              </button>
              <button
                onClick={() => setActiveTab("candidates")}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "candidates"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-4 h-4" />
                Candidate Search
              </button>
              <button
                onClick={() => setActiveTab("jobs")}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "jobs"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Active Jobs
              </button>
              <button
                onClick={() => setActiveTab("pipeline")}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "pipeline"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Hiring Pipeline
              </button>
            </div>
          </div>

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="p-6 bg-slate-50/50">
              {isLoadingAnalytics ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : analyticsData ? (
                <div>
                  {/* KPI Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <p className="text-sm text-slate-600 mb-1">Total Resumes Analyzed</p>
                      <p className="text-3xl font-bold text-slate-900">{analyticsData.metrics.total_resumes_analyzed}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <p className="text-sm text-slate-600 mb-1">Average Match Score</p>
                      <p className="text-3xl font-bold text-blue-600">{analyticsData.metrics.average_match_score}%</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <p className="text-sm text-slate-600 mb-1">Shortlisted Candidates</p>
                      <p className="text-3xl font-bold text-emerald-600">{analyticsData.metrics.shortlisted_candidates}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <p className="text-sm text-slate-600 mb-1">Interviews Scheduled</p>
                      <p className="text-3xl font-bold text-purple-600">{analyticsData.metrics.interviews_scheduled}</p>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Bar Chart: Rejection Reasons */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-6">Common Rejection Reasons</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={analyticsData.charts.rejection_reasons}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="reason" type="category" width={120} tick={{fontSize: 12}} />
                            <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                            <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Pie Chart: Candidate Sources */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-6">Candidate Sources</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analyticsData.charts.candidate_sources}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {analyticsData.charts.candidate_sources.map((_: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Line Chart: Applications Over Time */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
                      <h3 className="text-lg font-semibold text-slate-900 mb-6">Recruitment Pipeline Trends</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={analyticsData.charts.applications_over_time}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Line type="monotone" dataKey="applications" stroke="#3b82f6" activeDot={{ r: 8 }} name="Total Applications" strokeWidth={2} />
                            <Line type="monotone" dataKey="shortlisted" stroke="#10b981" name="Shortlisted" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500">Failed to load analytics data.</div>
              )}
            </div>
          )}

          {/* Candidate Search Tab */}
          {activeTab === "candidates" && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                        <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Search & Ranking Button */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-7">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by skills, title, or keywords"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <button className="w-full px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                      <Filter className="w-5 h-5" />
                      Filters
                    </button>
                  </div>
                  <div className="md:col-span-3">
                    <button 
                      onClick={() => setShowRankingPanel(!showRankingPanel)}
                      className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Star className="w-5 h-5" />
                      Candidates Ranking
                    </button>
                  </div>
                </div>
              </div>

              {/* Ranking Panel Dropdown */}
              {showRankingPanel && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-6 mb-8 shadow-inner animate-in fade-in slide-in-from-top-4 duration-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-indigo-600" />
                    Rank Candidates Against Job Criteria
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Job Role</label>
                      <select 
                        value={rankRole}
                        onChange={(e) => setRankRole(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Any Role</option>
                        <option value="Software Engineer">Software Engineer</option>
                        <option value="Product Designer">Product Designer</option>
                        <option value="Data Scientist">Data Scientist</option>
                        <option value="DevOps">DevOps Engineer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Place of Job</label>
                      <select 
                        value={rankLocation}
                        onChange={(e) => setRankLocation(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Any Location</option>
                        <option value="San Francisco">San Francisco, CA</option>
                        <option value="New York">New York, NY</option>
                        <option value="Seattle">Seattle, WA</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Qualifications</label>
                      <select 
                        value={rankQualification}
                        onChange={(e) => setRankQualification(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Any Qualification</option>
                        <option value="React">React</option>
                        <option value="Python">Python</option>
                        <option value="Figma">Figma</option>
                        <option value="Kubernetes">Kubernetes</option>
                        <option value="AWS">AWS</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => {
                        setRankRole(""); setRankLocation(""); setRankQualification("");
                        setCandidateList([...initialCandidates]);
                      }}
                      className="px-5 py-2.5 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Clear Criteria
                    </button>
                    <button 
                      onClick={handleRankCandidates}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
                    >
                      Apply Ranking
                    </button>
                  </div>
                </div>
              )}

              {/* Candidates List */}
              <div className="space-y-4">
                {candidateList.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`border rounded-xl p-6 transition-all ${
                      candidateStatuses[candidate.id] === 'accepted' ? 'border-green-400 bg-green-50 shadow-sm' :
                      candidateStatuses[candidate.id] === 'rejected' ? 'border-red-300 bg-red-50 opacity-70' :
                      'border-slate-200 hover:border-blue-300 hover:shadow-md bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
                        {candidate.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {candidate.name}
                            </h3>
                            <p className="text-slate-600">{candidate.title}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
                              <Star className="w-4 h-4 fill-current" />
                              {candidate.match}% Match
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                              <FileText className="w-4 h-4" />
                              {candidate.atsScore}% ATS Score
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {candidate.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {candidate.experience}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {candidate.availability}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-5">
                          {candidate.skills.map((skill) => (
                            <span
                              key={skill}
                              className={`px-3 py-1 border rounded-full text-sm ${
                                candidateStatuses[candidate.id] === 'accepted' ? 'bg-white border-green-200 text-green-700' :
                                candidateStatuses[candidate.id] === 'rejected' ? 'bg-white border-red-200 text-red-700' :
                                'bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
                          <div className="flex gap-3">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 shadow-sm">
                              <Mail className="w-4 h-4" />
                              Contact
                            </button>
                            <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm bg-white shadow-sm">
                              View Profile
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleReject(candidate.id)}
                              title="Reject Candidate"
                              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors shadow-sm ${
                                candidateStatuses[candidate.id] === 'rejected' 
                                  ? 'bg-red-600 text-white ring-2 ring-red-300 ring-offset-1' 
                                  : 'bg-red-500 hover:bg-red-600 text-white'
                              }`}
                            >
                              <X className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleAccept(candidate.id)}
                              title="Accept Candidate"
                              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors shadow-sm ${
                                candidateStatuses[candidate.id] === 'accepted' 
                                  ? 'bg-green-600 text-white ring-2 ring-green-300 ring-offset-1' 
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                              }`}
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Jobs Tab */}
          {activeTab === "jobs" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Your Active Job Postings</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm">
                  Post New Job
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { title: "Senior Frontend Developer", applicants: 42, views: 387, posted: "5 days ago" },
                  { title: "Product Manager", applicants: 28, views: 215, posted: "1 week ago" },
                  { title: "UX Designer", applicants: 35, views: 298, posted: "3 days ago" },
                ].map((job, index) => (
                  <div key={index} className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">{job.title}</h3>
                        <p className="text-sm text-slate-600">Posted {job.posted}</p>
                      </div>
                      <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                        Manage
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <p className="text-2xl font-bold text-blue-600">{job.applicants}</p>
                        <p className="text-sm text-slate-600">Applicants</p>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                        <p className="text-2xl font-bold text-indigo-600">{job.views}</p>
                        <p className="text-sm text-slate-600">Views</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                        <p className="text-2xl font-bold text-purple-600">
                          {Math.floor((job.applicants / job.views) * 100)}%
                        </p>
                        <p className="text-sm text-slate-600">Apply Rate</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hiring Pipeline Tab */}
          {activeTab === "pipeline" && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { stage: "Applied", count: 42, color: "slate" },
                  { stage: "Screening", count: 18, color: "blue" },
                  { stage: "Interview", count: 8, color: "indigo" },
                  { stage: "Offer", count: 3, color: "green" },
                ].map((stage) => (
                  <div key={stage.stage} className="border border-slate-200 bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-slate-900">{stage.stage}</h3>
                      <span className={`px-2 py-1 bg-${stage.color}-100 text-${stage.color}-700 rounded-full text-sm font-medium border border-${stage.color}-200`}>
                        {stage.count}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {Array.from({ length: Math.min(3, stage.count) }).map((_, i) => (
                        <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                          <p className="text-sm font-medium text-slate-900">Candidate {i + 1}</p>
                          <p className="text-xs text-slate-500 mt-1">Updated 2h ago</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
