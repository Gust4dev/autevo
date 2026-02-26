import Link from "next/link";

export const metadata = {
  title: "Termos de Uso | Autevo",
  description:
    "Termos de Uso e Protocolo de Tratamento de Dados da plataforma Autevo — Sistema de gestão para oficinas mecânicas.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-16 px-6">
      <div className="max-w-3xl mx-auto prose dark:prose-invert">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:underline mb-8 block"
        >
          ← Voltar ao início
        </Link>

        <h1>
          Política de Privacidade e Protocolo de Tratamento de Dados —
          Plataforma Autevo
        </h1>
        <p className="text-sm text-muted-foreground">
          Última Atualização: 26 de Fevereiro de 2026
        </p>

        <h2>Preâmbulo</h2>
        <p>
          A AUTEVO TECNOLOGIA LTDA (&quot;AUTEVO&quot;), na qualidade de
          provedora de infraestrutura tecnológica e software de gestão
          automotiva de alta performance, estabelece o presente Protocolo de
          Privacidade para regular, de forma transparente e exaustiva, a
          recolha, o processamento, a custódia e a eliminação de dados pessoais
          e operacionais. Este documento foi estruturado sob os preceitos da Lei
          Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD), do Marco Civil
          da Internet e das melhores práticas de cibersegurança internacionais.
        </p>

        <h2>1. Definições e Estrutura Jurídica</h2>
        <p>
          Para a interpretação fiel deste instrumento, aplicam-se as seguintes
          definições:
        </p>
        <ul>
          <li>
            <strong>1.1. Controlador:</strong> O Contratante (Empresa/Oficina),
            a quem competem as decisões fundamentais sobre o tratamento dos
            dados dos seus Clientes Finais.
          </li>
          <li>
            <strong>1.2. Operador:</strong> A AUTEVO, que realiza o tratamento
            de dados em nome e sob as instruções técnicas do Controlador,
            fornecendo a infraestrutura SaaS.
          </li>
          <li>
            <strong>1.3. Titular de Dados:</strong> A pessoa singular a quem se
            referem os dados pessoais (Clientes do Contratante, Utilizadores do
            sistema).
          </li>
          <li>
            <strong>1.4. Encarregado (DPO):</strong> Pessoa designada para atuar
            como canal de comunicação entre o Controlador, os Titulares e a
            Autoridade Nacional de Proteção de Dados (ANPD).
          </li>
        </ul>

        <h2>2. Âmbito da Recolha e Natureza dos Dados</h2>
        <p>
          A AUTEVO processa quatro categorias distintas de informações para
          garantir a viabilidade operacional do sistema:
        </p>

        <h3>2.1. Dados de Governança de Conta (Acesso)</h3>
        <p>
          Informações necessárias para a autenticação e gestão de permissões:
          Nome completo, CPF, credenciais de e-mail corporativo, identificadores
          de cargo, número de telefone e registos de log-in.
        </p>

        <h3>2.2. Dados de Ativos e Operações (Negócio)</h3>
        <p>Informações inseridas pelo Controlador para a gestão da oficina:</p>
        <ul>
          <li>
            <strong>Identificadores Veiculares:</strong> Matrícula (placa),
            Número de Identificação do Veículo (VIN/Chassis), quilometragem,
            histórico de intervenções técnicas e fotografias de avarias.
          </li>
          <li>
            <strong>Identificadores de Consumo:</strong> Nomes, endereços, CPFs
            e perfis de consumo dos Clientes Finais.
          </li>
          <li>
            <strong>Dados de Inventário:</strong> Descrição de insumos químicos,
            peças, valores de custo e margens de lucro.
          </li>
        </ul>

        <h3>2.3. Metadados de Prova Forense (Blindagem Jurídica)</h3>
        <p>
          Para assegurar a imutabilidade e a validade jurídica de orçamentos e
          vistorias, a plataforma recolhe automaticamente:
        </p>
        <ul>
          <li>
            <strong>Endereço IP (Internet Protocol):</strong> Identificação da
            rede de origem.
          </li>
          <li>
            <strong>Geolocalização (GPS):</strong> Coordenadas latitudinais e
            longitudinais no instante da assinatura digital.
          </li>
          <li>
            <strong>User-Agent:</strong> Identificação detalhada do hardware,
            sistema operativo e browser utilizado.
          </li>
          <li>
            <strong>Hash de Integridade:</strong> Código criptográfico que
            garante que o documento não foi alterado após a submissão.
          </li>
        </ul>

        <h3>2.4. Dados Financeiros e de Transação</h3>
        <p>
          Processamento de subscrições e pagamentos via gateway Stripe, operando
          sob padrões PCI-DSS. A AUTEVO não retém números de cartões de crédito,
          utilizando apenas tokens criptografados.
        </p>

        <h2>3. Bases Legais e Finalidades do Tratamento</h2>
        <p>
          O tratamento de dados pela AUTEVO fundamenta-se estritamente no Artigo
          7º da LGPD:
        </p>
        <ul>
          <li>
            <strong>3.1. Execução de Contrato:</strong> Garantir o funcionamento
            integral dos módulos de Agendamento, Ordem de Serviço, Financeiro e
            Estoque.
          </li>
          <li>
            <strong>3.2. Proteção da Vida e Segurança:</strong> Garantir a
            rastreabilidade técnica de serviços realizados em veículos que podem
            impactar a segurança viária.
          </li>
          <li>
            <strong>3.3. Exercício Regular de Direitos:</strong> Constituição de
            provas documentais imutáveis para defesa do Contratante em processos
            judiciais ou administrativos.
          </li>
          <li>
            <strong>3.4. Legítimo Interesse:</strong> Melhoria da estabilidade
            do software e segurança da infraestrutura contra ataques de força
            bruta ou intrusão.
          </li>
        </ul>

        <h2>
          4. Arquitetura de Segurança e Isolamento de Dados (Multi-Tenancy)
        </h2>
        <p>
          A AUTEVO emprega mecanismos de isolamento de dados de nível
          empresarial:
        </p>
        <ul>
          <li>
            <strong>4.1. Isolamento de AST (Abstract Syntax Tree):</strong>{" "}
            Implementamos filtros dinâmicos na camada do ORM (Prisma),
            garantindo que as queries de um Tenant jamais acedam a registos de
            outro, mesmo em cenários de falha de aplicação.
          </li>
          <li>
            <strong>4.2. Criptografia em Repouso e Trânsito:</strong> Todos os
            dados são protegidos por algoritmos AES-256 e protocolos TLS 1.3.
          </li>
          <li>
            <strong>4.3. Custódia de Imagens:</strong> Fotografias de vistorias
            são armazenadas em object storage de alta durabilidade com políticas
            de expiração de acesso para links públicos de rastreio.
          </li>
          <li>
            <strong>4.4. Imutabilidade S3:</strong> PDFs de vistorias
            finalizadas são gravados em buckets de leitura exclusiva, impedindo
            qualquer modificação retroativa por parte de técnicos ou gestores.
          </li>
        </ul>

        <h2>5. Partilha Controlada com Terceiros</h2>
        <p>
          A AUTEVO proíbe expressamente a comercialização de dados. A partilha é
          restrita a parceiros de infraestrutura crítica (Sub-processadores):
        </p>
        <ul>
          <li>
            <strong>Infraestrutura Cloud:</strong> Vercel (Frontend),
            Neon/Supabase (Database), AWS S3 (Storage).
          </li>
          <li>
            <strong>Comunicação Transacional:</strong> Meta (WhatsApp Business
            API) e serviços de notificação Push.
          </li>
          <li>
            <strong>Pagamentos:</strong> Stripe Brasil e Stripe Internacional.
          </li>
          <li>
            <strong>Autenticação:</strong> Clerk Inc. (Gestão de Identidade).
          </li>
        </ul>

        <h2>6. Direitos dos Titulares e Canais de Exercício</h2>
        <p>
          Em conformidade com o Artigo 18 da LGPD, o Titular de Dados poderá,
          através do Controlador (Contratante):
        </p>
        <ul>
          <li>
            <strong>6.1.</strong> Requerer a confirmação da existência de
            tratamento.
          </li>
          <li>
            <strong>6.2.</strong> Aceder aos dados em formato simplificado ou
            completo.
          </li>
          <li>
            <strong>6.3.</strong> Solicitar a correção de dados incompletos ou
            inexatos.
          </li>
          <li>
            <strong>6.4.</strong> Opor-se ao tratamento de dados não essenciais
            à execução do serviço.
          </li>
          <li>
            <strong>6.5.</strong> Solicitar a portabilidade dos dados
            operacionais através de ferramentas de exportação nativas da
            plataforma.
          </li>
        </ul>

        <h2>7. Protocolo de Retenção e Eliminação Definitiva</h2>
        <ul>
          <li>
            <strong>7.1. Período de Atividade:</strong> Os dados permanecem sob
            custódia enquanto houver uma subscrição vigente e adimplente.
          </li>
          <li>
            <strong>7.2. Período de Portabilidade:</strong> Após a rescisão
            contratual, a AUTEVO manterá os dados por 90 (noventa) dias para
            permitir a exportação pelo Contratante.
          </li>
          <li>
            <strong>7.3. Expurgo Hard-Delete:</strong> Transcorrido o prazo de
            90 dias, a AUTEVO procederá à eliminação técnica e física de todos
            os registos das bases de produção, impossibilitando a sua
            recuperação.
          </li>
          <li>
            <strong>7.4. Exceções Legais:</strong> A AUTEVO poderá reter dados
            para cumprimento de obrigações fiscais, judiciais ou regulatórias
            pelo prazo estipulado na legislação específica.
          </li>
        </ul>

        <h2>8. Transferência Internacional e Cookies</h2>
        <ul>
          <li>
            <strong>8.1.</strong> Os dados podem ser processados em
            infraestruturas globais situadas nos EUA ou Europa, sempre sob
            cláusulas contratuais padrão de proteção de dados.
          </li>
          <li>
            <strong>8.2.</strong> O sistema utiliza apenas cookies Estritamente
            Necessários para manter a sessão e garantir a segurança contra
            falsificação de requisições transversais (CSRF).
          </li>
        </ul>

        <h2>9. Gestão de Incidentes e Alterações</h2>
        <ul>
          <li>
            <strong>9.1.</strong> A AUTEVO mantém um plano de resposta a
            incidentes que inclui a notificação obrigatória ao Contratante em
            caso de violação de dados que possa representar risco elevado.
          </li>
          <li>
            <strong>9.2.</strong> Esta Política é revista anualmente. Alterações
            que impactem a natureza do tratamento serão comunicadas com destaque
            no dashboard administrativo.
          </li>
        </ul>

        <p className="mt-8 pt-6 border-t text-sm text-muted-foreground italic">
          Ao utilizar a Plataforma AUTEVO, o Contratante e os seus Utilizadores
          manifestam concordância livre, informada e inequívoca com este
          Protocolo de Privacidade.
        </p>
      </div>
    </div>
  );
}
