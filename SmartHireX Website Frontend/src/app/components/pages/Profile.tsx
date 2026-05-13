import { useState, useEffect } from "react";
import { Link } from "react-router";
import { User, Mail, MapPin, Phone, GraduationCap, Award, BookmarkCheck, FileText, Settings, Edit2, Camera, Sparkles, CheckCircle, X, Plus, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const POPULAR_SKILLS = ["JavaScript","TypeScript","React","Node.js","Python","Java","SQL","MongoDB","AWS","Docker","Git","CSS","HTML","Next.js","GraphQL","REST APIs","Figma","Machine Learning","Data Analysis","Excel","Communication","Leadership","Project Management","Agile","Scrum","C++","Go","Vue.js","Angular","PostgreSQL","Redis","Kubernetes","Linux","Flutter","Swift","Kotlin","R","Tableau","Power BI","Salesforce","SAP","DevOps","CI/CD","Jest","Cypress","Selenium","TensorFlow","PyTorch","Pandas","NumPy"];

export function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: "Loading...", title: "", email: "", phone: "", location: "", summary: "",
    skills: [] as string[], experience: [] as any[],
    education: { degree: "", school: "", year: "" },
    savedJobs: 0, applications: 0, profileCompletion: 0,
  });
  const [showSkillPanel, setShowSkillPanel] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [showExpForm, setShowExpForm] = useState(false);
  const [editExpIdx, setEditExpIdx] = useState<number | null>(null);
  const [newExp, setNewExp] = useState({ title: "", company: "", period: "", description: "" });
  const [showEduForm, setShowEduForm] = useState(false);
  const [newEdu, setNewEdu] = useState({ degree: "", school: "", year: "" });
  const [certs, setCerts] = useState<string[]>([]);
  const [showCertForm, setShowCertForm] = useState(false);
  const [newCert, setNewCert] = useState("");
  const aiSuggestions: string[] = [];

  useEffect(() => { loadProfileData(); }, []);

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.resumeData) {
        const r = user.user_metadata.resumeData;
        setUserData({
          name: ((r.personalInfo?.firstName || "") + " " + (r.personalInfo?.lastName || "")).trim() || "Complete Your Profile",
          title: r.desiredRole || "Candidate",
          email: r.personalInfo?.email || user.email || "",
          phone: r.personalInfo?.phone || "",
          location: r.personalInfo?.location || "",
          summary: r.summary || "",
          skills: r.skills || [],
          experience: (r.experience || []).map((e: any) => ({
            title: e.jobTitle || "", company: e.company || "",
            period: (e.startDate || "") + " - " + (e.endDate || "Present"),
            description: e.description || ""
          })).filter((e: any) => e.title),
          education: r.education?.[0] ? { degree: r.education[0].degree || "", school: r.education[0].institution || "", year: r.education[0].graduationYear || "" } : { degree: "", school: "", year: "" },
          savedJobs: (user.user_metadata?.savedJobs || []).length,
          applications: 0, profileCompletion: 65,
        });
        setCerts(r.certifications || []);
      } else {
        setUserData(p => ({ ...p, name: "Complete Your Profile", title: "Candidate", email: user?.email || "", summary: "Go to Resume Builder to fill out your details!", profileCompletion: 10 }));
      }
    } catch (e) { console.error(e); }
  };

  const persistField = async (fields: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ex = user.user_metadata?.resumeData || {};
    await supabase.auth.updateUser({ data: { resumeData: { ...ex, ...fields } } });
  };

  const handleSave = async () => {
    const parts = userData.name.split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ");
    await persistField({
      personalInfo: { firstName, lastName, email: userData.email, phone: userData.phone, location: userData.location },
      desiredRole: userData.title, summary: userData.summary
    });
    setIsEditing(false);
  };

  const filteredSkills = POPULAR_SKILLS.filter(s => s.toLowerCase().includes(skillInput.toLowerCase()) && !userData.skills.includes(s));

  const addSkill = async (skill: string) => {
    const s = skill.trim();
    if (!s || userData.skills.includes(s)) return;
    const updated = [...userData.skills, s];
    setUserData(p => ({ ...p, skills: updated }));
    setSkillInput("");
    await persistField({ skills: updated });
  };

  const removeSkill = async (skill: string) => {
    const updated = userData.skills.filter(s => s !== skill);
    setUserData(p => ({ ...p, skills: updated }));
    await persistField({ skills: updated });
  };

  const openEditExp = (idx: number) => {
    setNewExp(userData.experience[idx]);
    setEditExpIdx(idx);
    setShowExpForm(true);
  };

  const saveExp = async () => {
    if (!newExp.title || !newExp.company) return;
    const list = editExpIdx !== null
      ? userData.experience.map((e: any, i: number) => i === editExpIdx ? newExp : e)
      : [...userData.experience, newExp];
    setUserData(p => ({ ...p, experience: list }));
    await persistField({ experience: list.map((e: any) => ({ jobTitle: e.title, company: e.company, startDate: e.period?.split(" - ")[0] || "", endDate: e.period?.split(" - ")[1] || "Present", description: e.description })) });
    setShowExpForm(false); setEditExpIdx(null); setNewExp({ title: "", company: "", period: "", description: "" });
  };

  const removeExp = async (idx: number) => {
    const list = userData.experience.filter((_: any, i: number) => i !== idx);
    setUserData(p => ({ ...p, experience: list }));
    await persistField({ experience: list.map((e: any) => ({ jobTitle: e.title, company: e.company, description: e.description })) });
  };

  const saveEdu = async () => {
    if (!newEdu.degree || !newEdu.school) return;
    setUserData(p => ({ ...p, education: newEdu }));
    await persistField({ education: [{ degree: newEdu.degree, institution: newEdu.school, graduationYear: newEdu.year }] });
    setShowEduForm(false);
  };

  const saveCert = async () => {
    if (!newCert.trim()) return;
    const updated = [...certs, newCert.trim()];
    setCerts(updated);
    await persistField({ certifications: updated });
    setNewCert(""); setShowCertForm(false);
  };

  const removeCert = async (c: string) => {
    const updated = certs.filter(x => x !== c);
    setCerts(updated);
    await persistField({ certifications: updated });
  };

  const ic = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">My Profile</h1>
          <p className="text-slate-600">Manage your personal information and career details</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="absolute -bottom-16 left-8">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center"><User className="w-16 h-16 text-slate-400" /></div>
                    <button className="absolute bottom-2 right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"><Camera className="w-4 h-4 text-white" /></button>
                  </div>
                </div>
              </div>
              <div className="pt-20 px-8 pb-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1 mr-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input className={ic + " text-lg font-bold"} value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} placeholder="Full Name" />
                        <input className={ic} value={userData.title} onChange={e => setUserData({ ...userData, title: e.target.value })} placeholder="Professional Title" />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input className={ic} value={userData.email} onChange={e => setUserData({ ...userData, email: e.target.value })} placeholder="Email" />
                          <input className={ic} value={userData.phone} onChange={e => setUserData({ ...userData, phone: e.target.value })} placeholder="Phone" />
                          <input className={ic} value={userData.location} onChange={e => setUserData({ ...userData, location: e.target.value })} placeholder="Location" />
                        </div>
                        <textarea className={ic + " h-24 resize-none"} value={userData.summary} onChange={e => setUserData({ ...userData, summary: e.target.value })} placeholder="Professional summary..." />
                      </div>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">{userData.name}</h2>
                        <p className="text-slate-600 mb-3">{userData.title}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          {userData.email && <div className="flex items-center gap-1"><Mail className="w-4 h-4" />{userData.email}</div>}
                          {userData.phone && <div className="flex items-center gap-1"><Phone className="w-4 h-4" />{userData.phone}</div>}
                          {userData.location && <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{userData.location}</div>}
                        </div>
                        {userData.summary && <p className="text-slate-600 text-sm mt-4 leading-relaxed">{userData.summary}</p>}
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {isEditing ? (
                      <>
                        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm"><CheckCircle className="w-4 h-4" />Save</button>
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"><Edit2 className="w-4 h-4" />Edit Profile</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-900">Skills</h3>
                <button onClick={() => setShowSkillPanel(!showSkillPanel)} className="flex items-center gap-1 text-sm text-blue-600 font-medium"><Plus className="w-4 h-4" />Add Skill</button>
              </div>
              {showSkillPanel && (
                <div className="mb-4 p-4 border border-blue-200 rounded-xl bg-blue-50 space-y-3">
                  <div className="flex gap-2">
                    <input autoFocus className={ic + " flex-1"} value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addSkill(skillInput)} placeholder="Type a skill and press Enter..." />
                    <button onClick={() => addSkill(skillInput)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Add</button>
                    <button onClick={() => setShowSkillPanel(false)} className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg text-sm"><X className="w-4 h-4" /></button>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Popular skills — click to add:</p>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                    {filteredSkills.slice(0, 24).map(s => (
                      <button key={s} onClick={() => addSkill(s)} className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-xs hover:bg-blue-600 hover:text-white transition-colors">{s}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {userData.skills.map((skill, i) => (
                  <span key={i} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="ml-1 text-blue-300 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {userData.skills.length === 0 && <p className="text-sm text-slate-400 italic">No skills added yet. Click &quot;Add Skill&quot; to get started.</p>}
              </div>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-900">Experience</h3>
                <button onClick={() => { setShowExpForm(true); setEditExpIdx(null); setNewExp({ title: "", company: "", period: "", description: "" }); }} className="flex items-center gap-1 text-sm text-blue-600 font-medium"><Plus className="w-4 h-4" />Add Experience</button>
              </div>
              {showExpForm && (
                <div className="mb-6 p-5 border border-blue-200 rounded-xl bg-blue-50 space-y-3">
                  <h4 className="font-semibold text-slate-800 text-sm">{editExpIdx !== null ? "Edit" : "New"} Experience</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input className={ic} value={newExp.title} onChange={e => setNewExp({ ...newExp, title: e.target.value })} placeholder="Job Title *" />
                    <input className={ic} value={newExp.company} onChange={e => setNewExp({ ...newExp, company: e.target.value })} placeholder="Company *" />
                  </div>
                  <input className={ic} value={newExp.period} onChange={e => setNewExp({ ...newExp, period: e.target.value })} placeholder="Period — Jan 2022 - Dec 2023 (or Present)" />
                  <textarea className={ic + " h-20 resize-none"} value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} placeholder="Describe your role and achievements..." />
                  <div className="flex gap-2">
                    <button onClick={saveExp} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" />Save</button>
                    <button onClick={() => { setShowExpForm(false); setEditExpIdx(null); }} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              )}
              <div className="space-y-6">
                {userData.experience.length === 0 && !showExpForm && <p className="text-sm text-slate-400 italic">No experience added yet.</p>}
                {userData.experience.map((exp: any, i: number) => (
                  <div key={i} className="border-l-2 border-blue-600 pl-6 relative group">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-600 rounded-full" />
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900">{exp.title}</h4>
                        <p className="text-sm text-slate-600">{exp.company}</p>
                        <p className="text-xs text-slate-500 mb-1">{exp.period}</p>
                        <p className="text-sm text-slate-600">{exp.description}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                        <button onClick={() => openEditExp(i)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => removeExp(i)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-900">Education</h3>
                <button onClick={() => { setShowEduForm(!showEduForm); setNewEdu(userData.education.degree ? { ...userData.education } : { degree: "", school: "", year: "" }); }} className="flex items-center gap-1 text-sm text-blue-600 font-medium"><Plus className="w-4 h-4" />{userData.education.degree ? "Edit" : "Add"} Education</button>
              </div>
              {showEduForm && (
                <div className="mb-4 p-5 border border-blue-200 rounded-xl bg-blue-50 space-y-3">
                  <input className={ic} value={newEdu.degree} onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} placeholder="Degree / Qualification *" />
                  <input className={ic} value={newEdu.school} onChange={e => setNewEdu({ ...newEdu, school: e.target.value })} placeholder="Institution / School *" />
                  <input className={ic} value={newEdu.year} onChange={e => setNewEdu({ ...newEdu, year: e.target.value })} placeholder="Graduation Year" />
                  <div className="flex gap-2">
                    <button onClick={saveEdu} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" />Save</button>
                    <button onClick={() => setShowEduForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              )}
              {userData.education.degree ? (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0"><GraduationCap className="w-6 h-6 text-indigo-600" /></div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{userData.education.degree}</h4>
                    <p className="text-sm text-slate-600">{userData.education.school}</p>
                    <p className="text-xs text-slate-500">{userData.education.year}</p>
                  </div>
                </div>
              ) : !showEduForm && <p className="text-sm text-slate-400 italic">No education added yet.</p>}
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-900">Certifications</h3>
                <button onClick={() => setShowCertForm(!showCertForm)} className="flex items-center gap-1 text-sm text-blue-600 font-medium"><Plus className="w-4 h-4" />Add Certification</button>
              </div>
              {showCertForm && (
                <div className="mb-4 p-4 border border-blue-200 rounded-xl bg-blue-50 flex gap-2">
                  <input autoFocus className={ic + " flex-1"} value={newCert} onChange={e => setNewCert(e.target.value)} onKeyDown={e => e.key === "Enter" && saveCert()} placeholder="AWS Certified Solutions Architect..." />
                  <button onClick={saveCert} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Add</button>
                  <button onClick={() => setShowCertForm(false)} className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {certs.map((c, i) => (
                  <span key={i} className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-sm">
                    <Award className="w-4 h-4 text-amber-500" />{c}
                    <button onClick={() => removeCert(c)} className="text-amber-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {certs.length === 0 && !showCertForm && <p className="text-sm text-slate-400 italic">No certifications added yet.</p>}
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                <div><h3 className="font-semibold text-slate-900">Profile Strength</h3><p className="text-sm text-slate-600">{userData.profileCompletion}% Complete</p></div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all" style={{ width: `${userData.profileCompletion}%` }} />
              </div>
              <p className="text-xs text-slate-500">Complete your profile to get better job matches</p>
            </div>
            {aiSuggestions.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
                <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-slate-900">AI Suggestions</h3></div>
                {aiSuggestions.map((s, i) => <p key={i} className="text-sm text-slate-700 mb-1">• {s}</p>)}
              </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Activity</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><BookmarkCheck className="w-5 h-5 text-blue-600" /></div>
                  <div><p className="text-sm font-medium text-slate-900">Saved Jobs</p><p className="text-xs text-slate-500">Bookmarked positions</p></div>
                </div>
                <span className="text-xl font-bold text-blue-600">{userData.savedJobs}</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/resume-builder" className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"><FileText className="w-5 h-5 text-slate-500" /><span className="text-sm font-medium">Resume Builder</span></Link>
                <Link to="/saved-jobs" className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"><BookmarkCheck className="w-5 h-5 text-slate-500" /><span className="text-sm font-medium">Saved Jobs</span></Link>
                <button onClick={() => { setShowCertForm(true); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }} className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"><Award className="w-5 h-5 text-slate-500" /><span className="text-sm font-medium">Add Certification</span></button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"><Settings className="w-5 h-5 text-slate-500" /><span className="text-sm font-medium">Account Settings</span></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
