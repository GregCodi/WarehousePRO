import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LowStockItem } from "@shared/schema";

export default function LowStockItems() {
  const { data: lowStockItems, isLoading, error } = useQuery<LowStockItem[]>({
    queryKey: ['/api/dashboard/low-stock'],
  });

  // Helper function to determine text color based on stock levels
  const getStockLevelColor = (current: number, min: number) => {
    const ratio = current / min;
    if (ratio < 0.5) return "text-error";
    if (ratio < 0.75) return "text-warning";
    return "text-success";
  };

  return (
    <Card className="bg-white dark:bg-card mb-6">
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Low Stock Items</CardTitle>
          <Link href="/inventory?filter=lowStock">
            <Button variant="link" className="text-primary p-0 h-auto">
              View all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="py-8 text-center">
            <p>Loading low stock items...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">
            <p>Error loading low stock items</p>
          </div>
        ) : lowStockItems && lowStockItems.length > 0 ? (
          <ul className="divide-y divide-border">
            {lowStockItems.slice(0, 4).map((item, index) => (
              <li key={index} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.category?.name || "Uncategorized"} - {item.storageArea.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`${getStockLevelColor(item.currentStock, item.product.minStockLevel)} font-medium text-sm`}>
                      {item.currentStock} left
                    </p>
                    <p className="text-xs text-muted-foreground">Min: {item.product.minStockLevel}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No low stock items found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
