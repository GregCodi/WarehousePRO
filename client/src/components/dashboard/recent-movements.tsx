import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MovementWithDetails } from "@shared/schema";
import { format } from "date-fns";

export default function RecentMovements() {
  const { data: movements, isLoading, error } = useQuery<MovementWithDetails[]>({
    queryKey: ['/api/dashboard/recent-movements'],
  });

  const statusBadgeStyles = {
    completed: "bg-success/10 text-success hover:bg-success/20",
    pending: "bg-warning/10 text-warning hover:bg-warning/20",
    "in_progress": "bg-info/10 text-info hover:bg-info/20",
    cancelled: "bg-destructive/10 text-destructive hover:bg-destructive/20"
  };

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${format(date, "h:mm a")}`;
    } 
    // Check if date is yesterday
    else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${format(date, "h:mm a")}`;
    } 
    // Otherwise, return the formatted date
    else {
      return format(date, "MMM d, h:mm a");
    }
  };

  return (
    <Card className="bg-white dark:bg-card mb-6">
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Recent Movements</CardTitle>
          <Link href="/movements">
            <Button variant="link" className="text-primary p-0 h-auto">
              View all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-medium text-muted-foreground">Product</TableHead>
                <TableHead className="font-medium text-muted-foreground">From</TableHead>
                <TableHead className="font-medium text-muted-foreground">To</TableHead>
                <TableHead className="font-medium text-muted-foreground">Quantity</TableHead>
                <TableHead className="font-medium text-muted-foreground">Date</TableHead>
                <TableHead className="font-medium text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    Loading recent movements...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-destructive">
                    Error loading data
                  </TableCell>
                </TableRow>
              ) : movements && movements.length > 0 ? (
                movements.map((movement) => (
                  <TableRow key={movement.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {movement.product?.name || 'Unknown Product'}
                    </TableCell>
                    <TableCell>{movement.fromArea?.name || 'N/A'}</TableCell>
                    <TableCell>{movement.toArea?.name || 'N/A'}</TableCell>
                    <TableCell>{movement.quantity}</TableCell>
                    <TableCell>{formatDate(movement.date)}</TableCell>
                    <TableCell>
                      <Badge className={statusBadgeStyles[movement.status as keyof typeof statusBadgeStyles] || ""}>
                        {movement.status.replace('_', ' ').charAt(0).toUpperCase() + movement.status.replace('_', ' ').slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No movements found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
