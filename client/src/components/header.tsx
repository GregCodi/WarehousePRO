import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import { 
  Menu, 
  Search, 
  Bell, 
  HelpCircle, 
  Sun, 
  Moon
} from "lucide-react";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration fix for theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-white dark:bg-[#1a1a1a] shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Search bar */}
        <div className="hidden md:flex md:flex-1 max-w-md ml-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="w-full pl-10" 
              placeholder="Search anything..." 
              type="search"
            />
          </div>
        </div>
        
        {/* Right side icons */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>
          
          {/* Theme Toggle */}
          {mounted && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
