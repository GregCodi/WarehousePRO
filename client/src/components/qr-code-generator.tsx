import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
}

export default function QRCodeGenerator({
  value,
  size = 160,
  bgColor = "#FFFFFF",
  fgColor = "#000000"
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Generate the QR code
    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor
        }
      },
      (error) => {
        if (error) console.error("Error generating QR code:", error);
      }
    );
  }, [value, size, bgColor, fgColor]);

  return (
    <div className="qr-code-container">
      <canvas ref={canvasRef} />
    </div>
  );
}
