import { useAuth } from "@/context/AuthContext";

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold nm-heading tracking-tight">Your Profile</h1>
        <p className="text-sm nm-muted mt-1">Manage your account and view context data.</p>
      </div>

      <div className="nm-card overflow-hidden">
        {/* Profile header */}
        <div
          className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6"
          style={{ borderBottom: "1px solid #cdd5e0" }}
        >
          <div
            className="w-24 h-24 rounded-[20px] flex items-center justify-center text-4xl font-bold text-white flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #6c63ff, #5a52d5)",
              boxShadow: "6px 6px 14px #8a84d9, -4px -4px 10px #ffffff55"
            }}
          >
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="text-center sm:text-left mt-2 sm:mt-0">
            <h2 className="text-2xl font-bold nm-heading">{user?.name}</h2>
            <p className="nm-muted mt-1">{user?.email}</p>
            <span
              className="inline-block mt-3 text-xs font-bold px-3 py-1 rounded-[8px] uppercase tracking-wider"
              style={{
                background: "linear-gradient(135deg, #6c63ff, #5a52d5)",
                color: "#ffffff",
                boxShadow: "2px 2px 6px #8a84d9"
              }}
            >
              {user?.role}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 sm:p-8">
          <h3 className="text-base font-bold nm-heading mb-6">Account Details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
            {[
              { label: "Full Name", value: user?.name },
              { label: "Email Address", value: user?.email },
              { label: "System Role", value: user?.role, capitalize: true },
              user?.department && { label: "Department Routing Code", value: user?.department },
              { label: "Unique Identity UUID", value: user?.id, mono: true },
            ].filter(Boolean).map((item) => (
              <div key={item.label}>
                <dt className="text-xs font-bold nm-muted uppercase tracking-wider">{item.label}</dt>
                <dd
                  className="mt-1.5 text-sm font-semibold nm-text"
                  style={{
                    fontFamily: item.mono ? "monospace" : undefined,
                    fontSize: item.mono ? "0.7rem" : undefined,
                    wordBreak: "break-all",
                    textTransform: item.capitalize ? "capitalize" : undefined
                  }}
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
