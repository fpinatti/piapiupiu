# Quickstart: Simplificação da Interface sem "Testar Cartas" e "Filtros" (`003-simplify-scanner-controls`)

## 1. Validar Tipagem e Testes Automatizados

```bash
npm run typecheck
npm test
```

## 2. Validar na Interface (`npm start`)

1. **Aba Scanner de Cartas**:
   - Verifique que o topo da tela **não** exibe os botões `"Filtros"` nem `"Testar Cartas"`.
   - Verifique que a parte inferior da tela **não** exibe a caixa `"Testar cartas sem câmera"`.
   - Utilize os seletores de zoom (`1x`, `1.5x (Ideal)`, `2x`, `Macro`) e o botão `"Fotografar e Ler Carta"` normalmente.
2. **Aba Catálogo (597)**:
   - Verifique que a barra de filtros de expansões/idiomas foi removida e que a barra de busca aparece diretamente no topo com todas as **597 aves** ativas.

