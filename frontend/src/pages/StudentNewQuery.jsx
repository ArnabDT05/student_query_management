import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { UploadCloud, X, FileText, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { detectCategory } from "@/services/categorizationService";
import { sendNotification } from "@/services/notificationService";

export function StudentNewQuery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [formData, setFormData] = useState({
    categoryId: "",
    priority: "medium", // 'low', 'medium', 'high'
    subject: "",
    description: "",
  });
  const [file, setFile] = useState(null);
  const [isAutoCategorized, setIsAutoCategorized] = useState(false);

  // Auto-categorization listener
  useEffect(() => {
    if (!formData.subject && !formData.description) return;
    if (formData.categoryId && !isAutoCategorized) return; // Don't override manual choice

    const match = detectCategory(formData.subject, formData.description);
    if (match) {
      // Find the ID of the category that matches the suggested department/role
      const suggested = categories.find(c => 
        c.department?.toLowerCase().includes(match.replace('_', ' ')) ||
        c.name?.toLowerCase().includes(match.replace('_', ' '))
      );
      
      if (suggested && suggested.id !== formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: suggested.id }));
        setIsAutoCategorized(true);
      }
    }
  }, [formData.subject, formData.description, categories, isAutoCategorized]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) {
        toast.error("Failed to load categories.");
      } else {
        setCategories(data || []);
      }
      setFetchingCategories(false);
    };
    fetchCategories();
  }, []);

  const isFormValid = 
    formData.categoryId !== "" && 
    formData.subject.trim() !== "" && 
    formData.description.trim() !== "";

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isFormValid) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (!user?.id) {
       setErrorMsg("You must be logged in to submit a query.");
       return;
    }

    setLoading(true);
    try {
      // 1. Get the target category to find the correct department
      const selectedCategory = categories.find(c => c.id === formData.categoryId);
      if (!selectedCategory) throw new Error("Invalid category selected.");

      const targetDepartment = selectedCategory.department;
      let assignedTo = null;

      // 2. Look for Staff in that department FIRST
      const { data: staffList, error: staffErr } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'staff')
        .eq('department', targetDepartment)
        .limit(1);

      if (staffErr) throw staffErr;

      if (staffList && staffList.length > 0) {
        assignedTo = staffList[0].id;
      } else {
        // 3. Fallback to Admin if no staff in department
        const { data: adminList, error: adminErr } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'admin')
          .limit(1);
          
        if (!adminErr && adminList && adminList.length > 0) {
          assignedTo = adminList[0].id;
        }
      }

      // Submitting live mapping to Supabase
      const title = formData.subject.trim();
      const description = formData.description.trim();
      const category = selectedCategory.id;
      const priority = formData.priority;

      console.log(`[TEST FLOW: STUDENT] Submitting New Query -> payload:`, {
        title,
        description,
        category_id: category,
        priority,
        student_id: user.id,
        assigned_to: assignedTo,
        status: 'open'
      });

      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          title,
          description,
          category_id: category, // category is essentially the UUID mapped in the dropdown
          priority,
          student_id: user.id,
          assigned_to: assignedTo,
          status: 'open',
        })
        .select()
        .single();
        
      if (ticketError) {
         console.error(`[TEST FLOW: STUDENT] Failed to insert ticket! PG Error:`, ticketError);
         throw ticketError;
      }
      
      console.log(`[TEST FLOW: STUDENT] Query successfully inserted into DB! Ticket Object:`, ticket);
      
      // Notify the assigned staff
      if (assignedTo) {
        await sendNotification(
          assignedTo,
          `New ticket assigned to your queue: Ticket ${ticket.id.split('-')[0].toUpperCase()} - ${title}`
        );
      }

      const notificationPayload = {
        title: "New Ticket Received",
        message: `Your query "${title}" has been successfully submitted to the queue.`,
        type: "info",
        is_read: false
      };
      
      console.log(`[TEST FLOW: STUDENT] Attempting to generate confirmation notification -> payload:`, notificationPayload);
      
      await sendNotification(
        user.id,
        `Your query "${title}" has been successfully submitted to the queue.`
      );
        
      
      console.log(`[TEST FLOW: STUDENT] Routing to Student Tickets table dashboard...`);
      toast.success(`Query submitted successfully! Your Ticket ID is ${ticket.id.split('-')[0].toUpperCase()}`);
      navigate("/student/tickets", { state: { newTicketId: ticket.id, message: "Query submitted successfully!" } });

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to submit the query. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Query</h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit exactly what you need help with. Internal teams will review and route it accordingly.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-sm flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
               <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="relative">
              <Select
                id="category"
                label={
                  <span className="flex items-center gap-1.5">
                    Category *
                    {isAutoCategorized && (
                      <span className="flex items-center gap-1 text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full border border-primary-100 animate-pulse">
                        <Sparkles className="w-2.5 h-2.5" />
                        Auto-detected
                      </span>
                    )}
                  </span>
                }
                required
                disabled={fetchingCategories}
                value={formData.categoryId}
                onChange={(e) => {
                  setFormData({ ...formData, categoryId: e.target.value });
                  setIsAutoCategorized(false); // Reset once user manually interacts
                }}
              >
              <option value="" disabled>
                {fetchingCategories ? "Loading categories..." : "Select Category..."}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
              </Select>
            </div>

            <Select
              id="priority"
              label="Priority *"
              required
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>

          <Input
            id="subject"
            label="Subject *"
            required
            placeholder="E.g., Cannot access Canvas portal"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />

          <Textarea
            id="description"
            label="Description *"
            required
            placeholder="Please provide specifics about your issue..."
            className="min-h-[160px]"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          {/* Attachments Section */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Attachments</label>
            {!file ? (
              <div 
                className="mt-2 flex justify-center rounded-sm border border-dashed border-slate-300 px-6 py-8 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <UploadCloud className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                  <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                    <span className="relative cursor-pointer rounded-sm bg-transparent font-semibold text-primary-600 hover:text-primary-500">
                      Upload a file
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-slate-500">PNG, JPG, PDF up to 10MB</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-sm bg-slate-50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-white border border-slate-200 rounded-sm shrink-0">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-slate-500 shrink-0">
                     ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
              accept="image/*,.pdf,.doc,.docx"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/student/dashboard")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={loading} 
              disabled={!isFormValid || loading || fetchingCategories}
            >
              Submit Query
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
