import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getAuthState, getAuthHeader } from "@/lib/auth";
import { MovementWithDetails, movementStatus } from "@shared/schema";
import { format } from "date-fns";
import { useRoute } from "wouter";

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

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRightLeft, Plus, CheckCircle, XCircle, Loader2, History } from "lucide-react";

// Form schema for movement
const movementSchema = z.object({
  productId: z.coerce.number({
    required_error: "Product is required",
  }),
  fromAreaId: z.coerce.number().optional(),
  toAreaId: z.coerce.number().optional(),
  quantity: z.coerce.number({
    required_error: "Quantity is required",
  }).positive("Quantity must be positive"),
  status: z.string({
    required_error: "Status is required",
  }),
});

type MovementFormValues = z.infer<typeof movementSchema>;

export default function Movements() {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [, params] = useRoute("/movements?action=:action");
  const { toast } = useToast();
  const { user } = getAuthState();

  // Handle query parameters
  if (params && params.action === 'new' && !isNewModalOpen) {
    setIsNewModalOpen(true);
  }

  // Fetch movements
  const { data: movements, isLoading } = useQuery<MovementWithDetails[]>({
    queryKey: ['/api/dashboard/recent-movements', 100],
    queryFn: () => {
      const authHeaders = getAuthHeader();
      return fetch('/api/dashboard/recent-movements?limit=100', {
        headers: authHeaders
      }).then(res => res.json());
    },
  });

  // Fetch products for dropdown
  const { data: products } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => {
      const authHeaders = getAuthHeader();
      return fetch('/api/products', {
        headers: authHeaders
      }).then(res => res.json());
    },
  });

  // Fetch storage areas for dropdown
  const { data: storageAreas } = useQuery({
    queryKey: ['/api/storage-areas'],
    queryFn: () => {
      const authHeaders = getAuthHeader();
      return fetch('/api/storage-areas', {
        headers: authHeaders
      }).then(res => res.json());
    },
  });

  // Create movement mutation
  const createMovement = useMutation({
    mutationFn: (data: MovementFormValues) => 
      apiRequest("POST", "/api/movements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-movements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Movement recorded",
        description: "The movement has been recorded successfully",
      });
      setIsNewModalOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to record movement",
        description: error.message,
      });
    },
  });

  // Update movement status mutation
  const updateMovementStatus = useMutation({
    mutationFn: (data: { id: number, status: string }) => 
      apiRequest("PUT", `/api/movements/${data.id}/status`, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-movements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Movement updated",
        description: "The movement status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update movement",
        description: error.message,
      });
    },
  });

  // Movement form
  const movementForm = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      productId: 0,
      fromAreaId: undefined,
      toAreaId: undefined,
      quantity: 1,
      status: movementStatus.PENDING,
    },
  });

  // Handle movement form submission
  const onSubmitMovement = (data: MovementFormValues) => {
    // Ensure either fromAreaId or toAreaId is provided
    if (!data.fromAreaId && !data.toAreaId) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Either 'From Area' or 'To Area' is required",
      });
      return;
    }
    
    createMovement.mutate(data);
  };

  // Handle movement status update
  const handleUpdateStatus = (id: number, status: string) => {
    updateMovementStatus.mutate({ id, status });
  };

  // Get badge style based on status
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case movementStatus.COMPLETED:
        return "bg-success/10 text-success hover:bg-success/20";
      case movementStatus.PENDING:
        return "bg-warning/10 text-warning hover:bg-warning/20";
      case movementStatus.IN_PROGRESS:
        return "bg-info/10 text-info hover:bg-info/20";
      case movementStatus.CANCELLED:
        return "bg-destructive/10 text-destructive hover:bg-destructive/20";
      default:
        return "";
    }
  };

  // Format date
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy h:mm a");
  };

  return (
    <>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Movements</h1>
          <p className="text-muted-foreground">Track and record inventory movements</p>
        </div>
        
        <Button onClick={() => setIsNewModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Movement
        </Button>
      </div>

      {/* Movements table */}
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg font-medium">Inventory Movements</CardTitle>
          <CardDescription>
            {movements ? `Showing ${movements.length} recent movements` : 'Loading movements...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : movements && movements.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id} className="hover:bg-muted/50">
                      <TableCell>{formatDate(movement.date)}</TableCell>
                      <TableCell className="font-medium">{movement.product.name}</TableCell>
                      <TableCell>{movement.fromArea?.name || 'N/A'}</TableCell>
                      <TableCell>{movement.toArea?.name || 'N/A'}</TableCell>
                      <TableCell>{movement.quantity}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeStyle(movement.status)}>
                          {movement.status.replace('_', ' ').charAt(0).toUpperCase() + movement.status.replace('_', ' ').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{movement.user.fullName}</TableCell>
                      <TableCell className="text-right">
                        {movement.status === movementStatus.PENDING && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Complete"
                              onClick={() => handleUpdateStatus(movement.id, movementStatus.COMPLETED)}
                            >
                              <CheckCircle className="h-4 w-4 text-success" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Cancel"
                              onClick={() => handleUpdateStatus(movement.id, movementStatus.CANCELLED)}
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
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
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No movements found</h3>
              <p className="text-muted-foreground mb-4">
                Start by recording your first inventory movement
              </p>
              <Button onClick={() => setIsNewModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Record Movement
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Movement Modal */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Inventory Movement</DialogTitle>
          </DialogHeader>
          
          <Form {...movementForm}>
            <form onSubmit={movementForm.handleSubmit(onSubmitMovement)} className="space-y-4">
              <FormField
                control={movementForm.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value.toString() || "0"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products?.map((product: any) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={movementForm.control}
                  name="fromAreaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Area</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source area" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {storageAreas?.map((area: any) => (
                            <SelectItem key={area.id} value={area.id.toString()}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={movementForm.control}
                  name="toAreaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Area</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination area" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {storageAreas?.map((area: any) => (
                            <SelectItem key={area.id} value={area.id.toString()}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={movementForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity*</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={movementForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={movementStatus.PENDING}>Pending</SelectItem>
                          <SelectItem value={movementStatus.IN_PROGRESS}>In Progress</SelectItem>
                          <SelectItem value={movementStatus.COMPLETED}>Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={createMovement.isPending}>
                  {createMovement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Movement
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
