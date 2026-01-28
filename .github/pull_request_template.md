```md
1. Preparação e Contexto
   Antes de olhar a primeira linha de código, o revisor deve garantir que entende o "porquê" da mudança.

[ ] Entendimento do Negócio: Eu entendo o problema de negócio que esta mudança tenta resolver?

[ ] Alinhamento de Requisitos: Verifiquei se a solução atende a todos os requisitos e critérios de aceite da task?

[ ] Contexto Arquitetural: Entendo como essa mudança se encaixa na arquitetura atual do sistema?

2. Os 5 Pilares Técnicos (Padrão Google)
   O foco principal deve ser a qualidade e a sustentabilidade, não apenas a correção momentânea.

[ ] Design: O design geral é sólido? As interações entre as peças fazem sentido e seguem os princípios SOLID?

[ ] Funcionalidade: O código faz o que se propõe? Considerei cenários de borda (edge cases) e possíveis condições de corrida (race conditions)?

[ ] Complexidade: O código é fácil de entender? Existe algum sinal de over-engineering ou abstrações desnecessárias que podem ser simplificadas?

[ ] Testes: Foram adicionados testes unitários, de integração ou E2E? Os testes são úteis, fáceis de manter e realmente falham se o código for quebrado?

[ ] Nomenclatura: Nomes de variáveis, classes e métodos são descritivos e seguem as convenções do projeto?

3. Segurança e Performance
   Áreas críticas que exigem atenção especial para evitar débitos técnicos custosos.

[ ] Segurança: Existem riscos de injeção (SQL, XSS), exposição de dados sensíveis ou falhas de autenticação/autorização?

[ ] Performance: O código introduz gargalos óbvios, como consultas N+1, vazamentos de memória ou alocações excessivas em loops?

[ ] Escalabilidade: A solução continuará funcionando de forma eficiente sob carga aumentada ou com o crescimento da base de dados?

4. Etiqueta e Comunicação
   A forma como o feedback é entregue define a cultura da equipe.

[ ] Tom Construtivo: Meus comentários focam no código e não na pessoa? Evitei o uso excessivo de "você" para não soar como um ataque pessoal?

[ ] Categorização de Comentários: Diferenciei claramente o que é bloqueante daquilo que é apenas uma sugestão?

BLOCKER: Deve ser corrigido antes do merge.

FAST FOLLOW: Importante, mas pode ser resolvido em um ticket separado.

NIT: Sugestão estética ou preferência pessoal (não bloqueante).

[ ] Feedback Acionável: Em vez de apenas dizer "melhore isto", forneci sugestões claras ou alternativas sobre como o autor pode evoluir a solução?

5. Finalização
   [ ] Revisão Integral: Revisei não apenas o código novo, mas também o impacto nos arquivos existentes para garantir a consistência do sistema?

[ ] ROI do Comentário: Avaliei se o custo de tempo da minha sugestão vale o benefício técnico para o projeto?

[ ] Aprovação: Se todos os pontos críticos foram resolvidos e o código melhora a saúde geral do sistema, o PR está pronto para aprovação.
```
