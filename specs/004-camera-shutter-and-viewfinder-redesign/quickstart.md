# Quickstart: Validação do Redesenho do Disparador e Mira (`004-camera-shutter-and-viewfinder-redesign`)

## 1. Verificação Estática e Testes

```bash
npm run typecheck
npm test
```

## 2. Verificação Visual no Scanner (`npm start`)

1. **Visor e Mira**:
   - Abra a aba **Scanner de Cartas**.
   - Observe que a etiqueta `"Posicione o topo da carta aqui"` fica **acima** da caixa pontilhada.
   - Observe que o interior da caixa pontilhada está desobstruído e possui uma marca d'água translúcida com ícone de pena para guiar o alinhamento do topo da carta.
   - Confirme que o texto `"Alinhe o nome da ave em CAIXA ALTA dentro da mira"` e a pílula `"Lido: ..."` foram removidos.
2. **Botão Disparador**:
   - Verifique que o botão de fotografar foi movido para a **parte inferior da tela** em formato circular com apenas o ícone de câmera.
   - Toque no botão circular para fotografar uma carta de ave e confirme a animação suave de análise e a exibição do card de reprodução.

