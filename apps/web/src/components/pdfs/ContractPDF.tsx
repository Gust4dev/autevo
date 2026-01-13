"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Register a font found in standard usage if needed, or use Helvetica by default
// Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf' });

interface ContractData {
  customer: {
    name: string;
    document?: string | null; // CPF
    phone?: string | null;
    address?: string | null;
    rg?: string | null;
  };
  vehicle: {
    brand: string;
    model: string;
    plate: string;
    color?: string;
  };
  order: {
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    total: number;
    items: {
      name: string;
      price: number;
    }[];
  };
  tenant: {
    name: string;
    logo?: string | null;
    document?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

interface ContractPDFProps {
  data: ContractData;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11, // Increased font size
    lineHeight: 1.5,
    color: "#000000",
  },
  title: {
    fontSize: 16, // Increased title size
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
    textTransform: "uppercase",
  },
  headerSection: {
    marginBottom: 25,
    textAlign: "center",
  },
  headerText: {
    fontSize: 10,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: "#f3f4f6", // Lighter gray
    padding: 5,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 12, // Increased spacing between rows
    alignItems: "flex-end", // Align to bottom for better baseline/underline alignment
  },
  fieldLabel: {
    fontWeight: "bold",
    marginRight: 8,
    minWidth: 40, // Ensure alignment
  },
  fieldValue: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
    minHeight: 16, // Minimum height for handwriting
  },
  // New style for rows with multiple inline fields
  multiFieldRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end", // Align to bottom
    justifyContent: "flex-start",
  },
  fieldGroup: {
    flexDirection: "row",
    alignItems: "flex-end", // Align to bottom
    marginRight: 20, // Space between groups
  },
  fieldValueInline: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
    minWidth: 120, // Increased minimum width significantly
    textAlign: "center",
  },
  clause: {
    marginBottom: 10,
    textAlign: "justify",
  },
  clauseTitle: {
    fontWeight: "bold",
    marginBottom: 4,
    fontSize: 11,
  },
  signatureSection: {
    marginTop: 50, // More space before signatures
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBlock: {
    width: "45%",
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginBottom: 8,
  },
  signatureDate: {
    marginTop: 5,
  },
});

const formatDate = (date?: Date | string | null) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-BR");
};

const formatTime = (date?: Date | string | null) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const ContractPDF = ({ data }: ContractPDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</Text>
          <Text
            style={{
              ...styles.headerText,
              fontWeight: "bold",
              fontSize: 13,
              color: "#0F172A",
            }}
          >
            {data.tenant.name.toUpperCase()}
          </Text>
          <Text style={styles.headerText}>
            CNPJ: {data.tenant.document || ""}
          </Text>
          <Text style={styles.headerText}>{data.tenant.address || ""}</Text>
          <Text style={styles.headerText}>
            {data.tenant.phone || ""}{" "}
            {data.tenant.email ? `• ${data.tenant.email}` : ""}
          </Text>
        </View>

        {/* Dados do Contratante */}
        <Text style={styles.sectionTitle}>Dados do Contratante:</Text>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Nome:</Text>
          <Text style={styles.fieldValue}>{data.customer.name}</Text>
        </View>

        <View style={styles.multiFieldRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>CPF:</Text>
            <Text style={[styles.fieldValueInline, { flex: 1 }]}>
              {data.customer.document || ""}
            </Text>
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>RG:</Text>
            <Text style={[styles.fieldValueInline, { flex: 1 }]}>
              {data.customer.rg || ""}
            </Text>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Endereço:</Text>
          <Text style={styles.fieldValue}>{data.customer.address || ""}</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Telefone:</Text>
          <Text style={[styles.fieldValueInline, { minWidth: 200 }]}>
            {data.customer.phone || ""}
          </Text>
        </View>

        {/* Dados do Veículo */}
        <Text style={styles.sectionTitle}>Dados do Veículo:</Text>

        <View style={styles.fieldRow}>
          <Text style={[styles.fieldLabel, { minWidth: 90 }]}>
            Marca/Modelo:
          </Text>
          <Text style={styles.fieldValue}>
            {data.vehicle.brand} / {data.vehicle.model}
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Placa:</Text>
          <Text style={[styles.fieldValueInline, { minWidth: 150 }]}>
            {data.vehicle.plate}
          </Text>
        </View>

        <View style={styles.multiFieldRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Data entrada:</Text>
            <Text style={[styles.fieldValueInline, { flex: 1 }]}>
              {formatDate(data.order.startedAt)}
            </Text>
          </View>
          <View style={[styles.fieldGroup, { flex: 0.8 }]}>
            <Text style={styles.fieldLabel}>Hora:</Text>
            <Text style={[styles.fieldValueInline, { flex: 1 }]}>
              {formatTime(data.order.startedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Quilometragem de entrada:</Text>
          <Text style={[styles.fieldValueInline, { width: 100 }]}></Text>
          <Text style={[styles.fieldLabel, { marginLeft: 5, minWidth: 0 }]}>
            km
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Data de saída prevista:</Text>
          <Text style={[styles.fieldValueInline, { width: 150 }]}></Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Quilometragem de saída:</Text>
          <Text style={[styles.fieldValueInline, { width: 100 }]}></Text>
          <Text style={[styles.fieldLabel, { marginLeft: 5, minWidth: 0 }]}>
            km
          </Text>
        </View>

        {/* Cláusulas */}
        <Text style={styles.sectionTitle}>Cláusulas Contratuais:</Text>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>CLÁUSULA 1 – DO OBJETO</Text>
          <Text>
            O presente contrato tem por objeto a prestação de serviços
            automotivos de estética, proteção e personalização do veículo
            descrito acima, conforme orçamento previamente aprovado pelo
            contratante.
          </Text>
        </View>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>CLÁUSULA 2 – DO CHECKLIST</Text>
          <Text>
            A contratada realiza checklist completo do veículo na entrada e na
            saída, registrando o estado do carro em fotos, vídeo e documento
            impresso, com assinatura do cliente. Qualquer dano pré-existente
            será registrado e não será de responsabilidade da contratada.
          </Text>
        </View>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>
            CLÁUSULA 3 – DA RESPONSABILIDADE DA CONTRATADA
          </Text>
          <Text>
            A contratada se compromete a executar os serviços com zelo,
            qualidade e padrão técnico conforme descrito no orçamento. Caso haja
            qualquer necessidade de ajuste ou retrabalho, o cliente se
            compromete a primeiramente entrar em contato com a empresa para
            tentativa de solução direta, sem exposição pública prévia.
          </Text>
        </View>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>
            CLÁUSULA 4 – DO ATENDIMENTO PÓS-SERVIÇO
          </Text>
          <Text>
            Caso o cliente perceba qualquer falha ou problema após a entrega do
            veículo, ele deverá comunicar a contratada no prazo de até 7 (sete)
            dias corridos, agendando horário para análise técnica. Reajustes,
            correções ou substituições de material serão avaliados conforme o
            caso, respeitando os prazos internos, normas da empresa e
            disponibilidade de equipe e materiais.
          </Text>
        </View>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>
            CLÁUSULA 5 – DA IMAGEM DA EMPRESA
          </Text>
          <Text>
            O contratante declara ciência de que a contratada zela por sua
            imagem e reputação, e compromete-se a não expor publicamente
            insatisfações sem antes permitir que a empresa tente resolver o
            problema de forma responsável, ética e profissional.
          </Text>
        </View>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>
            CLÁUSULA 6 – DA REMOÇÃO DO VEÍCULO
          </Text>
          <Text>
            Nem todos os serviços são executados diretamente dentro da sede
            principal da {data.tenant.name.split(" ")[0] && "FILMTECH"}. Em
            casos de necessidade de deslocamento ou realização externa de parte
            do serviço, o veículo somente será removido com autorização formal
            do cliente, e sempre será devolvido em perfeito estado, conforme
            registrado no checklist. A{" "}
            {data.tenant.name.split(" ")[0] && "FILMTECH"} é uma empresa
            comprometida com a solução de problemas — e a partir do momento que
            o veículo é confiado aos nossos cuidados, o compromisso é devolvê-lo
            ao cliente com o padrão de excelência e finalização garantida.
          </Text>
        </View>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>
            CLÁUSULA 7 – SOBRE REPAROS E REPINTURAS
          </Text>
          <Text>
            O contratante compromete-se a informar previamente qualquer parte
            repintada, avariada ou com histórico de batida no veículo. Mesmo com
            o checklist, é essencial que esses detalhes sejam comunicados para
            garantir a qualidade dos serviços e evitar qualquer transtorno ou
            interpretação indevida.
          </Text>
        </View>

        <View style={styles.clause}>
          <Text style={styles.clauseTitle}>
            CLÁUSULA 8 – DAS CONDIÇÕES GERAIS
          </Text>
          <Text>
            Este contrato entra em vigor na data de assinatura, sendo válido
            para o serviço ora prestado. Ambas as partes declaram estar de
            acordo com as cláusulas e cientes de suas responsabilidades.
          </Text>
        </View>

        {/* Assinaturas */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text>Assinatura do Contratante</Text>
            <View style={[styles.fieldRow, { marginTop: 5 }]}>
              <Text>Data: </Text>
              <Text>___/___/______</Text>
            </View>
          </View>

          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text>Assinatura do Responsável – {data.tenant.name}</Text>
            <View style={[styles.fieldRow, { marginTop: 5 }]}>
              <Text>Data: </Text>
              <Text>___/___/______</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
