import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getAuthState, getAuthHeader } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { ProductWithInventory } from "@shared/schema";
import { useLocation, useRoute } from "wouter";

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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import QRCodeGenerator from "@/components/qr-code-generator";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Package2, Plus, Search, Edit, Trash2, QrCode, Loader2 } from "lucide-react";

// Form schema for product
const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  supplierId: z.coerce.number().optional(),
  minStockLevel: z.coerce.number().min(0, "Minimum stock level must be a positive number"),
});

type ProductFormValues = z.infer<typeof productSchema>;

// Form schema for inventory
const inventorySchema = z.object({
  productId: z.coerce.number(),
  storageAreaId: z.coerce.number(),
  quantity: z.coerce.number().min(0, "Quantity must be a positive number"),
});

type InventoryFormValues = z.infer<typeof inventorySchema>;

export default function Inventory() {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithInventory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { user } = getAuthState();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
  const [, params] = useRoute("/inventory?action=:action");
  const [, setLocation] = useLocation();

  // Handle query parameters
  if (params && params.action === 'new' && !isNewModalOpen) {
    setIsNewModalOpen(true);
    setLocation('/inventory', { replace: true });
  } else if (params && params.action === 'print-qr' && !isQrModalOpen) {
    setIsQrModalOpen(true);
    setLocation('/inventory', { replace: true });
  }

  // Fetch products
  const { data: products, isLoading } = useQuery<ProductWithInventory[]>({
    queryKey: ['/api/products'],
    queryFn: () => {
      const authHeaders = getAuthHeader();
      return fetch('/api/products?withInventory=true', {
        headers: authHeaders
      }).then(res => res.json());
    }
  });

  // Fetch categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => {
      const authHeaders = getAuthHeader();
      return fetch('/api/categories', {
        headers: authHeaders
      }).then(res => res.json());
    }
  });
  // Ensure categories is always an array
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  // Fetch suppliers for dropdown
  const { data: suppliersData } = useQuery({
    queryKey: ['/api/suppliers'],
    queryFn: () => {
      const authHeaders = getAuthHeader();
      return fetch('/api/suppliers', {
        headers: authHeaders
      }).then(res => res.json());
    }
  });
  // Ensure suppliers is always an array
  const suppliers = Array.isArray(suppliersData) ? suppliersData : [];

  // Fetch storage areas for dropdown
  const { data: storageAreasData } = useQuery({
    queryKey: ['/api/storage-areas'],
    queryFn: () => {
      const authHeaders = getAuthHeader();
      return fetch('/api/storage-areas', {
        headers: authHeaders
      }).then(res => res.json());
    }
  });
  // Ensure storageAreas is always an array
  const storageAreas = Array.isArray(storageAreasData) ? storageAreasData : [];

  // Create product mutation
  const createProduct = useMutation({
    mutationFn: (data: ProductFormValues) => 
      apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Product created",
        description: "The product has been created successfully",
      });
      setIsNewModalOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create product",
        description: error.message,
      });
    },
  });

  // Update product mutation
  const updateProduct = useMutation({
    mutationFn: (data: { id: number, product: ProductFormValues }) => 
      apiRequest("PUT", `/api/products/${data.id}`, data.product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Product updated",
        description: "The product has been updated successfully",
      });
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update product",
        description: error.message,
      });
    },
  });

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete product",
        description: error.message,
      });
    },
  });

  // Update inventory mutation
  const updateInventory = useMutation({
    mutationFn: (data: InventoryFormValues) => 
      apiRequest("POST", "/api/inventory", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/low-stock'] });
      toast({
        title: "Inventory updated",
        description: "The inventory has been updated successfully",
      });
      setIsInventoryModalOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update inventory",
        description: error.message,
      });
    },
  });

  // Product form
  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      categoryId: undefined,
      supplierId: undefined,
      minStockLevel: 0,
    },
  });

  // Inventory form
  const inventoryForm = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      productId: 0,
      storageAreaId: 0,
      quantity: 0,
    },
  });

  // Handle product form submission
  const onSubmitProduct = (data: ProductFormValues) => {
    if (selectedProduct) {
      updateProduct.mutate({ id: selectedProduct.id, product: data });
    } else {
      createProduct.mutate(data);
    }
  };

  // Handle inventory form submission
  const onSubmitInventory = (data: InventoryFormValues) => {
    updateInventory.mutate(data);
  };

  // Open edit modal and set form values
  const handleEditProduct = (product: ProductWithInventory) => {
    setSelectedProduct(product);
    productForm.reset({
      sku: product.sku,
      name: product.name,
      description: product.description || "",
      categoryId: product.categoryId !== null ? product.categoryId : undefined,
      supplierId: product.supplierId !== null ? product.supplierId : undefined,
      minStockLevel: product.minStockLevel,
    });
    setIsEditModalOpen(true);
  };

  // Open inventory modal and set form values
  const handleManageInventory = (product: ProductWithInventory) => {
    setSelectedProduct(product);
    inventoryForm.reset({
      productId: product.id,
      storageAreaId: 0,
      quantity: 0,
    });
    setIsInventoryModalOpen(true);
  };

  // Open QR modal
  const handleShowQR = (product: ProductWithInventory) => {
    setSelectedProduct(product);
    setIsQrModalOpen(true);
  };

  // Handle product deletion
  const handleDeleteProduct = (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate(id);
    }
  };

  // Filter products by search query
  const filteredProducts = Array.isArray(products) ? products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Check if a product has low stock
  const isLowStock = (product: ProductWithInventory) => {
    return product.totalStock <= product.minStockLevel;
  };

  return (
    <>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Inventory</h1>
          <p className="text-muted-foreground">Manage your products and inventory</p>
        </div>
        
        {isAdminOrManager && (
          <Button onClick={() => {
            setSelectedProduct(null);
            productForm.reset({
              sku: "",
              name: "",
              description: "",
              categoryId: undefined,
              supplierId: undefined,
              minStockLevel: 0,
            });
            setIsNewModalOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Search and filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or SKU..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Products table */}
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg font-medium">Products</CardTitle>
          <CardDescription>
            {filteredProducts ? `Showing ${filteredProducts.length} of ${products?.length} products` : 'Loading products...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[100px]">SKU</TableHead>
                    <TableHead className="min-w-[200px]">Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Min. Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{product.sku}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category?.name || 'N/A'}</TableCell>
                      <TableCell>{product.supplier?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${isLowStock(product) ? 'text-destructive' : ''}`}>
                          {product.totalStock}
                        </span>
                      </TableCell>
                      <TableCell>{product.minStockLevel}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleShowQR(product)}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleManageInventory(product)}
                          >
                            <Package2 className="h-4 w-4" />
                          </Button>
                          
                          {isAdminOrManager && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Package2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search term' : 'Start by adding your first product'}
              </p>
              {isAdminOrManager && !searchQuery && (
                <Button onClick={() => {
                  setSelectedProduct(null);
                  setIsNewModalOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Product Modal */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(onSubmitProduct)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter SKU" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={productForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter product description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={productForm.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers?.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={productForm.control}
                name="minStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stock Level*</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={createProduct.isPending}>
                  {createProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Product
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(onSubmitProduct)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter SKU" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={productForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter product description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={productForm.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers?.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={productForm.control}
                name="minStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stock Level*</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={updateProduct.isPending}>
                  {updateProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Product
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Inventory Management Modal */}
      <Dialog open={isInventoryModalOpen} onOpenChange={setIsInventoryModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Inventory</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <>
              <div className="flex items-center mb-4">
                <div className="flex-1">
                  <h3 className="font-medium">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">SKU: {selectedProduct.sku}</p>
                </div>
                <Badge className={isLowStock(selectedProduct) ? 'bg-destructive' : 'bg-success'}>
                  {isLowStock(selectedProduct) ? 'Low Stock' : 'In Stock'}
                </Badge>
              </div>
              
              <Tabs defaultValue="current">
                <TabsList className="mb-4">
                  <TabsTrigger value="current">Current Inventory</TabsTrigger>
                  <TabsTrigger value="update">Update Inventory</TabsTrigger>
                </TabsList>
                
                <TabsContent value="current">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Storage Area</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProduct.inventoryByArea && selectedProduct.inventoryByArea.length > 0 ? (
                          selectedProduct.inventoryByArea.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.storageArea.name}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center">
                              No inventory records found
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow className="bg-muted/50 font-medium">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">{selectedProduct.totalStock}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="update">
                  <Form {...inventoryForm}>
                    <form onSubmit={inventoryForm.handleSubmit(onSubmitInventory)} className="space-y-4">
                      <FormField
                        control={inventoryForm.control}
                        name="storageAreaId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Storage Area*</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value ? field.value.toString() : ''}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select storage area" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {storageAreas?.map((area) => (
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
                        control={inventoryForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity*</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="submit" disabled={updateInventory.isPending}>
                          {updateInventory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Update Inventory
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Product QR Code</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="text-center">
              <div className="relative mb-4 inline-block">
                <QRCodeGenerator 
                  value={JSON.stringify({
                    id: selectedProduct.id,
                    sku: selectedProduct.sku,
                    timestamp: new Date().toISOString()
                  })} 
                  size={200} 
                />
              </div>
              <h3 className="text-lg font-medium mb-1">{selectedProduct.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">SKU: {selectedProduct.sku}</p>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={() => {
                    const canvas = document.querySelector('#product-qr-code canvas') as HTMLCanvasElement;
                    if (canvas) {
                      const url = canvas.toDataURL('image/png');
                      const link = document.createElement('a');
                      link.download = `qr-${selectedProduct.sku}.png`;
                      link.href = url;
                      link.click();
                    }
                  }}
                  className="flex-1"
                >
                  Download
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      const qrCodeElement = document.querySelector('.qr-code-container');
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Print QR Code - ${selectedProduct.name}</title>
                            <style>
                              body {
                                font-family: Arial, sans-serif;
                                text-align: center;
                                padding: 20px;
                              }
                              .qr-container {
                                margin: 20px auto;
                                max-width: 300px;
                              }
                              .product-info {
                                margin-top: 10px;
                              }
                            </style>
                          </head>
                          <body>
                            <div class="qr-container">
                              ${qrCodeElement?.innerHTML || ''}
                            </div>
                            <div class="product-info">
                              <h3>${selectedProduct.name}</h3>
                              <p>SKU: ${selectedProduct.sku}</p>
                            </div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                      printWindow.print();
                      printWindow.close();
                    }
                  }}
                  className="flex-1"
                >
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
