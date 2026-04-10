import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { UserPlus, UserCog, Mail, Shield, Trash2, Search, FilterX } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { toast } from "sonner";

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "student",
    department: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email || "",
        role: user.role,
        department: user.department || ""
      });
    } else {
      setEditingUser(null);
      setFormData({ name: "", email: "", role: "student", department: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        // Update
        const { error } = await supabase
          .from('users')
          .update({
            name: formData.name,
            role: formData.role,
            department: formData.role === 'staff' ? formData.department : null
          })
          .eq('id', editingUser.id);
        
        if (error) throw error;
        toast.success("User profile updated");
      } else {
        // Create (Metadata level)
        // NOTE: Real Supabase Auth creation requires sign-up flow.
        toast.info("New users must sign up via the login page. Admin manual creation is coming soon.");
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user from the public directory?")) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      toast.success("User removed from public directory");
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredUsers = (users || []).filter(u => {
    const matchesSearch = 
      (u.name || "").toLowerCase().includes(search.toLowerCase()) || 
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (error) {
    return (
      <div className="pt-12">
        <ErrorState title="User Directory Offline" description={error} onRetry={fetchUsers} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold nm-heading tracking-tight">System Users</h1>
          <p className="text-sm nm-muted mt-1">Manage system accounts, roles, and department assignments.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="sm:w-auto">
          <UserPlus className="w-4 h-4 mr-2" />
          Add User Profile
        </Button>
      </div>

      <div className="nm-card overflow-hidden">
        {/* Filters */}
        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between" style={{ borderBottom: "1px solid #cdd5e0" }}>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9aaac4" }} />
            <Input 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10" 
            />
          </div>
          <div className="flex gap-3">
            <Select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 w-32 sm:w-40"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="staff">Staff</option>
              <option value="admin">Admins</option>
            </Select>
            {(search || roleFilter !== "all") && (
              <Button variant="ghost" className="h-10 px-3" onClick={() => { setSearch(""); setRoleFilter("all"); }}>
                <FilterX className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="border-0">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-semibold text-slate-900">{user.name}</TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />
                        {user.email || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-primary-600" />
                        <span className="capitalize text-sm">{user.role}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">{user.department || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal(user)} className="p-1.5 nm-btn text-slate-500 rounded-[8px]">
                          <UserCog className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-1.5 nm-btn text-red-500 rounded-[8px]">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-400">No users found matching your criteria.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Edit User Record" : "Add Manual Record"}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input 
            label="Full Name" 
            required 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          <Input 
            label="Email Address" 
            type="email" 
            disabled={editingUser}
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
          />
          <Select 
            label="Access Role" 
            value={formData.role} 
            onChange={e => setFormData({...formData, role: e.target.value})}
          >
            <option value="student">Student</option>
            <option value="staff">Staff / Faculty</option>
            <option value="admin">Administrator</option>
          </Select>
          {formData.role === "staff" && (
            <Input 
              label="Department" 
              placeholder="e.g. IT Support" 
              value={formData.department} 
              onChange={e => setFormData({...formData, department: e.target.value})} 
            />
          )}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>{editingUser ? "Save Changes" : "Mock Add"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
