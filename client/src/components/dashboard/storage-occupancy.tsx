import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import { useState } from "react";

// Mock data for the chart
const mockData = [
  { name: "Zone A", occupancy: 82 },
  { name: "Zone B", occupancy: 65 },
  { name: "Zone C", occupancy: 47 },
  { name: "Receiving", occupancy: 35 },
  { name: "Shipping", occupancy: 20 },
];

type TimeFrame = "weekly" | "monthly" | "yearly";

export default function StorageOccupancy() {
  const [timeframe, setTimeframe] = useState<TimeFrame>("weekly");

  const handleTimeframeChange = (newTimeframe: TimeFrame) => {
    setTimeframe(newTimeframe);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-black p-2 border border-border rounded shadow-sm">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-primary">
            Occupancy: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white dark:bg-card mb-6">
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Storage Zone Occupancy</CardTitle>
          <div className="flex space-x-2">
            <Button 
              size="sm"
              variant={timeframe === "weekly" ? "secondary" : "ghost"}
              className={`text-xs px-3 py-1 h-auto ${timeframe === "weekly" ? 'bg-primary/10 text-primary' : ''}`}
              onClick={() => handleTimeframeChange("weekly")}
            >
              Weekly
            </Button>
            <Button 
              size="sm"
              variant={timeframe === "monthly" ? "secondary" : "ghost"}
              className={`text-xs px-3 py-1 h-auto ${timeframe === "monthly" ? 'bg-primary/10 text-primary' : ''}`}
              onClick={() => handleTimeframeChange("monthly")}
            >
              Monthly
            </Button>
            <Button 
              size="sm"
              variant={timeframe === "yearly" ? "secondary" : "ghost"}
              className={`text-xs px-3 py-1 h-auto ${timeframe === "yearly" ? 'bg-primary/10 text-primary' : ''}`}
              onClick={() => handleTimeframeChange("yearly")}
            >
              Yearly
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mockData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#9e9e9e" fontSize={12} />
              <YAxis unit="%" stroke="#9e9e9e" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="occupancy" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
