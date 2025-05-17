import { useQuery } from "@tanstack/react-query";
import { Package2, TriangleAlert, ArrowRightLeft, BarChart3 } from "lucide-react";
import StatsCard from "@/components/dashboard/stats-card";
import RecentMovements from "@/components/dashboard/recent-movements";
import StorageOccupancy from "@/components/dashboard/storage-occupancy";
import QuickActions from "@/components/dashboard/quick-actions";
import LowStockItems from "@/components/dashboard/low-stock-items";
import ProductQRCode from "@/components/dashboard/product-qr-code";
import { DashboardStats } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of warehouse operations</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Products"
          value={isLoadingStats ? "..." : stats?.totalProducts || 0}
          icon={<Package2 className="h-5 w-5 text-primary" />}
          iconBgColor="bg-primary"
          trend={{ value: 8.2, label: "vs last month", isPositive: true }}
        />
        
        <StatsCard
          title="Low Stock Items"
          value={isLoadingStats ? "..." : stats?.lowStockItems || 0}
          icon={<TriangleAlert className="h-5 w-5 text-warning" />}
          iconBgColor="bg-warning"
          trend={{ value: 12.5, label: "vs last week", isPositive: false }}
        />
        
        <StatsCard
          title="Pending Movements"
          value={isLoadingStats ? "..." : stats?.pendingMovements || 0}
          icon={<ArrowRightLeft className="h-5 w-5 text-info" />}
          iconBgColor="bg-info"
          trend={{ value: 3.8, label: "vs yesterday", isPositive: false }}
        />
        
        <StatsCard
          title="Storage Utilization"
          value={isLoadingStats ? "..." : `${stats?.storageUtilization || 0}%`}
          icon={<BarChart3 className="h-5 w-5 text-success" />}
          iconBgColor="bg-success"
          trend={{ value: 2.1, label: "vs last week", isPositive: true }}
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Larger */}
        <div className="lg:col-span-2">
          <RecentMovements />
          <StorageOccupancy />
        </div>

        {/* Right column - Smaller */}
        <div>
          <QuickActions />
          <LowStockItems />
          <ProductQRCode />
        </div>
      </div>
    </>
  );
}
