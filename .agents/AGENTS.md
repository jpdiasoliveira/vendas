---
description: Práticas proibidas — tolerância zero (JS Publicidade). Correções estruturais definitivas e arquitetura robusta.
alwaysApply: true
---

# Práticas Proibidas — Tolerância Zero (JS Publicidade)

**Diretiva de Sistema:** Este projeto prioriza correções estruturais definitivas e arquitetura robusta. Código que violar estes pontos será rejeitado. Não utilize atalhos para pular validações ou mascarar erros.

## 1. Tipagem Estrita e Validação de Dados (Zero Tipagem Dinâmica)

- Proibido o uso de tipagem genérica ou de escape (ex: `any` em TypeScript, ou interfaces vazias `interface{}` em Go para burlar regras).
- Dados externos (payloads de API, webhooks, retornos de banco) devem passar por validação explícita ou Type Guards antes de terem seus campos acessados.
- O sistema nunca deve confiar cegamente no formato do dado recebido.

## 2. Tratamento de Erros Explícito (Proibido Engolir Erros)

- Proibido blocos de captura de erro vazios ou que apenas imprimem no terminal (`console.log` / `fmt.Println` / ignorar exceptions).
- Falhas de infraestrutura ou regra de negócio devem ser propagadas.
- **Frontend:** o usuário (Anunciante ou Parceiro) deve ver um alerta claro.
- **Backend:** o log estruturado deve registrar o erro e a API deve devolver o status code correspondente (ex: `400` para regra violada, `500` para falha interna).

## 3. Fim do N+1 (Consultas em Loop)

- Proibido realizar queries de banco de dados, chamadas de rede (HTTP) ou acessos a disco dentro de laços de repetição (`for`, `map`, `while`).
- Sempre utilize operações em lote (Batch), filtros agrupados (`IN (...)`), ou agregações do próprio banco de dados (JOINs) para buscar dados relacionados de uma só vez.

## 4. Zero Hardcode (Variáveis e Estilos)

- **Regra de Ambiente:** Chaves de API, URLs, portas e credenciais nunca devem estar no código-fonte. Devem ser injetadas via variáveis de ambiente.
- **Regra Visual:** Proibido o uso de cores ou valores de espaçamento absolutos diretamente no código. A interface deve consumir os tokens de design globais do projeto.

## 5. Gestão de Estado e Ciclo de Vida

- O controle de efeitos colaterais e ciclo de vida das telas ou do Player da TV deve ser determinístico.
- Dependências de funções reativas (ex: arrays de dependências) devem estar completas. Omitir dependências para forçar atualizações visuais é estritamente proibido.

## 6. Separação de Responsabilidades (UI vs Lógica)

- Proibido misturar lógica complexa de negócios (ex: cálculo de tempo de tela, validação de categorias) e chamadas de API no mesmo arquivo responsável pela interface visual.
- A camada visual deve ser "burra", ocupando-se apenas de exibir dados e capturar cliques. Toda a lógica de roteamento de dados deve ficar em Controllers, Services ou Hooks dedicados.

## 7. Anti-Giant Components e Impacto Sistêmico

- **Análise Prévia Obrigatória:** Antes de alterar lógicas centrais (como o motor de reprodução do Player), rastreie todas as dependências impactadas (rotas, permissões, relatórios).
- **Arquivos Modulares:** Arquivos com múltiplas responsabilidades ou excesso de linhas (ex: acima de 200 linhas) devem ser proativamente quebrados em módulos menores durante o desenvolvimento, sem aguardar solicitação de refatoração.
