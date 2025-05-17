import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getAuthState } from "@/lib/auth";
import { roles } from "@shared/schema";

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
  DialogFooter
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Users as UsersIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  UserCircle, 
  Lock,
  Shield,
  CheckCircle,
  XCircle
} from "lucide-react";

// Form schema for user creation
const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  role: z.string({
    required_error: "Role is required",
  }),
});

// Form schema for user update
const updateUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullName: z.string().min(2, "Full name is required"),
  role: z.string({
    required_error: "Role is required",
  }),
  active: z.boolean(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal('')),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export default function Users() {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { toast } = useToast();
  const { user: currentUser } = getAuthState();

  // Only allow admins to access this page
  if (currentUser?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Shield className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-medium mb-2">Access Denied</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have permission to manage users. This section is only accessible to administrators.
        </p>
      </div>
    );
  }

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
  });

  // Create user mutation
  const createUser = useMutation({
    mutationFn: (data: CreateUserFormValues) => 
      apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User created",
        description: "The user has been created successfully",
      });
      setIsNewModalOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create user",
        description: error.message,
      });
    },
  });

  // Update user mutation
  const updateUser = useMutation({
    mutationFn: (data: { id: number, user: UpdateUserFormValues }) => 
      apiRequest("PUT", `/api/users/${data.id}`, data.user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User updated",
        description: "The user has been updated successfully",
      });
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update user",
        description: error.message,
      });
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete user",
        description: error.message,
      });
    },
  });

  // Create user form
  const createUserForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      role: roles.WORKER,
    },
  });

  // Update user form
  const updateUserForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      username: "",
      fullName: "",
      role: roles.WORKER,
      active: true,
      password: "",
    },
  });

  // Handle create user form submission
  const onSubmitCreateUser = (data: CreateUserFormValues) => {
    createUser.mutate(data);
  };

  // Handle update user form submission
  const onSubmitUpdateUser = (data: UpdateUserFormValues) => {
    // Only include password if it's provided
    const userData: any = { ...data };
    if (!userData.password) {
      delete userData.password;
    }
    
    updateUser.mutate({ id: selectedUser.id, user: userData });
  };

  // Open edit modal and set form values
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    updateUserForm.reset({
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      active: user.active,
      password: "",
    });
    setIsEditModalOpen(true);
  };

  // Handle user deletion
  const handleDeleteUser = (id: number) => {
    // Prevent deleting the current user
    if (id === currentUser?.id) {
      toast({
        variant: "destructive",
        title: "Operation not allowed",
        description: "You cannot delete your own account",
      });
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUser.mutate(id);
    }
  };

  // Get badge style based on role
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case roles.ADMIN:
        return "bg-primary/10 text-primary hover:bg-primary/20";
      case roles.MANAGER:
        return "bg-info/10 text-info hover:bg-info/20";
      case roles.WORKER:
        return "bg-muted hover:bg-muted/80";
      default:
        return "";
    }
  };

  return (
    <>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Users</h1>
          <p className="text-muted-foreground">Manage warehouse users and their permissions</p>
        </div>
        
        <Button onClick={() => {
          createUserForm.reset({
            username: "",
            password: "",
            fullName: "",
            role: roles.WORKER,
          });
          setIsNewModalOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg font-medium">Warehouse Users</CardTitle>
          <CardDescription>
            {users ? `Showing ${users.length} users` : 'Loading users...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeStyle(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.active ? (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No users found</h3>
              <p className="text-muted-foreground mb-4">
                There are no users in the system yet
              </p>
              <Button onClick={() => {
                createUserForm.reset({
                  username: "",
                  password: "",
                  fullName: "",
                  role: roles.WORKER,
                });
                setIsNewModalOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          
          <Form {...createUserForm}>
            <form onSubmit={createUserForm.handleSubmit(onSubmitCreateUser)} className="space-y-4">
              <FormField
                control={createUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password*</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={roles.ADMIN}>Admin</SelectItem>
                        <SelectItem value={roles.MANAGER}>Manager</SelectItem>
                        <SelectItem value={roles.WORKER}>Worker</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          
          <Form {...updateUserForm}>
            <form onSubmit={updateUserForm.handleSubmit(onSubmitUpdateUser)} className="space-y-4">
              <FormField
                control={updateUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={updateUserForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={updateUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={roles.ADMIN}>Admin</SelectItem>
                        <SelectItem value={roles.MANAGER}>Manager</SelectItem>
                        <SelectItem value={roles.WORKER}>Worker</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={updateUserForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Inactive users cannot log in to the system
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={updateUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password (leave blank to keep current)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
