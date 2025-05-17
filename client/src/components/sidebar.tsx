import { Link, useLocation } from "wouter";
import { getAuthState, logout } from "@/lib/auth";

import { 
  LayoutDashboard, 
  Package2,
  Tags,
  Truck,
  ScanBarcode,
  BarChartBig,
  Users, 
  Settings,
  ArrowRightLeft,
  LogOut,
  User
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user } = getAuthState();

  const navItems = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/inventory", label: "Inventory", icon: <Package2 className="h-5 w-5" /> },
    { href: "/categories", label: "Categories", icon: <Tags className="h-5 w-5" /> },
    { href: "/suppliers", label: "Suppliers", icon: <Truck className="h-5 w-5" /> },
    { href: "/movements", label: "Movements", icon: <ArrowRightLeft className="h-5 w-5" /> },
    { href: "/qr-scanner", label: "QR Scanner", icon: <ScanBarcode className="h-5 w-5" /> },
    { href: "/reports", label: "Reports", icon: <BarChartBig className="h-5 w-5" /> },
  ];

  // Only show Users tab for admins
  if (user?.role === "admin") {
    navItems.push({ href: "/users", label: "Users", icon: <Users className="h-5 w-5" /> });
  }

  // Add settings at the end
  navItems.push({ href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> });

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <aside className={`${open ? 'flex' : 'hidden'} md:flex md:flex-shrink-0 z-30`}>
        <div className="flex flex-col w-64 bg-white dark:bg-[#1a1a1a] border-r border-neutral-light dark:border-neutral-dark">
          <div className="flex items-center justify-center h-16 px-4 border-b border-neutral-light dark:border-neutral-dark">
            <h1 className="text-xl font-medium text-primary">WarehousePro</h1>
          </div>
          
          {/* Role indicator */}
          <div className="flex items-center px-4 py-3 border-b border-neutral-light dark:border-neutral-dark">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <User className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.fullName || "User"}</p>
              <p className="text-xs text-neutral-medium">
                {user?.role === "admin" ? "Admin" : 
                 user?.role === "manager" ? "Manager" : 
                 "Worker"}
              </p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="p-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a
                      className={`sidebar-item flex items-center px-4 py-2 text-sm rounded-md group
                        ${location === item.href ? 'active' : 'hover:bg-neutral-lighter dark:hover:bg-muted'}`}
                      onClick={() => setOpen(false)}
                    >
                      <span className={`mr-3 ${location === item.href ? 'text-primary' : 'text-neutral-medium group-hover:text-primary'}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Logout */}
          <div className="p-4 border-t border-neutral-light dark:border-neutral-dark">
            <button
              onClick={handleLogout}
              className="flex items-center text-sm text-neutral-dark dark:text-neutral-light hover:text-primary dark:hover:text-primary w-full text-left"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
