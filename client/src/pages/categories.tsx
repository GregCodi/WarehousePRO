import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getAuthState, getAuthHeader } from "@/lib/auth";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Tags, Plus, Edit, Trash2, Loader2 } from "lucide-react";

// Form schema for category
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function Categories() {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const { toast } = useToast();
  const { user } = getAuthState();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => {
      const authHeaders = getAuthHeader();
      return fetch('/api/categories', {
        headers: authHeaders
      }).then(res => res.json());
    },
  });

  // Create category mutation
  const createCategory = useMutation({
    mutationFn: (data: CategoryFormValues) => 
      apiRequest("POST", "/api/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Category created",
        description: "The category has been created successfully",
      });
      setIsNewModalOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create category",
        description: error.message,
      });
    },
  });

  // Update category mutation
  const updateCategory = useMutation({
    mutationFn: (data: { id: number, category: CategoryFormValues }) => 
      apiRequest("PUT", `/api/categories/${data.id}`, data.category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Category updated",
        description: "The category has been updated successfully",
      });
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update category",
        description: error.message,
      });
    },
  });

  // Delete category mutation
  const deleteCategory = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete category",
        description: error.message,
      });
    },
  });

  // Category form
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Handle category form submission
  const onSubmitCategory = (data: CategoryFormValues) => {
    if (selectedCategory) {
      updateCategory.mutate({ id: selectedCategory.id, category: data });
    } else {
      createCategory.mutate(data);
    }
  };

  // Open edit modal and set form values
  const handleEditCategory = (category: any) => {
    setSelectedCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || "",
    });
    setIsEditModalOpen(true);
  };

  // Handle category deletion
  const handleDeleteCategory = (id: number) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteCategory.mutate(id);
    }
  };

  return (
    <>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Categories</h1>
          <p className="text-muted-foreground">Manage product categories</p>
        </div>
        
        {isAdminOrManager && (
          <Button onClick={() => {
            setSelectedCategory(null);
            categoryForm.reset({
              name: "",
              description: "",
            });
            setIsNewModalOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        )}
      </div>

      {/* Categories table */}
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg font-medium">Product Categories</CardTitle>
          <CardDescription>
            {categories ? `Showing ${categories.length} categories` : 'Loading categories...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category: any) => (
                    <TableRow key={category.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        {isAdminOrManager && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Tags className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No categories found</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first category
              </p>
              {isAdminOrManager && (
                <Button onClick={() => {
                  setSelectedCategory(null);
                  setIsNewModalOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Category Modal */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter category description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={createCategory.isPending}>
                  {createCategory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Category
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter category description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={updateCategory.isPending}>
                  {updateCategory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Category
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
