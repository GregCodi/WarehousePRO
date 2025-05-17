import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import QRCodeGenerator from "@/components/qr-code-generator";

interface ProductQRCodeProps {
  productId?: number;
  productName?: string;
  productSku?: string;
}

export default function ProductQRCode({ 
  productId = 1, 
  productName = "Wireless Headphones", 
  productSku = "WH-BT-001" 
}: ProductQRCodeProps) {
  // QR code value would include product info for scanning
  const qrValue = JSON.stringify({
    id: productId,
    sku: productSku,
    timestamp: new Date().toISOString()
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const qrCodeElement = document.getElementById('product-qr-code');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${productName}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
              }
              .qr-container {
                margin: 20px auto;
                max-width: 200px;
              }
              .product-info {
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              ${qrCodeElement?.innerHTML || ''}
            </div>
            <div class="product-info">
              <h3>${productName}</h3>
              <p>SKU: ${productSku}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleDownload = () => {
    const canvas = document.querySelector('#product-qr-code canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr-${productSku}.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <Card className="bg-white dark:bg-card mb-6">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg font-medium">Product QR Code</CardTitle>
      </CardHeader>
      <CardContent className="p-4 text-center">
        <div id="product-qr-code" className="relative mb-4 inline-block">
          <QRCodeGenerator value={qrValue} />
        </div>
        <p className="text-sm font-medium mb-1">{productName}</p>
        <p className="text-xs text-muted-foreground mb-4">SKU: {productSku}</p>
        <div className="flex justify-center space-x-2">
          <Button 
            variant="default" 
            size="sm"
            className="flex items-center"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
