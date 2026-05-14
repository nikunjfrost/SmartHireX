import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Sparkles, Menu, X, User, LogOut, Briefcase, FileText, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export function Root() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Workflow State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<"candidate" | "recruiter" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  
  // Login Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginView, setIsLoginView] = useState(true);
  const [selectedLoginRole, setSelectedLoginRole] = useState<"candidate" | "recruiter">("candidate");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleRoleRedirect = async (session: any) => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }
      
      let currentRole = session.user.user_metadata?.role;
      const intendedRole = localStorage.getItem("intendedRole");
      
      if (intendedRole) {
        if (currentRole !== intendedRole) {
          await supabase.auth.updateUser({ data: { role: intendedRole } });
          currentRole = intendedRole;
        }
        localStorage.removeItem("intendedRole");
      } else if (!currentRole) {
        currentRole = "candidate";
      }

      setIsLoggedIn(true);
      setRole(currentRole);
      
      if (currentRole === "recruiter" && location.pathname === "/") {
        navigate("/recruiters");
      }
      setIsLoading(false);
    };

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleRoleRedirect(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleRoleRedirect(session);
      } else {
        setIsLoggedIn(false);
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [location.pathname, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError("");

    try {
      if (isLoginView) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user && data.user.user_metadata?.role !== selectedLoginRole) {
          await supabase.auth.updateUser({ data: { role: selectedLoginRole } });
          setRole(selectedLoginRole);
        }
        if (selectedLoginRole === "recruiter") navigate("/recruiters");
        else navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { role: selectedLoginRole } }
        });
        if (error) throw error;
        setAuthError("Sign up successful! You can now log in.");
        setIsLoginView(true);
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setAuthError("");
    try {
      localStorage.setItem("intendedRole", selectedLoginRole);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "http://127.0.0.1:5000/",
          queryParams: { access_type: "offline", prompt: "consent" },
          scopes: "email profile",
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setAuthError(error.message);
      setIsSubmitting(false);
    }
  };


  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn || (isSubmitting && isLoginView)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {isLoginView ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-slate-600 mt-2">
              {isLoginView ? "Sign in to access SmartHireX" : "Join SmartHireX to connect with opportunities"}
            </p>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => setSelectedLoginRole("candidate")}
              className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all ${
                selectedLoginRole === "candidate" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <FileText className="w-4 h-4" />
              Candidate
            </button>
            <button
              onClick={() => setSelectedLoginRole("recruiter")}
              className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all ${
                selectedLoginRole === "recruiter" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Recruiter
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {authError && (
              <div className={`p-3 text-sm rounded-md ${authError.includes("successful") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {authError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  selectedLoginRole === "candidate" ? "border-slate-300 focus:ring-blue-500" : "border-slate-300 focus:ring-indigo-500"
                }`}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  selectedLoginRole === "candidate" ? "border-slate-300 focus:ring-blue-500" : "border-slate-300 focus:ring-indigo-500"
                }`}
                placeholder="••••••••"
              />
            </div>
          <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 text-white rounded-lg font-medium transition-colors shadow-md flex justify-center items-center gap-2 ${
                selectedLoginRole === "candidate" ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"
              } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoginView
                ? `Sign In as ${selectedLoginRole === "candidate" ? "Candidate" : "Recruiter"}`
                : `Sign Up as ${selectedLoginRole === "candidate" ? "Candidate" : "Recruiter"}`
              }
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400 font-medium">OR CONTINUE WITH</span></div>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-200 rounded-lg text-slate-700 font-medium text-sm hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-5 text-center">
            <button
              onClick={() => setIsLoginView(!isLoginView)}
              className={`text-sm font-medium ${
                selectedLoginRole === "candidate" ? "text-blue-600 hover:text-blue-800" : "text-indigo-600 hover:text-indigo-800"
              }`}
            >
              {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900">SmartHireX</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {role === "candidate" && (
                <>
                  <Link
                    to="/"
                    className={`text-sm transition-colors ${
                      isActive("/") && location.pathname === "/"
                        ? "text-blue-600 font-medium"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/resume-builder"
                    className={`text-sm transition-colors ${
                      isActive("/resume-builder")
                        ? "text-blue-600 font-medium"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Resume Builder
                  </Link>
                  <Link
                    to="/job-search"
                    className={`text-sm transition-colors ${
                      isActive("/job-search")
                        ? "text-blue-600 font-medium"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Job Search
                  </Link>
                  <Link
                    to="/scanner"
                    className={`text-sm transition-colors flex items-center gap-1 ${
                      isActive("/scanner")
                        ? "text-blue-600 font-medium"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    AI Scanner
                  </Link>
                </>
              )}

              {role === "recruiter" && (
                <>
                  <Link
                    to="/recruiters"
                    className={`text-sm transition-colors ${
                      isActive("/recruiters")
                        ? "text-blue-600 font-medium"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Recruiter Dashboard
                  </Link>
                </>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to={role === "recruiter" ? "/recruiter/profile" : "/profile"}
                className={`p-2 rounded-lg transition-colors ${
                  isActive(role === "recruiter" ? "/recruiter/profile" : "/profile")
                    ? "bg-blue-100 text-blue-600"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <User className="w-5 h-5" />
              </Link>
              <button 
                onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}
                className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-600" />
              ) : (
                <Menu className="w-6 h-6 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              {role === "candidate" && (
                <>
                  <Link
                    to="/"
                    className={`block px-3 py-2 rounded-lg text-sm ${
                      isActive("/") && location.pathname === "/"
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/resume-builder"
                    className={`block px-3 py-2 rounded-lg text-sm ${
                      isActive("/resume-builder")
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Resume Builder
                  </Link>
                  <Link
                    to="/job-search"
                    className={`block px-3 py-2 rounded-lg text-sm ${
                      isActive("/job-search")
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Job Search
                  </Link>
                  <Link
                    to="/scanner"
                    className={`block px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                      isActive("/scanner")
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Scanner
                  </Link>
                </>
              )}
              {role === "recruiter" && (
                <>
                  <Link
                    to="/recruiters"
                    className={`block px-3 py-2 rounded-lg text-sm ${
                      isActive("/recruiters")
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Recruiter Dashboard
                  </Link>
                </>
              )}
              <Link
                to={role === "recruiter" ? "/recruiter/profile" : "/profile"}
                className={`block px-3 py-2 rounded-lg text-sm ${
                  isActive(role === "recruiter" ? "/recruiter/profile" : "/profile")
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <button 
                  onClick={async () => { await supabase.auth.signOut(); navigate("/"); setMobileMenuOpen(false); }}
                  className="w-full px-4 py-2 text-sm bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 flex justify-center items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-slate-900">SmartHireX</span>
              </div>
              <p className="text-sm text-slate-600">
                AI-powered platform connecting talent with opportunity.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-3">For Job Seekers</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to="/resume-builder" className="hover:text-slate-900">Resume Builder</Link></li>
                <li><Link to="/job-search" className="hover:text-slate-900">Job Search</Link></li>
                <li><a href="#" className="hover:text-slate-900">Career Tips</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-3">For Recruiters</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to="/recruiters" className="hover:text-slate-900">Find Candidates</Link></li>
                <li><a href="#" className="hover:text-slate-900">Post Jobs</a></li>
                <li><a href="#" className="hover:text-slate-900">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">About Us</a></li>
                <li><a href="#" className="hover:text-slate-900">Contact</a></li>
                <li><a href="#" className="hover:text-slate-900">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-8 pt-8 text-sm text-slate-600 text-center">
            <p>© 2026 SmartHireX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
