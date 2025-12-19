/* eslint-disable jsx-a11y/alt-text */
'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { AppRouter } from '@/server/routers/_app';
import type { inferRouterOutputs } from '@trpc/server';

// Type for the public status
type RouterOutputs = inferRouterOutputs<AppRouter>;
type PublicStatus = RouterOutputs['order']['getPublicStatus'] & {
  vehiclePlate?: string | null;
};

interface InspectionPDFProps {
  data: PublicStatus;
  qrCodeUrl: string;
  trackingUrl: string;
}

export const InspectionPDF = ({ data, qrCodeUrl, trackingUrl }: InspectionPDFProps) => {
  const primaryColor = data.tenantContact.primaryColor || '#DC2626';
  const secondaryColor = data.tenantContact.secondaryColor || '#1F2937';
  
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: 40,
      fontFamily: 'Helvetica',
    },
    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 30,
      paddingBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: primaryColor,
    },
    headerLeft: {
      flex: 1,
      justifyContent: 'center',
    },
    logo: {
      width: 200,
      height: 80,
      objectFit: 'contain',
    },
    companyName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: secondaryColor,
    },
    companySubtitle: {
      fontSize: 10,
      color: '#888',
      marginTop: 4,
    },
    // QR Section (Header Right)
    headerRight: {
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    qrImage: {
      width: 70,
      height: 70,
    },
    qrLabel: {
      fontSize: 9,
      fontWeight: 'bold',
      color: primaryColor,
      marginTop: 6,
      textAlign: 'right',
    },
    qrUrl: {
      fontSize: 7,
      color: '#666',
      marginTop: 2,
      textAlign: 'right',
    },
    // Section
    section: {
      marginTop: 25,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: primaryColor,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    // Info Grid
    infoRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: '#E5E7EB',
    },
    infoLabel: {
      width: '30%',
      fontSize: 10,
      color: '#666',
    },
    infoValue: {
      width: '70%',
      fontSize: 10,
      color: '#111827',
    },
    // Table
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: primaryColor,
    },
    tableHeaderText: {
      fontSize: 9,
      color: '#374151',
      textTransform: 'uppercase',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: '#E5E7EB',
    },
    colService: { width: '70%' },
    colPrice: { width: '30%', textAlign: 'right' },
    textNormal: { fontSize: 10, color: '#333' },
    textBold: { fontSize: 10, color: '#111827' },
    // Total
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 15,
      paddingTop: 12,
      paddingBottom: 12,
      borderTopWidth: 2,
      borderTopColor: primaryColor,
    },
    totalLabel: {
      fontSize: 12,
      color: '#111827',
    },
    totalValue: {
      fontSize: 14,
      color: '#111827',
    },
    // Damages table - 3 columns now
    damageCol1: { width: '40%' },
    damageCol2: { width: '30%' },
    damageCol3: { width: '30%' },
    // Footer
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    footerLeft: {},
    footerBrand: {
      fontSize: 10,
      color: primaryColor,
      fontWeight: 'bold',
    },
    footerSubtitle: {
      fontSize: 8,
      color: '#888',
      marginTop: 2,
    },
    footerRight: {
      alignItems: 'flex-end',
    },
    footerDate: {
      fontSize: 9,
      color: '#666',
    },
    footerAuto: {
      fontSize: 7,
      color: '#999',
      marginTop: 2,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {data.tenantContact.logo ? (
              <Image 
                src={
                  data.tenantContact.logo.startsWith('/') 
                    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${data.tenantContact.logo}`
                    : data.tenantContact.logo
                } 
                style={styles.logo} 
              />
            ) : (
              <View>
                <Text style={styles.companyName}>{data.tenantContact.name || 'Empresa'}</Text>
                <Text style={styles.companySubtitle}>Proteção Automotiva</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            <Image src={qrCodeUrl} style={styles.qrImage} />
            <Text style={styles.qrLabel}>Acompanhe em tempo real</Text>
            <Text style={styles.qrUrl}>{trackingUrl}</Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Veículo</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValue}>{String(data.customerName || 'N/A')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Veículo</Text>
            <Text style={styles.infoValue}>{String(data.vehicleName || 'N/A')}</Text>
          </View>
          {data.vehiclePlate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Placa</Text>
              <Text style={styles.infoValue}>{String(data.vehiclePlate)}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cor</Text>
            <Text style={styles.infoValue}>{String(data.vehicleColor || 'N/A')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{String(data.status || 'N/A')}</Text>
          </View>
        </View>

        {/* Damages */}
        {(() => {
          const entradaInspection = data.inspections?.find(i => i.type === 'entrada');
          const avarias = entradaInspection?.items?.filter(item => item.status === 'com_avaria') || [];
          
          if (avarias.length === 0) return null;

          // Labels for display
          const damageTypeLabels: Record<string, string> = {
            arranhao: 'Arranhão',
            amassado: 'Amassado',
            trinca: 'Trinca',
            mancha: 'Mancha',
            risco: 'Risco',
            pintura: 'Pintura',
            outro: 'Outro',
          };
          const severityLabels: Record<string, string> = {
            leve: 'Leve',
            moderado: 'Moderado',
            grave: 'Grave',
          };

          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vistoria de Entrada</Text>
              <Text style={{ fontSize: 8, color: '#888', marginBottom: 10 }}>
                (Fotos e detalhes completos no QR Code)
              </Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.damageCol1]}>Local</Text>
                <Text style={[styles.tableHeaderText, styles.damageCol2]}>Tipo</Text>
                <Text style={[styles.tableHeaderText, styles.damageCol3]}>Gravidade</Text>
              </View>
              {avarias.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.textNormal, styles.damageCol1]}>{String(item.label)}</Text>
                  <Text style={[styles.textNormal, styles.damageCol2]}>
                    {item.damageType ? damageTypeLabels[item.damageType] || item.damageType : '-'}
                  </Text>
                  <Text style={[styles.textNormal, styles.damageCol3]}>
                    {item.severity ? severityLabels[item.severity] || item.severity : '-'}
                  </Text>
                </View>
              ))}
            </View>
          );
        })()}

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços Contratados</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colService]}>Serviço</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Valor</Text>
          </View>
          {data.services.map((service, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={{ width: '70%', fontSize: 10, color: '#333' }}>{String(service.name)}</Text>
              <Text style={{ width: '30%', fontSize: 10, color: '#333', textAlign: 'right' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.total)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total)}
            </Text>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerBrand}>FilmTech OS</Text>
            <Text style={styles.footerSubtitle}>Relatório de Vistoria Digital</Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.footerDate}>{new Date().toLocaleDateString('pt-BR')}</Text>
            <Text style={styles.footerAuto}>Gerado automaticamente</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};
