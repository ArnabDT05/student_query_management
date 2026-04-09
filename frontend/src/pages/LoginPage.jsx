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
    <div
      className="flex min-h-screen flex-1 flex-col justify-center items-center px-6 py-12 lg:px-8"
      style={{ background: "#e0e5ec" }}
    >
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="flex justify-center mb-5">
          <div
            className="nm-logo flex h-16 w-16 items-center justify-center text-2xl"
          >
            SQ
          </div>
        </div>
        <h1 className="text-3xl font-bold nm-heading tracking-tight">
          {isSignUp ? "Create an account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm nm-muted">
          Student Query Routing &amp; Resolution System
        </p>
      </div>

      {/* Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-[420px] w-full">
        <div
          className="px-8 py-10 rounded-[20px]"
          style={{ background: "#e0e5ec", boxShadow: "8px 8px 20px #a3b1c6, -8px -8px 20px #ffffff" }}
        >
          <form className="space-y-5" onSubmit={handleAuth}>
            {isSignUp && (
              <Input
                id="name"
                label="Full Name"
                type="text"
                required={isSignUp}
                value={name}
                onChange={(e) => { setName(e.target.value); setAuthError(""); }}
                placeholder="Jane Doe"
              />
            )}

            <Input
              id="email"
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setAuthError(""); }}
              placeholder="user@university.edu"
            />

            <Input
              id="password"
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setAuthError(""); }}
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
                <option value="staff">Staff / Faculty</option>
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
                onChange={(e) => { setDepartment(e.target.value); setAuthError(""); }}
                placeholder="e.g. IT Support"
              />
            )}

            <div className="pt-1">
              <Button
                type="submit"
                className="w-full h-12 text-base"
                isLoading={loading}
                disabled={!isFormValid || loading}
              >
                {isSignUp ? "Create Account" : "Sign in"}
              </Button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                className="text-sm font-semibold nm-primary hover:opacity-80 transition-opacity focus:outline-none"
                onClick={() => { setIsSignUp(!isSignUp); setAuthError(""); }}
              >
                {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs nm-muted mt-6">
          © {new Date().getFullYear()} SQRRS — All rights reserved
        </p>
      </div>
    </div>
  );
}
