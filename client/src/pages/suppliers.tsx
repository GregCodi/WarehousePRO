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
import { Truck, Plus, Edit, Trash2, Loader2, MailIcon, Phone, MapPin } from "lucide-react";

// Form schema for supplier
const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function Suppliers() {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const { toast } = useToast();
  const { user } = getAuthState();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  // Fetch suppliers
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['/api/suppliers'],
    queryFn: () => {
      const authHeaders = getAuthHeader();
      return fetch('/api/suppliers', {
        headers: authHeaders
      }).then(res => res.json());
    },
  });

  // Create supplier mutation
  const createSupplier = useMutation({
    mutationFn: (data: SupplierFormValues) => 
      apiRequest("POST", "/api/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({
        title: "Supplier created",
        description: "The supplier has been created successfully",
      });
      setIsNewModalOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create supplier",
        description: error.message,
      });
    },
  });

  // Update supplier mutation
  const updateSupplier = useMutation({
    mutationFn: (data: { id: number, supplier: SupplierFormValues }) => 
      apiRequest("PUT", `/api/suppliers/${data.id}`, data.supplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({
        title: "Supplier updated",
        description: "The supplier has been updated successfully",
      });
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update supplier",
        description: error.message,
      });
    },
  });

  // Delete supplier mutation
  const deleteSupplier = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({
        title: "Supplier deleted",
        description: "The supplier has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete supplier",
        description: error.message,
      });
    },
  });

  // Supplier form
  const supplierForm = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  // Handle supplier form submission
  const onSubmitSupplier = (data: SupplierFormValues) => {
    if (selectedSupplier) {
      updateSupplier.mutate({ id: selectedSupplier.id, supplier: data });
    } else {
      createSupplier.mutate(data);
    }
  };

  // Open edit modal and set form values
  const handleEditSupplier = (supplier: any) => {
    setSelectedSupplier(supplier);
    supplierForm.reset({
      name: supplier.name,
      contactName: supplier.contactName || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setIsEditModalOpen(true);
  };

  // Handle supplier deletion
  const handleDeleteSupplier = (id: number) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      deleteSupplier.mutate(id);
    }
  };

  return (
    <>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Suppliers</h1>
          <p className="text-muted-foreground">Manage product suppliers</p>
        </div>
        
        {isAdminOrManager && (
          <Button onClick={() => {
            setSelectedSupplier(null);
            supplierForm.reset({
              name: "",
              contactName: "",
              email: "",
              phone: "",
              address: "",
            });
            setIsNewModalOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        )}
      </div>

      {/* Suppliers table */}
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg font-medium">Product Suppliers</CardTitle>
          <CardDescription>
            {suppliers ? `Showing ${suppliers.length} suppliers` : 'Loading suppliers...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : suppliers && suppliers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier: any) => (
                    <TableRow key={supplier.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contactName || 'N/A'}</TableCell>
                      <TableCell>{supplier.email || 'N/A'}</TableCell>
                      <TableCell>{supplier.phone || 'N/A'}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={supplier.address}>
                        {supplier.address || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdminOrManager && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSupplier(supplier)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSupplier(supplier.id)}
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
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No suppliers found</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first supplier
              </p>
              {isAdminOrManager && (
                <Button onClick={() => {
                  setSelectedSupplier(null);
                  setIsNewModalOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Supplier Modal */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          
          <Form {...supplierForm}>
            <form onSubmit={supplierForm.handleSubmit(onSubmitSupplier)} className="space-y-4">
              <FormField
                control={supplierForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter supplier name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={supplierForm.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact person name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={supplierForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={supplierForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={supplierForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter supplier address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={createSupplier.isPending}>
                  {createSupplier.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Supplier
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          
          <Form {...supplierForm}>
            <form onSubmit={supplierForm.handleSubmit(onSubmitSupplier)} className="space-y-4">
              <FormField
                control={supplierForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter supplier name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={supplierForm.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact person name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={supplierForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={supplierForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={supplierForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter supplier address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={updateSupplier.isPending}>
                  {updateSupplier.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Supplier
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
