/* eslint-disable jsx-a11y/alt-text */
'use client';

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { AppRouter } from '@/server/routers/_app';
import type { inferRouterOutputs } from '@trpc/server';

// Register fonts if needed, skipping for now to use standard fonts

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  title: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  label: {
    fontSize: 10,
    color: '#666',
  },
  value: {
    fontSize: 10,
    color: '#000',
    fontWeight: 'normal',
  },
  qrSection: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
  },
  qrTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  qrDescription: {
    fontSize: 10,
    color: '#666',
    lineHeight: 1.4,
  },
  qrImage: {
    width: 80,
    height: 80,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  col1: { width: '40%' },
  col2: { width: '30%' },
  col3: { width: '30%' },
  textSm: { fontSize: 9, color: '#374151' },
});

// Type for the public status
type RouterOutputs = inferRouterOutputs<AppRouter>;
type PublicStatus = RouterOutputs['inspection']['getPublicStatus'];

interface InspectionPDFProps {
  data: PublicStatus;
  qrCodeUrl: string;
}

export const InspectionPDF = ({ data, qrCodeUrl }: InspectionPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>FilmTech OS</Text>
          <Text style={styles.subtitle}>Relatório de Vistoria Digital</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.value}>{new Date().toLocaleDateString('pt-BR')}</Text>
          <Text style={styles.subtitle}>Gerado automaticamente</Text>
        </View>
      </View>

      {/* Customer & Vehicle Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do Veículo</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Cliente</Text>
          <Text style={styles.value}>{data.customerName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Veículo</Text>
          <Text style={styles.value}>{data.vehicleName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cor</Text>
          <Text style={styles.value}>{data.vehicleColor}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status Atual</Text>
          <Text style={styles.value}>{data.status}</Text>
        </View>
      </View>

      {/* QR Code Call to Action */}
      <View style={styles.qrSection}>
        <View style={styles.qrTextContainer}>
          <Text style={styles.qrTitle}>Acompanhe em Tempo Real</Text>
          <Text style={styles.qrDescription}>
            Escaneie este código para ver as fotos da vistoria e acompanhar o status do serviço.
          </Text>
        </View>
        <Image src={qrCodeUrl} style={styles.qrImage} />
      </View>

      {/* Avarias da Vistoria de Entrada - só aparece se tiver avarias */}
      {(() => {
        const entradaInspection = data.inspections?.find(i => i.type === 'entrada');
        const avarias = entradaInspection?.items?.filter(item => item.status === 'com_avaria') || [];
        const damages = entradaInspection?.damages || [];
        
        // Se não houver avarias, não mostra nada
        if (avarias.length === 0 && damages.length === 0) {
          return null;
        }

        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avarias Identificadas na Entrada</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.textSm, styles.col1, { fontWeight: 'bold' }]}>Local</Text>
              <Text style={[styles.textSm, { width: '60%', fontWeight: 'bold' }]}>Observacao</Text>
            </View>
            
            {avarias.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.textSm, styles.col1]}>{item.label}</Text>
                <Text style={[styles.textSm, { width: '60%' }]}>
                  {item.notes || 'Avaria identificada'}
                </Text>
              </View>
            ))}
            
            {damages.map((damage) => (
              <View key={damage.id} style={styles.tableRow}>
                <Text style={[styles.textSm, styles.col1]}>{damage.position}</Text>
                <Text style={[styles.textSm, { width: '60%' }]}>
                  {damage.notes || damage.damageType}
                </Text>
              </View>
            ))}
          </View>
        );
      })()}

      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Servicos Contratados</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.textSm, { width: '70%', fontWeight: 'bold' }]}>Servico</Text>
          <Text style={[styles.textSm, { width: '30%', fontWeight: 'bold', textAlign: 'right' }]}>Valor</Text>
        </View>
        
        {data.services.map((service, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.textSm, { width: '70%' }]}>{service.name}</Text>
            <Text style={[styles.textSm, { width: '30%', textAlign: 'right' }]}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.total)}
            </Text>
          </View>
        ))}

        <View style={[styles.row, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5 }]}>
          <Text style={[styles.label, { fontSize: 12, fontWeight: 'bold', color: '#000' }]}>TOTAL</Text>
          <Text style={[styles.value, { fontSize: 12, fontWeight: 'bold' }]}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total)}
          </Text>
        </View>
      </View>
      
      {/* Footer */}
      <View style={{ position: 'absolute', bottom: 30, left: 30, right: 30, alignItems: 'center' }}>
        <Text style={{ fontSize: 8, color: '#999' }}>
          FilmTech OS • {data.tenantContact.name} • {data.tenantContact.phone}
        </Text>
      </View>

    </Page>
  </Document>
);
