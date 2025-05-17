import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthState } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FileSpreadsheet, Download, BarChart3, PieChart as PieChartIcon, CircleDollarSign, Loader2, FileSearch, Clock } from "lucide-react";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("inventory");
  const { toast } = useToast();
  const { user } = getAuthState();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
  
  // Only admin and manager can access reports
  if (!isAdminOrManager) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <FileSearch className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-medium mb-2">Access Restricted</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have permission to access this section. Contact an administrator if you need access.
        </p>
      </div>
    );
  }

  // Fetch dashboard stats for charts
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: () => fetch('/api/dashboard/stats').then(res => res.json()),
  });

  // Fetch low stock items for charts
  const { data: lowStockItems, isLoading: isLoadingLowStock } = useQuery({
    queryKey: ['/api/dashboard/low-stock'],
    queryFn: () => fetch('/api/dashboard/low-stock').then(res => res.json()),
  });

  // Fetch recent movements for charts
  const { data: movements, isLoading: isLoadingMovements } = useQuery({
    queryKey: ['/api/dashboard/recent-movements', 30],
    queryFn: () => fetch('/api/dashboard/recent-movements?limit=30').then(res => res.json()),
  });

  // Download CSV reports
  const downloadReport = (reportType: string) => {
    let url = '';
    let filename = '';
    
    switch (reportType) {
      case 'inventory':
        url = '/api/reports/inventory/csv';
        filename = 'inventory-report.csv';
        break;
      case 'movements':
        url = '/api/reports/movements/csv';
        filename = 'movements-report.csv';
        break;
      case 'low-stock':
        url = '/api/reports/low-stock/csv';
        filename = 'low-stock-report.csv';
        break;
      default:
        return;
    }
    
    // Start download
    toast({
      title: "Downloading report",
      description: `Your ${reportType} report is being downloaded`,
    });
    
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(error => {
        toast({
          variant: "destructive",
          title: "Download failed",
          description: "There was an error downloading the report",
        });
      });
  };

  // Mock data for inventory by category chart
  const inventoryByCategoryData = [
    { name: "Electronics", value: 382 },
    { name: "Accessories", value: 247 },
    { name: "Cables", value: 176 },
    { name: "Storage", value: 98 },
    { name: "Other", value: 45 },
  ];

  // Mock data for inventory movement trend
  const movementTrendData = [
    { name: "Jan", inbound: 45, outbound: 32 },
    { name: "Feb", inbound: 52, outbound: 41 },
    { name: "Mar", inbound: 61, outbound: 54 },
    { name: "Apr", inbound: 67, outbound: 58 },
    { name: "May", inbound: 55, outbound: 63 },
    { name: "Jun", inbound: 72, outbound: 51 },
  ];

  // Colors for pie chart
  const COLORS = ['#1976d2', '#388e3c', '#f57c00', '#e53935', '#5c6bc0'];

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground">Reports</h1>
        <p className="text-muted-foreground">Generate and download warehouse reports</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="inventory" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Inventory Reports
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Movement Reports
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <CircleDollarSign className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-lg font-medium">Inventory Report</CardTitle>
                <CardDescription>
                  Export a full inventory report with current stock levels
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center p-6">
                  <FileSpreadsheet className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-2">Inventory CSV Export</h3>
                  <p className="text-muted-foreground mb-4">
                    This report includes all products, categories, suppliers, and current stock levels
                  </p>
                  <Button onClick={() => downloadReport('inventory')} className="flex gap-2">
                    <Download className="h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-lg font-medium">Low Stock Report</CardTitle>
                <CardDescription>
                  Export a report of all items with low stock levels
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center p-6">
                  <FileSpreadsheet className="h-12 w-12 text-warning mb-4" />
                  <h3 className="text-lg font-medium mb-2">Low Stock CSV Export</h3>
                  <p className="text-muted-foreground mb-4">
                    This report includes all products that have stock levels below their minimum threshold
                  </p>
                  <Button onClick={() => downloadReport('low-stock')} className="flex gap-2">
                    <Download className="h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-6">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-lg font-medium">Inventory by Category</CardTitle>
              <CardDescription>
                Visualization of inventory distribution by product category
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryByCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {inventoryByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} units`, 'Quantity']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="movements">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-lg font-medium">Movements Report</CardTitle>
                <CardDescription>
                  Export a report of all inventory movements
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center p-6">
                  <FileSpreadsheet className="h-12 w-12 text-info mb-4" />
                  <h3 className="text-lg font-medium mb-2">Movements CSV Export</h3>
                  <p className="text-muted-foreground mb-4">
                    This report includes all inventory movements with details like date, product, source, destination, quantity, and status
                  </p>
                  <Button onClick={() => downloadReport('movements')} className="flex gap-2">
                    <Download className="h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-lg font-medium">Movement Status Breakdown</CardTitle>
                <CardDescription>
                  Current status of all inventory movements
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {isLoadingMovements ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : movements ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { 
                              name: "Completed", 
                              value: movements.filter((m: any) => m.status === "completed").length 
                            },
                            { 
                              name: "Pending", 
                              value: movements.filter((m: any) => m.status === "pending").length 
                            },
                            { 
                              name: "In Progress", 
                              value: movements.filter((m: any) => m.status === "in_progress").length 
                            },
                            { 
                              name: "Cancelled", 
                              value: movements.filter((m: any) => m.status === "cancelled").length 
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill="#4caf50" />
                          <Cell fill="#ff9800" />
                          <Cell fill="#2196f3" />
                          <Cell fill="#f44336" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <PieChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No movement data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-6">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-lg font-medium">Inventory Movement Trends</CardTitle>
              <CardDescription>
                Inbound vs outbound movement trends over time
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={movementTrendData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="inbound" fill="#1976d2" name="Inbound" />
                    <Bar dataKey="outbound" fill="#f57c00" name="Outbound" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-lg font-medium">Warehouse Storage Utilization</CardTitle>
                <CardDescription>
                  Storage capacity utilization by zone
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Zone A", utilization: 82 },
                        { name: "Zone B", utilization: 65 },
                        { name: "Zone C", utilization: 47 },
                        { name: "Receiving", utilization: 35 },
                        { name: "Shipping", utilization: 20 },
                      ]}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value) => [`${value}%`, 'Utilization']} />
                      <Bar dataKey="utilization" fill="#1976d2" name="Utilization Percentage" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-lg font-medium">Low Stock Analysis</CardTitle>
                <CardDescription>
                  Products requiring restock by category
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {isLoadingLowStock ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : lowStockItems && lowStockItems.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={
                            // Group by category and count
                            Object.entries(
                              lowStockItems.reduce((acc: any, item: any) => {
                                const category = item.category ? item.category.name : 'Uncategorized';
                                acc[category] = (acc[category] || 0) + 1;
                                return acc;
                              }, {})
                            ).map(([name, value]) => ({ name, value }))
                          }
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <PieChartIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No low stock items found</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-lg font-medium">Movement Efficiency</CardTitle>
                <CardDescription>
                  Average completion time for movements
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground">
                    This analytics feature will be available in the next version
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
