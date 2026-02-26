"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
} from "@react-pdf/renderer";
import type { AppRouter } from "@/server/routers/_app";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type PublicStatus = RouterOutputs["order"]["getPublicStatus"] & {
  vehiclePlate?: string | null;
  products?: { name: string; quantity: number }[];
  payments?: { amount: number; method: string; paidAt: Date }[];
  subtotal?: number;
  discountType?: string | null;
  discountValue?: number;
};

interface InspectionPDFProps {
  data: PublicStatus;
  qrCodeUrl: string;
  trackingUrl: string;
  iconBase64?: string | null;
}

export const InspectionPDF = ({
  data,
  qrCodeUrl,
  trackingUrl,
  iconBase64,
}: InspectionPDFProps) => {
  const primaryColor = data.tenantContact.primaryColor || "#DC2626"; // Default Red
  const secondaryColor = data.tenantContact.secondaryColor || "#0F172A"; // Default Navy

  const styles = StyleSheet.create({
    page: {
      padding: 0,
      backgroundColor: "#FFFFFF",
      fontFamily: "Helvetica",
    },
    // Top Accent
    topBar: {
      height: 4,
      backgroundColor: primaryColor,
      width: "100%",
    },
    // Main Container
    content: {
      paddingHorizontal: 40,
      paddingVertical: 30,
    },
    // Header Block
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 30,
    },
    logoContainer: {
      width: "60%",
    },
    logo: {
      width: 140,
      height: 50,
      objectFit: "contain",
    },
    qrContainer: {
      width: "80pt",
      alignItems: "center",
    },
    qrCode: {
      width: 60,
      height: 60,
      borderWidth: 1,
      borderColor: "#F1F5F9",
      padding: 2,
    },
    qrLabel: {
      fontSize: 7,
      color: "#64748B",
      marginTop: 4,
      textAlign: "center",
    },
    // Title Section
    titleBar: {
      backgroundColor: "#F8FAFC",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 4,
      marginBottom: 25,
      borderLeftWidth: 3,
      borderLeftColor: primaryColor,
    },
    titleText: {
      fontSize: 14,
      fontWeight: "bold",
      color: secondaryColor,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    // Grid Info
    infoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 10,
    },
    infoBlock: {
      width: "50%",
      marginBottom: 15,
      paddingRight: 10,
    },
    label: {
      fontSize: 8,
      color: "#94A3B8",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 3,
    },
    value: {
      fontSize: 11,
      color: "#1E293B",
      fontWeight: "bold",
    },
    // Section Header
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      marginTop: 15,
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: secondaryColor,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    sectionLine: {
      flex: 1,
      height: 1,
      backgroundColor: "#F1F5F9",
      marginLeft: 10,
    },
    // Table
    table: {
      width: "100%",
      marginTop: 5,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#F8FAFC",
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#E2E8F0",
    },
    tableHeaderText: {
      fontSize: 8,
      color: "#64748B",
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#F1F5F9",
    },
    tableRowEven: {
      backgroundColor: "#FAFBFC",
    },
    col1: { width: "70%" },
    col2: { width: "30%", textAlign: "right" },
    cellText: { fontSize: 10, color: "#334155" },
    cellTextBold: { fontSize: 10, color: "#1E293B", fontWeight: "bold" },
    // Avarias Grid
    damageGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    damageCard: {
      width: "31%",
      padding: 8,
      backgroundColor: "#F8FAFC",
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#E2E8F0",
    },
    damageTitle: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#1E293B",
      marginBottom: 2,
    },
    damageDesc: {
      fontSize: 8,
      color: "#64748B",
    },
    // Totals Section
    totalsContainer: {
      marginTop: 15,
      alignItems: "flex-end",
    },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      width: "50%",
      marginBottom: 4,
    },
    totalsLabel: {
      fontSize: 9,
      color: "#64748B",
      width: 80,
      textAlign: "right",
      paddingRight: 10,
    },
    totalsValue: {
      fontSize: 9,
      color: "#1E293B",
      width: 70,
      textAlign: "right",
      fontWeight: "bold",
    },
    totalBox: {
      width: "40%",
      backgroundColor: secondaryColor,
      padding: 10,
      borderRadius: 4,
      alignItems: "flex-end",
      marginTop: 8,
    },
    totalLabelFinal: {
      fontSize: 9,
      color: "#CBD5E1",
      textTransform: "uppercase",
      marginBottom: 2,
    },
    totalValueFinal: {
      fontSize: 16,
      color: "#FFFFFF",
      fontWeight: "bold",
    },
    // Signature Styles
    signatureSection: {
      marginTop: 30,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: "#F1F5F9",
    },
    signatureContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    signatureBlock: {
      width: "45%",
      alignItems: "center",
    },
    signatureImage: {
      width: 120,
      height: 40,
      objectFit: "contain",
      marginBottom: 5,
    },
    signatureLine: {
      width: "100%",
      height: 1,
      backgroundColor: "#94A3B8",
      marginBottom: 5,
    },
    signatureLabel: {
      fontSize: 8,
      color: "#64748B",
      textAlign: "center",
    },
    signatureDate: {
      fontSize: 7,
      color: "#94A3B8",
      marginTop: 2,
    },
    // Footer
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 40,
      backgroundColor: "#F8FAFC",
      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    footerBrandContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    footerIcon: {
      width: 60,
      height: 20,
      objectFit: "contain",
    },
    footerInfo: {
      fontSize: 8,
      color: "#94A3B8",
    },
    // Image Gallery
    inspectionPage: {
      padding: 40,
      paddingTop: 30,
      backgroundColor: "#FFFFFF",
      fontFamily: "Helvetica",
    },
    inspectionPageHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#E2E8F0",
    },
    inspectionPageTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: secondaryColor,
    },
    inspectionPageSubtitle: {
      fontSize: 9,
      color: "#64748B",
    },
    imageGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12, // Reduced gap config for 3 columns
    },
    imageCard: {
      width: "31%", // 3 columns instead of 2 (which was 48%)
      marginBottom: 15,
      backgroundColor: "#F8FAFC",
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      padding: 6,
    },
    inspectionImage: {
      width: "100%",
      height: 120, // slightly smaller height for 3cols
      objectFit: "cover",
      borderRadius: 2,
      marginBottom: 6,
    },
    imageCaption: {
      fontSize: 8,
      fontWeight: "bold",
      color: "#1E293B",
      textAlign: "center",
      marginBottom: 2,
    },
    imageStatusBadge: {
      fontSize: 7,
      color: "#FFFFFF",
      backgroundColor: primaryColor,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 2,
    },
    imageStatusOk: {
      backgroundColor: "#10B981", // Emerald 500
    },
    imageStatusWarning: {
      backgroundColor: "#F59E0B", // Amber 500
    },
    imageSubcaption: {
      fontSize: 7,
      color: "#64748B",
      textAlign: "center",
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const damageTypeLabels: Record<string, string> = {
    arranhao: "Arranhão",
    amassado: "Amassado",
    trinca: "Trinca",
    mancha: "Mancha",
    risco: "Risco",
    pintura: "Pintura",
    outro: "Outro",
  };

  const severityLabels: Record<string, string> = {
    leve: "Leve",
    moderado: "Moderado",
    grave: "Grave",
  };

  const paymentMethodLabels: Record<string, string> = {
    PIX: "PIX",
    CARTAO_CREDITO: "Cartão de Crédito",
    CARTAO_DEBITO: "Cartão de Débito",
    DINHEIRO: "Dinheiro",
    TRANSFERENCIA: "Transferência",
  };

  // Safe checks for inspections array
  const inspectionsArray = Array.isArray(data.inspections)
    ? data.inspections
    : [];

  const entradaInspection = inspectionsArray.find(
    (i: any) => i.type === "entrada",
  );
  const intermediariaInspection = inspectionsArray.find(
    (i: any) => i.type === "intermediaria",
  );
  const saidaInspection = inspectionsArray.find((i: any) => i.type === "final");

  const avarias =
    entradaInspection?.items?.filter(
      (item: any) => item.status === "com_avaria",
    ) || [];

  // Helpers for inspection images
  const inspectionTypeLabels: Record<string, string> = {
    entrada: "Vistoria de Entrada",
    intermediaria: "Vistoria Intermediária",
    final: "Vistoria de Saída",
  };

  const getInspectionImages = (inspection: any) => {
    if (!inspection || inspection.status !== "concluida") return [];

    const images: {
      url: string;
      label: string;
      status: string;
      damageInfo: string;
    }[] = [];

    // Add item photos (support multiple photos via photos array, fallback to photoUrl)
    inspection.items?.forEach((item: any) => {
      // If we have the array with multiple photos
      if (item.photos && Array.isArray(item.photos) && item.photos.length > 0) {
        item.photos.forEach((photo: string, idx: number) => {
          images.push({
            url: photo,
            label: `${item.label || "Item"}${item.photos.length > 1 ? ` (${idx + 1}/${item.photos.length})` : ""}`,
            status: item.status,
            damageInfo:
              item.status === "com_avaria"
                ? `${damageTypeLabels[item.damageType] || item.damageType || "Dano"} • ${severityLabels[item.severity] || item.severity || "-"}`
                : "Sem Avaria",
          });
        });
      } else if (item.photoUrl) {
        // Fallback for older items with only 1 photo string
        images.push({
          url: item.photoUrl,
          label: item.label || "Item",
          status: item.status,
          damageInfo:
            item.status === "com_avaria"
              ? `${damageTypeLabels[item.damageType] || item.damageType || "Dano"} • ${severityLabels[item.severity] || item.severity || "-"}`
              : "Sem Avaria",
        });
      }
    });

    // Add standalone damage photos (older version fallback)
    inspection.damages?.forEach((damage: any, index: number) => {
      if (damage.photoUrl) {
        images.push({
          url: damage.photoUrl,
          label: `Avaria Declarada Livre ${index + 1}`,
          status: "com_avaria",
          damageInfo: `${damageTypeLabels[damage.damageType] || damage.damageType || "Dano"}`,
        });
      }
    });

    return images;
  };

  const completedInspections = [
    { type: "entrada", inspection: entradaInspection },
    { type: "intermediaria", inspection: intermediariaInspection },
    { type: "final", inspection: saidaInspection },
  ].filter(
    (i) =>
      i.inspection?.status === "concluida" &&
      getInspectionImages(i.inspection).length > 0,
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} />

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              {data.tenantContact.logo ? (
                <Image src={data.tenantContact.logo} style={styles.logo} />
              ) : (
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: secondaryColor,
                  }}
                >
                  {data.tenantContact.name || "EMPRESA"}
                </Text>
              )}
            </View>
            <Link src={trackingUrl} style={styles.qrContainer}>
              <Image src={qrCodeUrl} style={styles.qrCode} />
              <Text style={styles.qrLabel}>Rastreamento On-line</Text>
            </Link>
          </View>

          <View style={styles.titleBar}>
            <Text style={styles.titleText}>
              Relatório de Ordem de Serviço / Vistoria
            </Text>
          </View>

          {/* Grid de Informações */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Cliente</Text>
              <Text style={styles.value}>
                {String(data.customerName || "N/A")}
              </Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Veículo</Text>
              <Text style={styles.value}>
                {String(data.vehicleName || "N/A")}
              </Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Placa / Cor</Text>
              <Text style={styles.value}>
                {data.vehiclePlate ? String(data.vehiclePlate) : "---"} •{" "}
                {data.vehicleColor ? String(data.vehicleColor) : "---"}
              </Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Status Geral</Text>
              <Text style={[styles.value, { color: primaryColor }]}>
                {String(data.status || "N/A")
                  .replace(/_/g, " ")
                  .toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Serviços Ocultado se Vazio */}
          {data.services && data.services.length > 0 && (
            <View style={{ marginTop: 15 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Serviços Executados</Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.col1]}>
                    Descrição
                  </Text>
                  <Text style={[styles.tableHeaderText, styles.col2]}>
                    Valor
                  </Text>
                </View>
                {data.services.map((service, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tableRow,
                      index % 2 === 1 ? styles.tableRowEven : {},
                    ]}
                  >
                    <Text style={[styles.cellText, styles.col1]}>
                      {String(service.name)}
                    </Text>
                    <Text style={[styles.cellTextBold, styles.col2]}>
                      {formatCurrency(service.total)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Produtos Ocultado se Vazio */}
          {data.products && data.products.length > 0 && (
            <View style={{ marginTop: 15 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Produtos Adicionais</Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.table}>
                {data.products.map((product, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tableRow,
                      index % 2 === 0 ? styles.tableRowEven : {},
                    ]}
                  >
                    <Text style={[styles.cellText, styles.col1]}>
                      {String(product.name)}
                    </Text>
                    <Text style={[styles.cellTextBold, styles.col2]}>
                      {product.quantity} un.
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Bloco de Totais Subtotais e Descontos */}
          <View style={styles.totalsContainer}>
            {data.discountValue && data.discountValue > 0 ? (
              <>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Subtotal</Text>
                  <Text style={styles.totalsValue}>
                    {formatCurrency(data.subtotal || data.total)}
                  </Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Desconto</Text>
                  <Text style={[styles.totalsValue, { color: primaryColor }]}>
                    -{" "}
                    {data.discountType === "PERCENTAGE"
                      ? `${data.discountValue}% (${formatCurrency((data.subtotal || data.total) * (data.discountValue / 100))})`
                      : formatCurrency(data.discountValue)}
                  </Text>
                </View>
              </>
            ) : null}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabelFinal}>Valor Total</Text>
              <Text style={styles.totalValueFinal}>
                {formatCurrency(data.total)}
              </Text>
            </View>
          </View>

          {/* Pagamentos Efetuados Ocultado se Vazio */}
          {data.payments && data.payments.length > 0 && (
            <View style={{ marginTop: 25 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Histórico de Pagamentos</Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { width: "40%" }]}>
                    Método
                  </Text>
                  <Text
                    style={[
                      styles.tableHeaderText,
                      { width: "30%", textAlign: "center" },
                    ]}
                  >
                    Data
                  </Text>
                  <Text
                    style={[
                      styles.tableHeaderText,
                      { width: "30%", textAlign: "right" },
                    ]}
                  >
                    Valor Pago
                  </Text>
                </View>
                {data.payments.map((pay: any, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.tableRow,
                      index % 2 === 1 ? styles.tableRowEven : {},
                    ]}
                  >
                    <Text style={[styles.cellText, { width: "40%" }]}>
                      {paymentMethodLabels[pay.method] || pay.method}
                    </Text>
                    <Text
                      style={[
                        styles.cellText,
                        { width: "30%", textAlign: "center" },
                      ]}
                    >
                      {new Date(pay.paidAt).toLocaleDateString("pt-BR")}
                    </Text>
                    <Text
                      style={[
                        styles.cellTextBold,
                        { width: "30%", textAlign: "right", color: "#10B981" },
                      ]}
                    >
                      {formatCurrency(pay.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Avarias Principais (Entrada) - Só mostra se tiver Vistoria com avaria de Entrada */}
          {avarias.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Resumo de Avarias (Entrada)
                </Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.damageGrid}>
                {avarias.map((item: any) => (
                  <View key={item.id} style={styles.damageCard}>
                    <Text style={styles.damageTitle}>{String(item.label)}</Text>
                    <Text style={styles.damageDesc}>
                      {item.damageType
                        ? damageTypeLabels[item.damageType] || item.damageType
                        : "-"}
                      {item.severity
                        ? ` • ${severityLabels[item.severity] || item.severity}`
                        : ""}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Assinatura Ocultada se não houver Nenhuma */}
          {(saidaInspection?.signatureUrl ||
            entradaInspection?.signatureUrl) && (
            <View style={styles.signatureSection}>
              <View style={styles.signatureContainer}>
                {entradaInspection?.signatureUrl && (
                  <View style={styles.signatureBlock}>
                    <Image
                      src={entradaInspection.signatureUrl}
                      style={styles.signatureImage}
                    />
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>
                      Assinatura de Entrada
                    </Text>
                    <Text style={styles.signatureDate}>
                      {entradaInspection.signedAt
                        ? new Date(
                            entradaInspection.signedAt,
                          ).toLocaleDateString("pt-BR")
                        : ""}
                    </Text>
                  </View>
                )}

                {saidaInspection?.signatureUrl && (
                  <View style={styles.signatureBlock}>
                    <Image
                      src={saidaInspection.signatureUrl}
                      style={styles.signatureImage}
                    />
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>
                      Assinatura de Entrega
                    </Text>
                    <Text style={styles.signatureDate}>
                      {saidaInspection.signedAt
                        ? new Date(saidaInspection.signedAt).toLocaleDateString(
                            "pt-BR",
                          )
                        : ""}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerBrandContainer}>
            {iconBase64 && <Image src={iconBase64} style={styles.footerIcon} />}
          </View>
          <Text style={styles.footerInfo}>
            Relatório gerado em {new Date().toLocaleDateString("pt-BR")} às{" "}
            {new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </Page>

      {/* Páginas de Imagens das Vistorias (Só gera as páginas das vistorias que tiverem fotos) */}
      {completedInspections.map(({ type, inspection }) => {
        const images = getInspectionImages(inspection);
        if (images.length === 0) return null;

        return (
          <Page key={type} size="A4" style={styles.inspectionPage}>
            <View style={styles.inspectionPageHeader}>
              <View>
                <Text style={styles.inspectionPageTitle}>
                  {inspectionTypeLabels[type] || type}
                </Text>
                <Text style={styles.inspectionPageSubtitle}>
                  Galeria de Fotos • {images.length} registro
                  {images.length !== 1 ? "s" : ""}
                </Text>
              </View>
              <Text style={{ fontSize: 9, color: "#94A3B8" }}>
                Concluída em:{" "}
                {inspection?.createdAt
                  ? new Date(inspection.createdAt).toLocaleDateString("pt-BR")
                  : ""}
              </Text>
            </View>

            <View style={styles.imageGrid}>
              {images.map((img, idx) => (
                <View key={idx} style={styles.imageCard}>
                  <Image src={img.url} style={styles.inspectionImage} />
                  <Text style={styles.imageCaption}>{img.label}</Text>

                  <Text
                    style={[
                      styles.imageStatusBadge,
                      img.status === "ok"
                        ? styles.imageStatusOk
                        : styles.imageStatusWarning,
                    ]}
                  >
                    {img.status === "ok" ? "OK SEM AVARIA" : "COM AVARIA"}
                  </Text>

                  {img.status === "com_avaria" && (
                    <Text style={styles.imageSubcaption}>{img.damageInfo}</Text>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.footer}>
              <View style={styles.footerBrandContainer}>
                {iconBase64 && (
                  <Image src={iconBase64} style={styles.footerIcon} />
                )}
              </View>
              <Text style={styles.footerInfo}>
                {inspectionTypeLabels[type]} • Anexo Fotográfico
              </Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};
