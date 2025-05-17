import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

type StatsTrend = {
  value: number;
  label: string;
  isPositive: boolean;
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  trend?: StatsTrend;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  iconBgColor,
  trend 
}: StatsCardProps) {
  return (
    <Card className="bg-white dark:bg-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-neutral-medium text-sm">{title}</p>
            <h3 className="text-2xl font-medium mt-1">{value}</h3>
          </div>
          <div className={`${iconBgColor} bg-opacity-10 p-2 rounded-full`}>
            {icon}
          </div>
        </div>
        
        {trend && (
          <div className="flex items-center mt-4">
            <span className={`${trend.isPositive ? 'text-success' : 'text-error'} text-xs font-medium flex items-center`}>
              {trend.isPositive ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {trend.value}%
            </span>
            <span className="text-xs text-neutral-medium ml-2">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
