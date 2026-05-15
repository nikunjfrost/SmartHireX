import { useState, useEffect } from "react";
import { Sparkles, Download, Wand2, Eye, CheckCircle, Loader2, X } from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface ResumeSection {
  id: string;
  title: string;
  completed: boolean;
}

export function ResumeBuilder() {
  const [activeSection, setActiveSection] = useState("personal");
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [aiReview, setAiReview] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  // Form State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: ""
  });
  
  const [summary, setSummary] = useState("");
  
  const [experience, setExperience] = useState([
    { id: Date.now(), jobTitle: "", company: "", startDate: "", endDate: "", description: "" }
  ]);
  
  const [education, setEducation] = useState([
    { id: Date.now(), degree: "", fieldOfStudy: "", institution: "", graduationYear: "" }
  ]);
  
  const [skills, setSkills] = useState<string[]>(["JavaScript", "React", "Node.js", "Python", "AWS", "Docker"]);
  const [newSkill, setNewSkill] = useState("");
  
  const [desiredRole, setDesiredRole] = useState("");

  const sections: ResumeSection[] = [
    { id: "personal", title: "Personal Info", completed: personalInfo.firstName !== "" },
    { id: "summary", title: "Professional Summary", completed: summary !== "" },
    { id: "experience", title: "Work Experience", completed: experience[0].jobTitle !== "" },
    { id: "education", title: "Education", completed: education[0].degree !== "" },
    { id: "skills", title: "Skills", completed: skills.length > 0 },
  ];

  const currentIndex = sections.findIndex(s => s.id === activeSection);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === sections.length - 1;

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isFirst) {
      setActiveSection(sections[currentIndex - 1].id);
    }
  };

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.resumeData) {
          const savedData = user.user_metadata.resumeData;
          if (savedData.personalInfo) setPersonalInfo(savedData.personalInfo);
          if (savedData.summary) setSummary(savedData.summary);
          if (savedData.experience) setExperience(savedData.experience);
          if (savedData.education) setEducation(savedData.education);
          if (savedData.skills) setSkills(savedData.skills);
          if (savedData.desiredRole) setDesiredRole(savedData.desiredRole);
        }
      } catch (error) {
        console.error("Error loading resume data", error);
      }
    };
    loadSavedData();
  }, []);

  const saveToDatabase = async () => {
    setIsSubmitting(true);
    try {
      const payload = { personalInfo, summary, experience, education, skills, desiredRole };
      const { error } = await supabase.auth.updateUser({
        data: { resumeData: payload }
      });
      if (error) throw error;
      alert("Resume saved successfully!");
    } catch (error) {
      console.error("Error saving resume:", error);
      alert("There was an error saving your resume.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadResume = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        personalInfo,
        summary,
        experience,
        education,
        skills,
        desiredRole
      };

      let API_URL = import.meta.env.VITE_API_URL || "https://smarthirex-backend.onrender.com";
      API_URL = API_URL.replace(/\/$/, "");
      const response = await fetch(`${API_URL}/api/builder/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to generate resume");
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Optimized_Resume_${personalInfo.firstName || 'Candidate'}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error downloading resume:", error);
      alert("There was an error generating your resume. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAiReview = async () => {
    setIsReviewing(true);
    setAiReview(null);
    try {
      const payload = { personalInfo, summary, experience, education, skills, desiredRole };
      let API_URL = import.meta.env.VITE_API_URL || "https://smarthirex-backend.onrender.com";
      API_URL = API_URL.replace(/\/$/, "");
      const response = await fetch(`${API_URL}/api/builder/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Failed to get review");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAiReview(data.review);
    } catch (error) {
      console.error("Error getting AI review:", error);
      alert("Failed to get AI review. Please make sure the backend is running and the API key is configured.");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLast) {
      setActiveSection(sections[currentIndex + 1].id);
    } else {
      saveToDatabase();
    }
  };

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim() !== '') {
      e.preventDefault();
      if (!skills.includes(newSkill.trim())) {
        setSkills([...skills, newSkill.trim()]);
      }
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const newExp = [...experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setExperience(newExp);
  };

  const addExperience = () => {
    setExperience([...experience, { id: Date.now(), jobTitle: "", company: "", startDate: "", endDate: "", description: "" }]);
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const newEdu = [...education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setEducation(newEdu);
  };

  const addEducation = () => {
    setEducation([...education, { id: Date.now(), degree: "", fieldOfStudy: "", institution: "", graduationYear: "" }]);
  };

  const aiTips = [
    "Use action verbs like 'Led', 'Developed', 'Implemented'",
    "Quantify your achievements with numbers and percentages",
    "Tailor your resume to match the job description",
    "Keep your summary concise and impactful (3-4 lines)",
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Resume Builder</h1>
              <p className="text-slate-600">
                Create a professional resume with AI-powered suggestions
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowPreview(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button type="button" onClick={downloadResume} disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Sections */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-24">
              <h2 className="font-semibold text-slate-900 mb-4">Resume Sections</h2>
              <div className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      activeSection === section.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {section.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-slate-300 rounded-full" />
                    )}
                    <span className="text-sm">{section.title}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-900">AI Assistant</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiSuggestions}
                    onChange={(e) => setAiSuggestions(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-slate-600">Enable AI suggestions</span>
                </label>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              {/* Personal Info Section */}
              {activeSection === "personal" && (
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-6">Personal Information</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                        <input
                          type="text"
                          value={personalInfo.firstName}
                          onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                          placeholder="John"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                        <input
                          type="text"
                          value={personalInfo.lastName}
                          onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                          placeholder="Doe"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                        placeholder="john.doe@example.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={personalInfo.location}
                        onChange={(e) => setPersonalInfo({...personalInfo, location: e.target.value})}
                        placeholder="San Francisco, CA"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn URL</label>
                      <input
                        type="url"
                        value={personalInfo.linkedin}
                        onChange={(e) => setPersonalInfo({...personalInfo, linkedin: e.target.value})}
                        placeholder="linkedin.com/in/johndoe"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Professional Summary Section */}
              {activeSection === "summary" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900">Professional Summary</h2>
                    <button type="button" className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                      <Wand2 className="w-4 h-4" />
                      AI Generate
                    </button>
                  </div>
                  <div>
                    <textarea
                      rows={6}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Write a brief summary highlighting your key achievements and skills..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <p className="text-sm text-slate-500 mt-2">
                      Aim for 3-4 sentences that capture your professional essence
                    </p>
                  </div>
                </div>
              )}

              {/* Work Experience Section */}
              {activeSection === "experience" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900">Work Experience</h2>
                    <button type="button" onClick={addExperience} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add Experience
                    </button>
                  </div>
                  <div className="space-y-6">
                    {experience.map((exp, index) => (
                      <div key={exp.id} className="border border-slate-200 rounded-lg p-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Job Title</label>
                            <input
                              type="text"
                              value={exp.jobTitle}
                              onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
                              placeholder="Senior Software Engineer"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => updateExperience(index, 'company', e.target.value)}
                              placeholder="Tech Corp"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                              <input
                                type="month"
                                value={exp.startDate}
                                onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                              <input
                                type="month"
                                value={exp.endDate}
                                onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                            <textarea
                              rows={4}
                              value={exp.description}
                              onChange={(e) => updateExperience(index, 'description', e.target.value)}
                              placeholder="Describe your key responsibilities and achievements..."
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <button type="button" className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                            <Wand2 className="w-4 h-4" />
                            Improve with AI
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education Section */}
              {activeSection === "education" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900">Education</h2>
                    <button type="button" onClick={addEducation} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add Education
                    </button>
                  </div>
                  <div className="space-y-6">
                    {education.map((edu, index) => (
                      <div key={edu.id} className="border border-slate-200 rounded-lg p-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Degree</label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                              placeholder="Bachelor of Science"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Field of Study</label>
                            <input
                              type="text"
                              value={edu.fieldOfStudy}
                              onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                              placeholder="Computer Science"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Institution</label>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                              placeholder="University Name"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Graduation Year</label>
                            <input
                              type="number"
                              value={edu.graduationYear}
                              onChange={(e) => updateEducation(index, 'graduationYear', e.target.value)}
                              placeholder="2020"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills Section */}
              {activeSection === "skills" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900">Skills & Target Role</h2>
                    <button type="button" className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                      <Wand2 className="w-4 h-4" />
                      AI Suggest
                    </button>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Desired Target Role <span className="text-slate-500 font-normal">(Used to AI-optimize your resume)</span>
                      </label>
                      <input
                        type="text"
                        value={desiredRole}
                        onChange={(e) => setDesiredRole(e.target.value)}
                        placeholder="e.g. Software Engineer, Product Manager"
                        className="w-full px-3 py-3 border border-indigo-300 bg-indigo-50/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="border-t border-slate-200 pt-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Add Skills
                      </label>
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={addSkill}
                        placeholder="Type a skill and press Enter"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} className="hover:text-blue-900">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={isFirst}
                  className={`px-4 py-2 transition-colors ${isFirst ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isLast ? "Submit" : "Next Section"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - AI Tips */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-slate-900">AI Tips</h3>
              </div>
              <div className="space-y-3">
                {aiTips.map((tip, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm text-slate-700">{tip}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-purple-200">
                {aiReview ? (
                  <div className="mb-4">
                    <h4 className="font-semibold text-slate-900 mb-2">Gemini Feedback:</h4>
                    <div className="text-sm text-slate-700 max-w-none whitespace-pre-wrap">
                      {aiReview}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 mb-3">
                    Need help optimizing your resume?
                  </p>
                )}
                <button type="button" onClick={getAiReview} disabled={isReviewing} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-70">
                  {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isReviewing ? "Analyzing..." : "Get AI Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900">Resume Preview</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-8">
              {/* Simple HTML representation of the resume */}
              <div className="max-w-2xl mx-auto font-sans">
                <h1 className="text-3xl font-bold text-center text-slate-900 uppercase">
                  {personalInfo.firstName} {personalInfo.lastName}
                </h1>
                <div className="text-center text-slate-600 text-sm mt-2 flex flex-wrap justify-center gap-2">
                  {personalInfo.email && <span>{personalInfo.email} |</span>}
                  {personalInfo.phone && <span>{personalInfo.phone} |</span>}
                  {personalInfo.location && <span>{personalInfo.location} |</span>}
                  {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
                </div>
                
                {summary && (
                  <div className="mt-8">
                    <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 mb-3 uppercase">Professional Summary</h2>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
                  </div>
                )}
                
                {experience[0]?.jobTitle && (
                  <div className="mt-8">
                    <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 mb-4 uppercase">Experience</h2>
                    <div className="space-y-4">
                      {experience.map((exp) => (
                        <div key={exp.id}>
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-slate-900">{exp.jobTitle}</h3>
                            <span className="text-sm text-slate-600 font-medium">{exp.startDate} - {exp.endDate || 'Present'}</span>
                          </div>
                          <div className="font-medium text-slate-700 text-sm mb-2">{exp.company}</div>
                          {exp.description && <p className="text-sm text-slate-600 whitespace-pre-wrap">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {education[0]?.degree && (
                  <div className="mt-8">
                    <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 mb-4 uppercase">Education</h2>
                    <div className="space-y-4">
                      {education.map((edu) => (
                        <div key={edu.id}>
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-slate-900">{edu.institution}</h3>
                            <span className="text-sm text-slate-600 font-medium">{edu.graduationYear}</span>
                          </div>
                          <div className="text-sm text-slate-700">{edu.degree} in {edu.fieldOfStudy}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {skills.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 mb-3 uppercase">Skills</h2>
                    <p className="text-sm text-slate-700 leading-relaxed">{skills.join(", ")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
