1. Preparação e contexto de negócio

- [ ] Entendimento do Negócio: Eu entendo o problema de negócio que esta mudança tenta resolver
- [ ] Critérios de aceitação: A solução atende a todos os critérios de aceitação da issue
- [ ] Contexto Arquitetural: Entendo como essa mudança se encaixa na arquitetura atual do sistema?

2. Código

- [ ] Design: O design geral é sólido? As interações entre as peças fazem sentido e seguem os princípios SOLID?
- [ ] Funcionalidade O código faz o que se propõe? Há algum `edge case` que não foi tratado? É possível ocorrer alguma `race conditions`?
- [ ] Complexidade: O código é fácil de ler e entender? Existe alguma complexidade desnecessária ou abstrações desnecessárias que podem ser simplificadas?
- [ ] Testes: O código está testado, com testes unitários, de integração ou E2E? Os testes são úteis, fáceis de manter e realmente falham se o código for quebrado?
- [ ] Nomenclatura: Nomes de variáveis, classes e métodos são descritivos e seguem as convenções do projeto?

3. Segurança e Performance

- [ ] Segurança: Existem riscos de injeção (SQL, XSS), exposição de dados sensíveis ou o código deveria estar protegido por alguma `claims`?
- [ ] Performance: O código introduz gargalos óbvios, como consultas N+1, chamadas de banco dentro de Promise.all, vazamentos de memória ou alocações excessivas em loops?
- [ ] Escalabilidade: A solução continuará funcionando de forma eficiente com o aumento de carga ou dos dados? Se não for escalável já tem uma `issue` criada no backlog?

BLOCKER: Deve ser corrigido antes do merge.
FAST FOLLOW: Importante, mas pode ser resolvido em uma issue separada.
NIT: Sugestão estética ou preferência pessoal (não bloqueante).
