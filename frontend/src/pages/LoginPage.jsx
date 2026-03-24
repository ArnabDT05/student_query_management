import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { toast } from "sonner";

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [department, setDepartment] = useState("");
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  
  const { login, signUp } = useAuth();
  
  const isFormValid = isSignUp 
    ? email.trim() !== "" && password.trim() !== "" && name.trim() !== "" && (role !== "staff" || department.trim() !== "")
    : email.trim() !== "" && password.trim() !== "";

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    
    if (!isFormValid) return;

    setLoading(true);
    try {
      if (isSignUp) {
        const payloadDepartment = role === "staff" ? department : null;
        const data = await signUp(email, password, role, name, payloadDepartment);
        if (data?.user?.identities?.length === 0) {
           setAuthError("An account with this email already exists.");
        } else {
           toast.success("Account created successfully! You can now sign in.");
           setIsSignUp(false);
           setPassword("");
        }
      } else {
        const { user: loggedInUser } = await login(email, password);
        toast.success("Signed in successfully!");
        
        if (loggedInUser.role === "admin") navigate("/admin/dashboard");
        else if (loggedInUser.role === "staff") navigate("/staff/dashboard");
        else navigate("/student/dashboard");
      }
    } catch (error) {
      setAuthError(error.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary-600 text-white text-xl font-bold">
            SQ
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-slate-900">
          {isSignUp ? "Create a new account" : "Sign in to your account"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Student Query Routing & Resolution System
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[400px]">
        <div className="bg-white px-6 py-10 shadow-sm border border-slate-200 rounded-sm sm:px-10">
          <form className="space-y-6" onSubmit={handleAuth}>
            {isSignUp && (
              <Input
                id="name"
                label="Full Name"
                type="text"
                required={isSignUp}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setAuthError("");
                }}
                placeholder="Jane Doe"
              />
            )}

            <Input
              id="email"
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setAuthError("");
              }}
              placeholder="user@university.edu"
            />

            <Input
              id="password"
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setAuthError("");
              }}
              error={authError}
              placeholder={isSignUp ? "Minimum 6 characters" : ""}
            />

            {isSignUp && (
              <Select
                id="role"
                label="Select Account Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">Student</option>
                <option value="staff">Staff/Faculty</option>
                <option value="admin">Admin</option>
              </Select>
            )}

            {isSignUp && role === "staff" && (
              <Input
                id="department"
                label="Department"
                type="text"
                required={isSignUp && role === "staff"}
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setAuthError("");
                }}
                placeholder="e.g. IT Support"
              />
            )}

            <div>
              <Button 
                type="submit" 
                className="w-full" 
                isLoading={loading}
                disabled={!isFormValid || loading}
              >
                {isSignUp ? "Create Account" : "Sign in"}
              </Button>
            </div>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError("");
                }}
              >
                {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
