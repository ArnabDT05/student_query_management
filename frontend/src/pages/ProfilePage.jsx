import { useAuth } from "@/context/AuthContext";
import { UserCircle } from "lucide-react";

export function ProfilePage() {
  const { user } = useAuth();
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and view context data.</p>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-100 bg-slate-50/50">
          <UserCircle className="w-24 h-24 text-slate-300" />
          <div className="text-center sm:text-left mt-2 sm:mt-0">
            <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-slate-500 mt-1">{user?.email}</p>
            <span className="inline-block mt-3 text-xs font-bold px-2.5 py-1 bg-slate-800 text-white rounded-sm uppercase tracking-wider">
              {user?.role}
            </span>
          </div>
        </div>
        
        <div className="p-6 sm:p-8">
          <h3 className="text-base font-semibold text-slate-900 mb-6">Account Details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-8">
            <div>
              <dt className="text-sm font-medium text-slate-500">Full Name</dt>
              <dd className="mt-1 text-sm text-slate-900 font-medium">{user?.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Email Address</dt>
              <dd className="mt-1 text-sm text-slate-900 font-medium">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">System Role</dt>
              <dd className="mt-1 text-sm text-slate-900 font-medium capitalize">{user?.role}</dd>
            </div>
            {user?.department && (
              <div>
                <dt className="text-sm font-medium text-slate-500">Department Routing Code</dt>
                <dd className="mt-1 text-sm text-slate-900 font-medium">{user?.department}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-slate-500">Unique Identity UUID</dt>
              <dd className="mt-1 text-xs text-slate-400 font-mono tracking-tighter truncate" title={user?.id}>{user?.id}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
