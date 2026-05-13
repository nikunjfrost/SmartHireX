import { useState, useEffect } from "react";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Briefcase,
  Users,
  CreditCard,
  Settings,
  Edit2,
  Camera,
  CheckCircle,
  Globe,
  Plus
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

export function RecruiterProfile() {
  const [isEditing, setIsEditing] = useState(false);

  const [recruiterData, setRecruiterData] = useState({
    name: "Loading...",
    title: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    company: {
      name: "",
      industry: "",
      website: "",
      size: "",
      description: "",
    },
    activeJobs: 0,
    totalHires: 0,
    candidatesReviewed: 0,
    profileCompletion: 0,
  });

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        // Since we don't have a RecruiterBuilder yet, just set default empty states with the user's email
        setRecruiterData({
          name: "Complete Your Profile",
          title: "Recruiter",
          email: user?.email || "",
          phone: "",
          location: "",
          summary: "You haven't set up your recruiter profile yet.",
          company: {
            name: "Company Name",
            industry: "",
            website: "",
            size: "",
            description: "",
          },
          activeJobs: 0,
          totalHires: 0,
          candidatesReviewed: 0,
          profileCompletion: 10,
        });
      } catch (error) {
        console.error("Error loading recruiter profile:", error);
      }
    };
    loadProfileData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Recruiter Profile</h1>
          <p className="text-slate-600">
            Manage your personal information and company details
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Profile Header with Background */}
              <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600">
                <div className="absolute -bottom-16 left-8">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                      <div className="text-4xl font-bold text-indigo-600">
                        {recruiterData.name !== "Complete Your Profile" && recruiterData.name !== "Loading..." ? recruiterData.name.charAt(0) : "R"}
                      </div>
                    </div>
                    <button className="absolute bottom-2 right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="pt-20 px-8 pb-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">
                      {recruiterData.name}
                    </h2>
                    <p className="text-slate-600 mb-4">{recruiterData.title}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{recruiterData.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{recruiterData.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{recruiterData.location}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                {/* Professional Summary */}
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="font-semibold text-slate-900 mb-3">
                    About Me
                  </h3>
                  <p className="text-slate-600 leading-relaxed">{recruiterData.summary}</p>
                </div>
              </div>
            </div>

            {/* Company Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Company Details</h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-200">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{recruiterData.company.name}</h4>
                    <p className="text-sm text-slate-600">{recruiterData.company.industry} &middot; {recruiterData.company.size}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                    <Globe className="w-4 h-4" />
                    <a href="#" className="hover:underline">{recruiterData.company.website}</a>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {recruiterData.company.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Team Members Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Hiring Team</h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Invite Member
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 font-bold rounded-full flex items-center justify-center">
                      {recruiterData.name !== "Complete Your Profile" && recruiterData.name !== "Loading..." ? recruiterData.name.charAt(0) : "R"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{recruiterData.name} (You)</p>
                      <p className="text-xs text-slate-500">Admin</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Column - Stats & Actions */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Recruitment Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Active Jobs</p>
                      <p className="text-xs text-slate-600">Currently open</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-blue-600">
                    {recruiterData.activeJobs}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Total Hires</p>
                      <p className="text-xs text-slate-600">Successful placements</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-emerald-600">
                    {recruiterData.totalHires}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Reviewed</p>
                      <p className="text-xs text-slate-600">Candidates evaluated</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-purple-600">
                    {recruiterData.candidatesReviewed}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Account Settings</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <Briefcase className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium">Manage Job Postings</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <CreditCard className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium">Billing & Plan</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <Settings className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium">Preferences</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
