"use client";

import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { trpc } from "@/lib/trpc/provider";
import { InspectionPDF } from "./InspectionPDF";
import QRCode from "qrcode";
import { Button } from "@/components/ui";
import { FileText, Loader2 } from "lucide-react";
import { convertUrlToPngBase64 } from "@/lib/image-conversion";

export function PDFDownloadButton({ orderId }: { orderId: string }) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [trackingUrl, setTrackingUrl] = useState<string>("");
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isPreparingAssets, setIsPreparingAssets] = useState(true);
  const [processedInspections, setProcessedInspections] = useState<
    NonNullable<typeof publicStatus>["inspections"] | null
  >(null);
  const [iconBase64, setIconBase64] = useState<string | null>(null);

  const { data: publicStatus, isLoading } = trpc.order.getPublicStatus.useQuery(
    { orderId }
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !publicStatus) return;

    const prepareAssets = async () => {
      setIsPreparingAssets(true);

      // Generate QR Code
      const url = `${window.location.origin}/tracking/${orderId}`;
      setTrackingUrl(url);

      try {
        const qr = await QRCode.toDataURL(url, { width: 300, margin: 2 });
        setQrCodeUrl(qr);
      } catch (e) {}

      // Convert logo to base64
      const logoUrl = publicStatus.tenantContact.logo;
      if (logoUrl) {
        let urlToFetch = logoUrl;
        if (logoUrl.startsWith("/")) {
          urlToFetch = `${window.location.origin}${logoUrl}`;
        }
        try {
          const base64 = await convertUrlToPngBase64(urlToFetch);
          setLogoBase64(base64);
        } catch (e) {}
      }

      // Convert logo.svg to base64 for footer
      try {
        const iconUrl = `${window.location.origin}/branding/logo.svg`;
        const iconB64 = await convertUrlToPngBase64(iconUrl);
        setIconBase64(iconB64);
      } catch (e) {}

      // Convert all inspection images to base64
      if (publicStatus.inspections && publicStatus.inspections.length > 0) {
        const convertedInspections = await Promise.all(
          publicStatus.inspections.map(async (inspection) => {
            // Convert item photos
            const convertedItems = await Promise.all(
              inspection.items.map(async (item) => {
                if (item.photoUrl) {
                  try {
                    let photoUrlToFetch = item.photoUrl;
                    if (item.photoUrl.startsWith("/")) {
                      photoUrlToFetch = `${window.location.origin}${item.photoUrl}`;
                    }
                    const base64 = await convertUrlToPngBase64(photoUrlToFetch);
                    return { ...item, photoUrl: base64 };
                  } catch (e) {
                    return item;
                  }
                }
                return item;
              })
            );

            // Convert damage photos
            const convertedDamages = await Promise.all(
              inspection.damages.map(async (damage) => {
                if (damage.photoUrl) {
                  try {
                    let photoUrlToFetch = damage.photoUrl;
                    if (damage.photoUrl.startsWith("/")) {
                      photoUrlToFetch = `${window.location.origin}${damage.photoUrl}`;
                    }
                    const base64 = await convertUrlToPngBase64(photoUrlToFetch);
                    return { ...damage, photoUrl: base64 };
                  } catch (e) {
                    return damage;
                  }
                }
                return damage;
              })
            );

            return {
              ...inspection,
              items: convertedItems,
              damages: convertedDamages,
            };
          })
        );
        setProcessedInspections(convertedInspections);
      } else {
        setProcessedInspections(publicStatus.inspections || []);
      }

      setIsPreparingAssets(false);
    };

    prepareAssets();
  }, [orderId, publicStatus]);

  if (!isClient) return null;

  if (
    isLoading ||
    !publicStatus ||
    !qrCodeUrl ||
    !trackingUrl ||
    isPreparingAssets
  ) {
    return (
      <Button variant="outline" disabled size="sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Preparando PDF...
      </Button>
    );
  }

  // Create modified data with base64 images
  const pdfData = {
    ...publicStatus,
    tenantContact: {
      ...publicStatus.tenantContact,
      logo:
        logoBase64 ||
        (publicStatus.tenantContact.logo?.startsWith("/")
          ? `${window.location.origin}${publicStatus.tenantContact.logo}`
          : publicStatus.tenantContact.logo),
    },
    inspections: processedInspections || publicStatus.inspections,
  };

  return (
    <PDFDownloadLink
      document={
        <InspectionPDF
          data={pdfData}
          qrCodeUrl={qrCodeUrl}
          trackingUrl={trackingUrl}
          iconBase64={iconBase64}
        />
      }
      fileName={`vistoria-${publicStatus.vehicleName}-${publicStatus.status}.pdf`}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4 font-bold text-red-600" />
          )}
          {loading ? "Gerando PDF..." : "Baixar PDF Convite"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
