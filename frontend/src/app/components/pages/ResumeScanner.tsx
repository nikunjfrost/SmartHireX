import React, { useState } from "react";
import { Link } from "react-router";
import { UploadCloud, CheckCircle, AlertCircle, TrendingUp, Sparkles, X, FileText, Briefcase, ChevronRight } from "lucide-react";

interface AnalysisResult {
  status: string;
  filename: string;
  metrics: {
    hiring_probability: number;
    match_score: number;
    ats_score: number;
  };
  ats_breakdown: {
    keyword_match: number;
    section_presence: number;
    formatting: number;
    readability: number;
  };
  keywords: {
    missing: string[];
    matched: string[];
  };
  suggestions: string[];
  recommended_roles?: {
    title: string;
    category: string;
    match_score: number;
    matched_skills: string[];
    missing_skills: string[];
    experience_required: number;
    salary_range: string;
    apply_link?: string;
  }[];
  recommended_courses?: {
    title: string;
    provider: string;
    link: string;
    level: string;
    skill: string;
  }[];
}

export function ResumeScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Multi-Job Comparison State
  const [multiJds, setMultiJds] = useState([{ title: "", jd_text: "" }]);
  const [rankedJobs, setRankedJobs] = useState<{job_title: string, match_score: number}[] | null>(null);
  const [multiLoading, setMultiLoading] = useState(false);
  const [multiError, setMultiError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a resume (PDF).");
      return;
    }
    
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("jd_text", jdText);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/analyze-resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred connecting to the backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMultiJd = () => {
    setMultiJds([...multiJds, { title: "", jd_text: "" }]);
  };

  const handleMultiJdChange = (index: number, field: "title" | "jd_text", value: string) => {
    const newJds = [...multiJds];
    newJds[index][field] = value;
    setMultiJds(newJds);
  };

  const handleRemoveMultiJd = (index: number) => {
    if (multiJds.length > 1) {
      setMultiJds(multiJds.filter((_, i) => i !== index));
    }
  };

  const handleCompareMultiJds = async () => {
    if (!result?.filename) return;
    
    // Filter out completely empty entries
    const validJds = multiJds.filter(jd => jd.title.trim() || jd.jd_text.trim());
    if (validJds.length === 0) {
      setMultiError("Please add at least one job description.");
      return;
    }

    setMultiError(null);
    setMultiLoading(true);
    setRankedJobs(null);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/compare-multiple-jds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: result.filename,
          jobs: validJds
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Comparison failed");
      }

      const data = await response.json();
      setRankedJobs(data.ranked_jobs);
    } catch (err: any) {
      setMultiError(err.message || "An unexpected error occurred.");
    } finally {
      setMultiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">AI Resume Scanner</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Instantly evaluate your resume against a job description. We analyze AI Match Scores, ATS parsing vectors, and readability flows to maximize your hiring probability.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Input Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-blue-500">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                1. Upload Resume
              </h2>
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {!file ? (
                  <>
                    <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 mb-2">Drag & drop your PDF here, or</p>
                    <label className="cursor-pointer inline-block px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
                      Browse Files
                      <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
                    </label>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <FileText className="w-10 h-10 text-green-500 mb-2" />
                    <p className="text-sm font-medium text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button onClick={() => setFile(null)} className="mt-4 text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                      <X className="w-4 h-4" /> Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                2. Job Description
              </h2>
              <textarea
                className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
                placeholder="Paste the target job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading || !file}
              className={`w-full py-4 text-white font-semibold rounded-xl text-lg shadow-lg flex justify-center items-center gap-2 transition-all duration-300
                ${loading || !file 
                  ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-1'
                }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Analyzing Details...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Analyze with AI
                </>
              )}
            </button>
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-7">
            {result ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500 fade-in">
                
                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                     <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Hiring Probability</p>
                     <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                       {result.metrics.hiring_probability}%
                     </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                     <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Match Score</p>
                     <div className="text-4xl font-extrabold text-blue-600">
                       {result.metrics.match_score}%
                     </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                     <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">ATS Score</p>
                     <div className="text-4xl font-extrabold text-indigo-600">
                       {result.metrics.ats_score}/100
                     </div>
                  </div>
                </div>

                {/* Main Analysis Body */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800 text-lg">Detailed Breakdown</h3>
                  </div>
                  
                  <div className="p-6 space-y-8">
                    {/* Insights & Suggestions */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-500" /> 
                        AI Feedback & Suggestions
                      </h4>
                      <div className="space-y-3">
                        {result.suggestions.map((suggestion, idx) => {
                          const isWarning = suggestion.includes("Missing");
                          const isGood = suggestion.includes("Great job") || suggestion.includes("Excellent");
                          return (
                            <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 text-sm
                              ${isGood ? 'bg-green-50 border-green-100 text-green-800' : 
                                isWarning ? 'bg-orange-50 border-orange-100 text-orange-800' : 'bg-blue-50 border-blue-100 text-blue-800'}
                            `}>
                              {isGood ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                              <p className="leading-relaxed">{suggestion}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Extracted Keywords */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center justify-between">
                          Matched Keywords
                          <span className="bg-green-200 text-green-800 py-0.5 px-2 rounded-full text-xs">{result.keywords.matched.length}</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.keywords.matched.length === 0 ? (
                            <span className="text-sm text-slate-500 italic">No matches found.</span>
                          ) : (
                            result.keywords.matched.map(kw => (
                              <span key={kw} className="px-3 py-1 bg-white border border-green-200 text-green-700 rounded-lg text-sm font-medium shadow-sm">
                                {kw}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center justify-between">
                          Missing Keywords
                          <span className="bg-red-100 text-red-800 py-0.5 px-2 rounded-full text-xs">{result.keywords.missing.length}</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.keywords.missing.length === 0 ? (
                            <span className="text-sm text-slate-500 italic">No gaps detected!</span>
                          ) : (
                            result.keywords.missing.map(kw => (
                              <span key={kw} className="px-3 py-1 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-medium shadow-sm">
                                {kw}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Skill Gap Analyzer - Recommended Courses */}
                    {result.recommended_courses && result.recommended_courses.length > 0 && (
                      <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100 mt-6">
                        <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-indigo-600" />
                          Skill Gap Bridging: Recommended Courses
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.recommended_courses.map((course, idx) => (
                            <a 
                              key={idx} 
                              href={course.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-white p-4 rounded-lg border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                    Target: {course.skill}
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                    {course.level}
                                  </span>
                                </div>
                                <h5 className="font-semibold text-slate-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors leading-tight">
                                  {course.title}
                                </h5>
                                <p className="text-xs text-slate-500">{course.provider}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Recommended Job Roles */}
                {result.recommended_roles && result.recommended_roles.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                        Recommended Career Paths
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 gap-4">
                        {result.recommended_roles.map((role, idx) => (
                          <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-300 transition-all group shadow-sm hover:shadow-md">
                            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-slate-900 text-lg">{role.title}</h5>
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">{role.category}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4 text-slate-400" />
                                    {role.experience_required}+ Years Exp.
                                  </span>
                                  <span className="font-medium text-slate-600">{role.salary_range}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Skill Match</p>
                                  <p className="text-2xl font-black text-blue-600">{Math.round(role.match_score)}%</p>
                                </div>
                                <div className="h-10 w-[1px] bg-slate-200 hidden md:block"></div>
                                {role.apply_link ? (
                                  <a href={role.apply_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm">
                                    Apply Now <ChevronRight className="w-4 h-4" />
                                  </a>
                                ) : (
                                  <Link to="/job-search" className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm">
                                    Search Jobs <ChevronRight className="w-4 h-4" />
                                  </Link>
                                )}
                              </div>
                            </div>
                            
                            <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-200/50 pt-4 bg-white/50">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Matched Skills</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {role.matched_skills.slice(0, 5).map(s => (
                                    <span key={s} className="text-[11px] px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-md font-medium">{s}</span>
                                  ))}
                                  {role.matched_skills.length > 5 && <span className="text-[11px] text-slate-400">+{role.matched_skills.length - 5} more</span>}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Gaps to Bridge</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {role.missing_skills.length === 0 ? (
                                    <span className="text-[11px] text-green-600 font-medium">Perfect match!</span>
                                  ) : (
                                    <>
                                      {role.missing_skills.slice(0, 3).map(s => (
                                        <span key={s} className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md font-medium">{s}</span>
                                      ))}
                                      {role.missing_skills.length > 3 && <span className="text-[11px] text-slate-400">+{role.missing_skills.length - 3} more</span>}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center p-12 opacity-80 min-h-[400px]">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Awaiting Analysis</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  Upload your resume and paste a job description. Our AI will compute your hiring probability and extract critical insights.
                </p>
              </div>
            )}
          </div>
          
        </div>

        {/* Multi-Job Comparison Section */}
        {result && (
          <div className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800 text-xl flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-indigo-600" />
                Compare Multiple Job Descriptions
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Found several interesting roles? Paste them below to see which one your resume matches best.
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 mb-6">
                {multiJds.map((jd, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-xl relative group bg-slate-50">
                    {multiJds.length > 1 && (
                      <button 
                        onClick={() => handleRemoveMultiJd(index)}
                        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-md shadow-sm border border-slate-200 transition-colors"
                        title="Remove job"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Job Title</label>
                      <input 
                        type="text"
                        className="w-full md:w-1/2 p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Senior Frontend Developer"
                        value={jd.title}
                        onChange={(e) => handleMultiJdChange(index, "title", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Job Description</label>
                      <textarea 
                        className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Paste the job description here..."
                        value={jd.jd_text}
                        onChange={(e) => handleMultiJdChange(index, "jd_text", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <button 
                  onClick={handleAddMultiJd}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                >
                  + Add Another Job
                </button>

                <button 
                  onClick={handleCompareMultiJds}
                  disabled={multiLoading}
                  className={`px-6 py-2.5 text-white font-medium rounded-lg text-sm shadow-md flex items-center gap-2 transition-all
                    ${multiLoading ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5'}`}
                >
                  {multiLoading ? (
                    <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Comparing...</>
                  ) : (
                    <><TrendingUp className="w-4 h-4" /> Rank My Matches</>
                  )}
                </button>
              </div>

              {multiError && (
                <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{multiError}</span>
                </div>
              )}

              {rankedJobs && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-in fade-in duration-500">
                  <div className="bg-indigo-50/50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">Ranking Results</h4>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                      {rankedJobs.length} Jobs Analyzed
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {rankedJobs.map((job, idx) => (
                      <div key={idx} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                            ${idx === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
                              idx === 1 ? 'bg-slate-200 text-slate-700 border border-slate-300' : 
                              idx === 2 ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-slate-100 text-slate-500'}
                          `}>
                            #{idx + 1}
                          </div>
                          <div>
                            <h5 className="font-semibold text-slate-900">{job.job_title || `Job ${idx + 1}`}</h5>
                            <p className="text-xs text-slate-500">Match Probability Based on Skills & Semantic Similarity</p>
                          </div>
                        </div>
                        
                        <div className="w-full md:w-1/3 flex items-center gap-3">
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                job.match_score > 75 ? 'bg-green-500' : 
                                job.match_score > 50 ? 'bg-blue-500' : 
                                job.match_score > 30 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${job.match_score}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-slate-700 min-w-[3rem] text-right">
                            {job.match_score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
