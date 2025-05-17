import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Link } from "wouter";
import { 
  PlusCircle, 
  ScanBarcode, 
  ArrowRightLeft, 
  FileDown, 
  Printer 
} from "lucide-react";

interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function QuickAction({ href, icon, label }: QuickActionProps) {
  return (
    <Link href={href}>
      <a className="flex items-center p-3 rounded-md hover:bg-muted text-foreground">
        <span className="text-primary mr-3">{icon}</span>
        <span className="font-medium">{label}</span>
      </a>
    </Link>
  );
}

export default function QuickActions() {
  const actions = [
    {
      href: "/inventory?action=new",
      icon: <PlusCircle className="h-5 w-5" />,
      label: "Add New Product"
    },
    {
      href: "/qr-scanner",
      icon: <ScanBarcode className="h-5 w-5" />,
      label: "Scan QR Code"
    },
    {
      href: "/movements?action=new",
      icon: <ArrowRightLeft className="h-5 w-5" />,
      label: "Record Movement"
    },
    {
      href: "/reports?type=inventory",
      icon: <FileDown className="h-5 w-5" />,
      label: "Export Inventory"
    },
    {
      href: "/inventory?action=print-qr",
      icon: <Printer className="h-5 w-5" />,
      label: "Print QR Codes"
    }
  ];

  return (
    <Card className="bg-white dark:bg-card mb-6">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-1">
          {actions.map((action, index) => (
            <QuickAction 
              key={index}
              href={action.href}
              icon={action.icon}
              label={action.label}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
