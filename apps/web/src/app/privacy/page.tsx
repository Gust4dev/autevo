import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade | Autevo",
  description:
    "Política de Privacidade e Tratamento de Dados da plataforma Autevo — Proteção de dados conforme LGPD.",
};

export default function PrivacyPage() {
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
          Política de Privacidade e Tratamento de Dados — Plataforma Autevo
        </h1>
        <p className="text-sm text-muted-foreground">
          Última Atualização: 26 de Fevereiro de 2026
        </p>

        <p>
          A AUTEVO, na qualidade de fornecedora de infraestrutura tecnológica e
          software como serviço (SaaS), reafirma o seu compromisso inabalável
          com a privacidade, a transparência e a segurança cibernética. Esta
          Política de Privacidade descreve de forma exaustiva como recolhemos,
          utilizamos, armazenamos e protegemos as informações da sua Empresa
          (Contratante) e dos seus Clientes Finais.
        </p>

        <h2>1. Definições Prévias</h2>
        <p>
          Para garantir a clareza deste documento, adotamos as seguintes
          definições:
        </p>
        <ul>
          <li>
            <strong>Contratante:</strong> A pessoa jurídica ou profissional que
            assina a Plataforma Autevo para gerir a sua oficina.
          </li>
          <li>
            <strong>Utilizador:</strong> Colaboradores (técnicos, gerentes)
            autorizados pelo Contratante.
          </li>
          <li>
            <strong>Titular de Dados:</strong> Qualquer pessoa singular cujos
            dados sejam inseridos no sistema (incluindo os clientes do
            Contratante).
          </li>
          <li>
            <strong>Controlador:</strong> O Contratante (quem toma as decisões
            sobre os dados dos seus clientes).
          </li>
          <li>
            <strong>Operador:</strong> A Autevo (quem processa os dados seguindo
            as instruções do Contratante).
          </li>
        </ul>

        <h2>2. Âmbito da Recolha de Dados</h2>
        <p>
          A Autevo recolhe dados através de múltiplas camadas de interação,
          divididas por natureza:
        </p>

        <h3>
          2.1. Dados de Identificação e Conta (Contratante e Utilizadores)
        </h3>
        <ul>
          <li>
            <strong>Informações de Perfil:</strong> Nome completo, CPF/CNPJ,
            endereço de e-mail corporativo, número de telefone, cargo e
            credenciais de autenticação.
          </li>
          <li>
            <strong>Informações Organizacionais:</strong> Nome da oficina,
            logótipo, identidade visual e configurações de fluxo de trabalho.
          </li>
        </ul>

        <h3>2.2. Dados Operacionais do Negócio (Inseridos pelo Contratante)</h3>
        <ul>
          <li>
            <strong>Gestão de Clientes:</strong> Nome, contacto, morada e
            histórico de consumo dos clientes da oficina.
          </li>
          <li>
            <strong>Ativos Veiculares:</strong> Matrícula (placa), VIN (chassi),
            marca, modelo, quilometragem e histórico técnico.
          </li>
          <li>
            <strong>Dados Financeiros:</strong> Valores de serviços, orçamentos,
            taxas de comissão, métodos de pagamento e fluxo de caixa.
          </li>
          <li>
            <strong>Inventário:</strong> Dados de stock de insumos, preços de
            custo e movimentações de mercadoria.
          </li>
        </ul>

        <h3>
          2.3. Dados de Conformidade e Metadados Forenses (Diferencial Crítico)
        </h3>
        <p>
          Para garantir a blindagem jurídica das operações, a Autevo recolhe
          automaticamente em cada aprovação de orçamento e vistoria:
        </p>
        <ul>
          <li>
            <strong>Endereço IP Real:</strong> Localização lógica da ligação.
          </li>
          <li>
            <strong>Geolocalização (GPS):</strong> Coordenadas geográficas no
            momento da assinatura (quando autorizado pelo dispositivo).
          </li>
          <li>
            <strong>User-Agent:</strong> Identificação do dispositivo, sistema
            operativo e navegador utilizado.
          </li>
          <li>
            <strong>Timestamps Imutáveis:</strong> Registo preciso do
            milissegundo em que cada ação foi executada.
          </li>
        </ul>

        <h3>2.4. Dados de Pagamento (Nível Bancário)</h3>
        <p>
          O processamento de pagamentos é realizado via Stripe. A Autevo não
          armazena dados de cartões de crédito nos seus servidores, utilizando
          tecnologia de tokenização para máxima segurança.
        </p>

        <h2>3. Finalidades do Tratamento</h2>
        <p>
          Os dados são tratados estritamente para as seguintes finalidades,
          baseadas no Artigo 7º da LGPD:
        </p>
        <ul>
          <li>
            <strong>Execução de Contrato:</strong> Prover todas as
            funcionalidades da Plataforma (Agendamento, OS, Vistorias,
            Financeiro).
          </li>
          <li>
            <strong>Segurança e Integridade:</strong> Prevenção de fraudes e
            garantia de que os registos de vistorias e aprovações de orçamentos
            possuam validade jurídica probatória.
          </li>
          <li>
            <strong>Suporte Técnico:</strong> Diagnóstico de incidentes e
            assistência personalizada.
          </li>
          <li>
            <strong>Obrigações Legais:</strong> Emissão de documentos fiscais e
            armazenamento de registos de acesso conforme o Marco Civil da
            Internet.
          </li>
          <li>
            <strong>Análise de Desempenho (Agregada):</strong> Melhoria da
            infraestrutura de software, utilizando dados anonimizados que não
            permitem a identificação de indivíduos.
          </li>
        </ul>

        <h2>4. Arquitetura de Segurança e Isolamento</h2>
        <p>
          A Autevo utiliza uma arquitetura de segurança de &quot;Defesa em
          Profundidade&quot;:
        </p>
        <ul>
          <li>
            <strong>Isolamento Multi-tenant Dinâmico:</strong> Implementamos
            filtros ao nível da AST (Abstract Syntax Tree) do banco de dados,
            garantindo que os dados de um Contratante sejam lógica e fisicamente
            inacessíveis por qualquer outro utilizador da plataforma.
          </li>
          <li>
            <strong>Encriptação Total:</strong> Dados encriptados em repouso
            (AES-256) e em trânsito (TLS 1.3).
          </li>
          <li>
            <strong>Imutabilidade Documental:</strong> Documentos PDF (OS e
            Vistorias) são congelados em armazenamento object storage (S3) com
            políticas de leitura exclusiva após a assinatura, impedindo
            alterações retroactivas.
          </li>
        </ul>

        <h2>5. Partilha com Terceiros (Sub-processadores)</h2>
        <p>
          A Autevo <strong>não comercializa nem cede</strong> dados a terceiros
          para fins publicitários. A partilha ocorre apenas com
          sub-processadores essenciais:
        </p>
        <ul>
          <li>
            <strong>Infraestrutura:</strong> Supabase/Neon/Vercel (Armazenamento
            e Hospedagem).
          </li>
          <li>
            <strong>Comunicação:</strong> API do WhatsApp (Meta) e serviços de
            Push Notification.
          </li>
          <li>
            <strong>Financeiro:</strong> Stripe (Gateway de Pagamento).
          </li>
          <li>
            <strong>Autenticação:</strong> Clerk (Gestão de Identidades e
            Acesso).
          </li>
        </ul>

        <h2>6. Direitos dos Titulares (Art. 18 LGPD)</h2>
        <p>
          O Contratante, na qualidade de Controlador, deve assegurar que os seus
          clientes possam exercer os seus direitos através da plataforma. A
          Autevo fornece as ferramentas necessárias para:
        </p>
        <ul>
          <li>
            <strong>Acesso e Confirmação:</strong> Visualizar quais os dados
            estão armazenados.
          </li>
          <li>
            <strong>Retificação:</strong> Corrigir dados incompletos ou
            inexatos.
          </li>
          <li>
            <strong>Anonimização/Eliminação:</strong> Solicitar a exclusão de
            dados, respeitando prazos de guarda legal (ex: dados fiscais).
          </li>
          <li>
            <strong>Portabilidade:</strong> Exportação de dados operacionais em
            formato estruturado (JSON/CSV).
          </li>
        </ul>

        <h2>7. Retenção e Eliminação de Dados</h2>
        <ul>
          <li>
            <strong>Vigência do Contrato:</strong> Os dados permanecem ativos
            enquanto a subscrição for mantida.
          </li>
          <li>
            <strong>Pós-Cancelamento:</strong> Após a rescisão, a Autevo mantém
            os dados por um período de 90 (noventa) dias para fins exclusivos de
            portabilidade e segurança do Contratante.
          </li>
          <li>
            <strong>Expurgo Permanente:</strong> Após o prazo de 90 dias, os
            dados são eliminados definitivamente dos sistemas de produção
            através de processos de hard delete, excepto registos necessários
            para cumprimento de obrigação legal ou defesa em juízo.
          </li>
        </ul>

        <h2>8. Transferência Internacional de Dados</h2>
        <p>
          Os dados podem ser armazenados em servidores localizados fora do
          território nacional (ex: EUA/UE), utilizando infraestruturas de classe
          mundial que cumprem os requisitos de proteção de dados (Standard
          Contractual Clauses).
        </p>

        <h2>9. Cookies e Tecnologias de Rastreio</h2>
        <p>
          Utilizamos apenas cookies Estritamente Necessários para autenticação e
          segurança. Não utilizamos cookies de terceiros para publicidade
          comportamental dentro da área logada do sistema.
        </p>

        <h2>10. Gestão de Alterações</h2>
        <p>
          Esta política é um documento vivo. Caso ocorram alterações
          significativas na forma como tratamos os dados, o Contratante será
          notificado com 15 dias de antecedência via e-mail ou notificação
          interna na Plataforma.
        </p>

        <h2>11. Contacto (DPO)</h2>
        <p>
          Para questões relacionadas com a privacidade ou para exercer os
          direitos de titular, o Contratante deverá contactar o Encarregado de
          Proteção de Dados (DPO) através do e-mail de suporte oficial da
          Autevo.
        </p>

        <p className="mt-8 pt-6 border-t text-sm text-muted-foreground italic">
          Ao utilizar o Autevo, o Contratante declara estar ciente e de acordo
          com esta Política, assumindo a sua responsabilidade como Controlador
          de Dados perante os seus clientes finais.
        </p>
      </div>
    </div>
  );
}
