import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ScanBarcode, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Camera 
} from "lucide-react";
import { Link } from "wouter";

// Mocking the QR code scanner functionality since we can't use the actual camera
// In a real application, you would use a library like react-qr-reader

export default function QRScanner() {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("scan");
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Fetch products for demonstration
  const { data: products } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => fetch('/api/products').then(res => res.json()),
    enabled: tab === "history",
  });

  useEffect(() => {
    // Reset state when tab changes
    setScanning(false);
    setScannedData(null);
    setError(null);
  }, [tab]);

  // Simulate starting the camera
  const startScanner = () => {
    setScanning(true);
    setScannedData(null);
    setError(null);
    
    // Simulate camera initialization delay
    setTimeout(() => {
      // In a real app, you would initialize the camera here
      if (videoRef.current) {
        // Simulate a failure sometimes
        if (Math.random() > 0.9) {
          setScanning(false);
          setError("Failed to access camera. Please check permissions and try again.");
          return;
        }
      }
    }, 1500);
  };

  // Simulate scanning a QR code
  const handleScan = () => {
    // Simulate processing time
    setTimeout(() => {
      // For demo purposes, create a random product scan
      if (products && products.length > 0) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        
        const scannedResult = {
          id: randomProduct.id,
          sku: randomProduct.sku,
          name: randomProduct.name,
          timestamp: new Date().toISOString()
        };
        
        setScannedData(scannedResult);
        setScanning(false);
        
        toast({
          title: "QR Code Scanned",
          description: `Product: ${scannedResult.name} (${scannedResult.sku})`,
        });
      } else {
        setError("No product data available for scanning demo.");
        setScanning(false);
      }
    }, 2000);
  };

  // Simulate cancelling the scan
  const stopScanner = () => {
    setScanning(false);
  };

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-foreground">QR Scanner</h1>
        <p className="text-muted-foreground">Scan product QR codes to view details or record movements</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="scan" className="flex items-center">
            <Camera className="h-4 w-4 mr-2" />
            Scan QR Code
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <ScanBarcode className="h-4 w-4 mr-2" />
            Scan History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="scan">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-lg font-medium">Scanner</CardTitle>
                <CardDescription>
                  Scan a product QR code using your camera
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="aspect-video relative rounded-md overflow-hidden bg-black flex items-center justify-center mb-4">
                  {scanning ? (
                    <>
                      <video 
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-white text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p>Scanning... Position QR code in frame</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-white text-center">
                      <ScanBarcode className="h-16 w-16 mx-auto mb-2 opacity-50" />
                      <p>Camera feed will appear here</p>
                    </div>
                  )}
                </div>
                
                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  {scanning ? (
                    <>
                      <Button onClick={handleScan} className="flex-1">
                        Simulate Scan
                      </Button>
                      <Button variant="outline" onClick={stopScanner} className="flex-1">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={startScanner} className="w-full">
                      Start Scanner
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-lg font-medium">
                  {scannedData ? "Scan Result" : "Awaiting Scan"}
                </CardTitle>
                <CardDescription>
                  {scannedData ? "Product details from your scan" : "Scan a QR code to see details"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {scannedData ? (
                  <div>
                    <div className="bg-success/10 rounded-md p-3 mb-4 flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-success mr-2" />
                      <p className="text-success font-medium">Successfully scanned QR code</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Product Information</h3>
                        <Separator className="mb-2" />
                        <p className="text-lg font-medium">{scannedData.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {scannedData.sku}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Scan Details</h3>
                        <Separator className="mb-2" />
                        <p className="text-sm">
                          Scanned on: {new Date(scannedData.timestamp).toLocaleString()}
                        </p>
                        <p className="text-sm">
                          Product ID: {scannedData.id}
                        </p>
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                        <Link href={`/inventory?productId=${scannedData.id}`}>
                          <Button className="flex-1">View Product</Button>
                        </Link>
                        <Link href={`/movements?action=new&productId=${scannedData.id}`}>
                          <Button variant="outline" className="flex-1">Record Movement</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-56 text-center">
                    <ScanBarcode className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No scan results yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Use the scanner to scan a product QR code and view details here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-lg font-medium">Scan History</CardTitle>
              <CardDescription>
                Recent QR code scans and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <ScanBarcode className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No scan history available</h3>
                <p className="text-muted-foreground mb-4">
                  Your scan history will appear here after you've scanned QR codes
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
