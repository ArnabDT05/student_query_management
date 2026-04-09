import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { AlertTriangle, Layers, Edit2, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { toast } from "sonner";

export function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", department: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`[TEST FLOW: ADMIN] Fetching Category routing mappings...`);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) {
        console.error(`[TEST FLOW: ADMIN] Category Fetch failed!`, error);
        throw error;
      }
      
      console.log(`[TEST FLOW: ADMIN] Categories synced:`, data);
      setCategories(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load categories.");
      setError(err.message || "Unable to reach database connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, department: category.department });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", department: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: "", department: "" });
    setEditingCategory(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.department.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        console.log(`[TEST FLOW: ADMIN] Updating Category constraint:`, formData);
        const { error } = await supabase
          .from('categories')
          .update({ name: formData.name.trim(), department: formData.department.trim() })
          .eq('id', editingCategory.id);
          
        if (error) {
          console.error(`[TEST FLOW: ADMIN] Failed to update category map inside PG!`, error);
          throw error;
        }
        console.log(`[TEST FLOW: ADMIN] Successfully updated Category map! UUID:`, editingCategory.id);
        toast.success("Category updated successfully");
      } else {
        console.log(`[TEST FLOW: ADMIN] Submitting new Category constraint:`, formData);
        const { data, error } = await supabase
          .from('categories')
          .insert([{ name: formData.name.trim(), department: formData.department.trim() }])
          .select()
          .single();
          
        if (error) {
          console.error(`[TEST FLOW: ADMIN] Failed to generate category map inside PG!`, error);
          throw error;
        }
        console.log(`[TEST FLOW: ADMIN] Successfully generated Category map! UUID:`, data.id);
        toast.success("Category created successfully");
      }
      
      closeModal();
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id);
        
      if (error) throw error;
      
      toast.success("Category deleted successfully");
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Failed to delete category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold nm-heading tracking-tight">Manage Categories</h1>
          <p className="text-sm nm-muted mt-1">Configure the routing categories and department assignments.</p>
        </div>
        <Button onClick={() => openModal()} disabled={loading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {error ? (
        <div className="nm-card p-2 overflow-hidden">
           <ErrorState title="System Configurations Offline" description={error} onRetry={() => window.location.reload()} />
        </div>
      ) : (
        <div className="nm-card overflow-hidden">
          <Table className="border-0">
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead>Assigned Department</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {loading ? (
               Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                     <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                     <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                     <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                  </TableRow>
               ))
            ) : categories.length > 0 ? (
               categories.map((category) => (
                <TableRow key={category.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-medium text-slate-900 flex items-center gap-2">
                     <Layers className="w-4 h-4 text-slate-400" />
                     {category.name}
                  </TableCell>
                  <TableCell className="text-slate-600">{category.department}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openModal(category)}
                        className="p-1.5 nm-btn rounded-[8px] transition-all"
                        style={{ color: "#7c8db5" }}
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setCategoryToDelete(category);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 nm-btn rounded-[8px] transition-all"
                        style={{ color: "#e17055" }}
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12 text-slate-500 text-sm">
                  <div className="flex flex-col items-center justify-center">
                    <Layers className="w-8 h-8 text-slate-300 mb-3" />
                    <p>No categories found.</p>
                    <p className="text-xs mt-1">Click "Add Category" to create your first routing rule.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingCategory ? "Edit Category" : "Add New Category"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input 
            id="name"
            label="Category Name"
            placeholder="e.g. Facilities Maintenance"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isSubmitting}
          />
          <Input 
            id="department"
            label="Assigned Department"
            placeholder="e.g. Campus Operations"
            required
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            disabled={isSubmitting}
            helperText="Tickets submitted to this category will automatically route to staff mapping this exact department string."
          />
          <div className="flex justify-end gap-3 pt-4 mt-6" style={{ borderTop: "1px solid #cdd5e0" }}>
            <Button type="button" variant="ghost" onClick={closeModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        title="Confirm Deletion"
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div
            className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-4"
            style={{ background: "#fdeae8", color: "#c0533a", boxShadow: "4px 4px 10px #d0b0ac, -4px -4px 10px #ffffff" }}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold nm-heading mb-2">Delete {categoryToDelete?.name}?</h3>
          <p className="text-sm nm-muted mb-6">
            Are you sure you want to delete this category? Any open tickets assigned to this category will need to be re-routed manually. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 w-full">
            <Button type="button" variant="ghost" onClick={() => setDeleteModalOpen(false)} className="w-full" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmDelete} className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-600" isLoading={isSubmitting}>
              Yes, Delete Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
