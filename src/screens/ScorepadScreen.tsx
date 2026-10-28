import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WatercolorBlobButton } from '../components/WatercolorBlobButton';
import { WatercolorIcon } from '../components/WatercolorIcon';
import {
  colors,
  fonts,
  MIN_TOUCH_TARGET,
  spacing,
  typeScale,
} from '../theme/tokens';
import {
  DEFAULT_SCORE_CATEGORIES,
  PlayerScoreState,
  SCOREPAD_VERSIONS,
  ScoreCategoryDefinition,
  ScorepadState,
  ScorepadVersionId,
} from '../types/scorepad';
import {
  createInitialScorepadState,
  evaluateScorepad,
  getActiveCategories,
  sanitizeScoreInput,
} from '../utils/scoreCalculator';

export interface ScorepadScreenProps {
  scorepadState?: ScorepadState;
  onScorepadStateChange?: (state: ScorepadState) => void;
  onResetScores?: () => void;
}

export function ScorepadScreen({
  scorepadState: externalState,
  onScorepadStateChange,
  onResetScores,
}: ScorepadScreenProps) {
  // Support both controlled state from App.tsx and local state
  const [internalState, setInternalState] = useState<ScorepadState>(
    createInitialScorepadState
  );
  const state = externalState ?? internalState;

  const updateState = useCallback(
    (updater: (prev: ScorepadState) => ScorepadState) => {
      if (onScorepadStateChange) {
        onScorepadStateChange(updater(state));
      } else {
        setInternalState(updater);
      }
    },
    [state, onScorepadStateChange]
  );

  // Active categories for selected edition
  const activeCategories = useMemo(
    () => getActiveCategories(state.version, DEFAULT_SCORE_CATEGORIES),
    [state.version]
  );

  // Evaluation & standings
  const evaluation = useMemo(() => evaluateScorepad(state), [state]);

  // Handle score change with strict sanitization
  const handleScoreChange = useCallback(
    (playerId: 'player1' | 'player2', categoryId: string, text: string) => {
      const sanitized = sanitizeScoreInput(text);
      updateState((prev) => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          scores: {
            ...prev[playerId].scores,
            [categoryId]: sanitized,
          },
        },
      }));
    },
    [updateState]
  );

  // Handle player name change
  const handleNameChange = useCallback(
    (playerId: 'player1' | 'player2', newName: string) => {
      const trimmed = newName.slice(0, 24);
      updateState((prev) => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          name: trimmed,
        },
      }));
    },
    [updateState]
  );

  // Handle expansion switch
  const handleVersionSelect = useCallback(
    (version: ScorepadVersionId) => {
      updateState((prev) => ({
        ...prev,
        version,
      }));
    },
    [updateState]
  );

  // Reset confirmation
  const handleReset = useCallback(() => {
    const doReset = () => {
      if (onResetScores) {
        onResetScores();
      } else {
        updateState((prev) => ({
          ...prev,
          player1: { ...prev.player1, scores: {} },
          player2: { ...prev.player2, scores: {} },
        }));
      }
    };

    const confirmMessage = 'Deseja iniciar um novo jogo e zerar todas as pontuações?';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(confirmMessage)) {
        doReset();
      }
    } else {
      Alert.alert('Novo Jogo', confirmMessage, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Zerar Pontuação', style: 'destructive', onPress: doReset },
      ]);
    }
  }, [onResetScores, updateState]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Title & Field Guide Header */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Bloco de Pontuação</Text>
          <Text style={styles.screenSubtitle}>
            Tabela de contagem de fim de jogo para 2 jogadores
          </Text>
        </View>

        {/* Expansion / Ruleset Selector Pills */}
        <View style={styles.versionSelector}>
          {SCOREPAD_VERSIONS.map((v) => {
            const isSelected = state.version === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                onPress={() => handleVersionSelect(v.id)}
                activeOpacity={0.7}
                style={[
                  styles.versionPill,
                  isSelected && styles.versionPillSelected,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar versão ${v.label}`}
              >
                <Text
                  style={[
                    styles.versionPillText,
                    isSelected && styles.versionPillTextSelected,
                  ]}
                >
                  {v.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Winner & Standings Summary Banner */}
        <View style={styles.summaryCard}>
          {/* Player 1 Box */}
          <View
            style={[
              styles.playerBox,
              evaluation.leader === 'player1' && styles.playerBoxLeader,
            ]}
          >
            <View style={styles.playerNameRow}>
              <TextInput
                value={state.player1.name}
                onChangeText={(val) => handleNameChange('player1', val)}
                placeholder="Jogador 1"
                placeholderTextColor={colors.textMuted}
                maxLength={24}
                style={styles.playerNameInput}
              />
              <Feather name="edit-2" size={11} color={colors.textMuted} />
            </View>
            <Text style={styles.playerTotalScore}>
              {evaluation.player1Total}
            </Text>
            <Text style={styles.playerScoreUnit}>pontos</Text>
            {evaluation.leader === 'player1' ? (
              <View style={styles.winnerBadge}>
                <MaterialCommunityIcons name="crown" size={12} color="#8A5A00" />
                <Text style={styles.winnerBadgeText}>Líder</Text>
              </View>
            ) : null}
          </View>

          {/* Center VS & Leader Advantage Indicator */}
          <View style={styles.summaryCenter}>
            {evaluation.isTie ? (
              <View style={styles.tieContainer}>
                <MaterialCommunityIcons
                  name="scale-balance"
                  size={20}
                  color={colors.brassDark}
                />
                <Text style={styles.tieText}>Empate!</Text>
              </View>
            ) : evaluation.leader === 'none' ? (
              <Text style={styles.vsText}>VS</Text>
            ) : (
              <View style={styles.diffContainer}>
                <Text style={styles.diffValue}>+{evaluation.diff}</Text>
                <Text style={styles.diffLabel}>pts dif.</Text>
              </View>
            )}
          </View>

          {/* Player 2 Box */}
          <View
            style={[
              styles.playerBox,
              evaluation.leader === 'player2' && styles.playerBoxLeader,
            ]}
          >
            <View style={styles.playerNameRow}>
              <TextInput
                value={state.player2.name}
                onChangeText={(val) => handleNameChange('player2', val)}
                placeholder="Jogador 2"
                placeholderTextColor={colors.textMuted}
                maxLength={24}
                style={styles.playerNameInput}
              />
              <Feather name="edit-2" size={11} color={colors.textMuted} />
            </View>
            <Text style={styles.playerTotalScore}>
              {evaluation.player2Total}
            </Text>
            <Text style={styles.playerScoreUnit}>pontos</Text>
            {evaluation.leader === 'player2' ? (
              <View style={styles.winnerBadge}>
                <MaterialCommunityIcons name="crown" size={12} color="#8A5A00" />
                <Text style={styles.winnerBadgeText}>Líder</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Scorepad Table Card */}
        <View style={styles.sheetCard}>
          {/* Table Column Headers */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.columnHeader, styles.catColumn]}>
              Categoria
            </Text>
            <Text
              style={[styles.columnHeader, styles.scoreColumn]}
              numberOfLines={1}
            >
              {state.player1.name || 'Jogador 1'}
            </Text>
            <Text
              style={[styles.columnHeader, styles.scoreColumn]}
              numberOfLines={1}
            >
              {state.player2.name || 'Jogador 2'}
            </Text>
          </View>

          {/* Score Category Rows */}
          {activeCategories.map((category, index) => {
            const p1Val = state.player1.scores[category.id] ?? '';
            const p2Val = state.player2.scores[category.id] ?? '';
            const isLast = index === activeCategories.length - 1;

            return (
              <View
                key={category.id}
                style={[styles.categoryRow, isLast && styles.categoryRowLast]}
              >
                {/* Left: Category Label & Icon */}
                <View style={styles.catCell}>
                  <WatercolorIcon
                    type={category.iconType}
                    size="sm"
                    variant={((index % 3) + 1) as 1 | 2 | 3}
                  />
                  <View style={styles.catTextContainer}>
                    <Text style={styles.catLabel}>{category.label}</Text>
                    {category.expansion !== 'base' ? (
                      <View style={styles.expansionTag}>
                        <Text style={styles.expansionTagText}>
                          {category.expansion === 'americas'
                            ? 'Américas'
                            : 'Oceania'}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Middle: Player 1 Score Input */}
                <View style={styles.inputCell}>
                  <TextInput
                    value={p1Val}
                    onChangeText={(val) =>
                      handleScoreChange('player1', category.id, val)
                    }
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={3}
                    selectTextOnFocus
                    style={[
                      styles.scoreInput,
                      p1Val.length > 0 && styles.scoreInputFilled,
                    ]}
                    accessibilityLabel={`${category.label} de ${state.player1.name}`}
                  />
                </View>

                {/* Right: Player 2 Score Input */}
                <View style={styles.inputCell}>
                  <TextInput
                    value={p2Val}
                    onChangeText={(val) =>
                      handleScoreChange('player2', category.id, val)
                    }
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={3}
                    selectTextOnFocus
                    style={[
                      styles.scoreInput,
                      p2Val.length > 0 && styles.scoreInputFilled,
                    ]}
                    accessibilityLabel={`${category.label} de ${state.player2.name}`}
                  />
                </View>
              </View>
            );
          })}

          {/* Table Total Row */}
          <View style={styles.totalRow}>
            <View style={styles.catCell}>
              <Text style={styles.totalRowLabel}>TOTAL</Text>
            </View>
            <View style={styles.inputCell}>
              <Text
                style={[
                  styles.totalRowScore,
                  evaluation.leader === 'player1' && styles.totalRowScoreWinner,
                ]}
              >
                {evaluation.player1Total}
              </Text>
            </View>
            <View style={styles.inputCell}>
              <Text
                style={[
                  styles.totalRowScore,
                  evaluation.leader === 'player2' && styles.totalRowScoreWinner,
                ]}
              >
                {evaluation.player2Total}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button: Novo Jogo / Limpar */}
        <View style={styles.actionContainer}>
          <WatercolorBlobButton
            onPress={handleReset}
            title="Novo Jogo / Limpar"
            icon={<Feather name="rotate-ccw" size={16} color={colors.textPrimary} />}
            variant="secondary"
            shape="pill"
            shapeVariant={3}
            size="md"
            accessibilityLabel="Zerar todas as pontuações e iniciar novo jogo"
            style={styles.resetButtonWrapper}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  titleSection: {
    marginBottom: spacing.sm,
  },
  screenTitle: {
    fontFamily: fonts.serif,
    fontSize: typeScale.title,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontSize: typeScale.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  versionSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  versionPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryBorder,
  },
  versionPillText: {
    fontFamily: fonts.sans,
    fontSize: typeScale.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  versionPillTextSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginVertical: spacing.sm,
    shadowColor: '#2B1E12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  playerBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  playerBoxLeader: {
    backgroundColor: '#FAF5EA',
    borderWidth: 1,
    borderColor: colors.brass,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  playerNameInput: {
    fontFamily: fonts.serif,
    fontSize: typeScale.label,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 4,
    maxWidth: 90,
  },
  playerTotalScore: {
    fontFamily: fonts.serif,
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 38,
  },
  playerScoreUnit: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF4D6',
    borderWidth: 1,
    borderColor: colors.brass,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  winnerBadgeText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '700',
    color: '#8A5A00',
  },
  summaryCenter: {
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  vsText: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontSize: typeScale.label,
    color: colors.textMuted,
  },
  diffContainer: {
    alignItems: 'center',
  },
  diffValue: {
    fontFamily: fonts.sans,
    fontSize: typeScale.title,
    fontWeight: '800',
    color: colors.primary,
  },
  diffLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.textMuted,
  },
  tieContainer: {
    alignItems: 'center',
    gap: 2,
  },
  tieText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: colors.brassDark,
  },
  sheetCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.sm,
    marginTop: spacing.sm,
    shadowColor: '#2B1E12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  columnHeader: {
    fontFamily: fonts.serif,
    fontSize: typeScale.label,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  catColumn: {
    flex: 2,
    textAlign: 'left',
    paddingLeft: spacing.xs,
  },
  scoreColumn: {
    flex: 1,
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  categoryRowLast: {
    borderBottomWidth: 0,
  },
  catCell: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: spacing.xs,
  },
  catTextContainer: {
    flex: 1,
  },
  catLabel: {
    fontFamily: fonts.serif,
    fontSize: typeScale.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  expansionTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 1,
  },
  expansionTagText: {
    fontFamily: fonts.sans,
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
  },
  inputCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  scoreInput: {
    width: '100%',
    maxWidth: 72,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: typeScale.title,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  scoreInputFilled: {
    borderColor: colors.borderFocus,
    backgroundColor: '#FAFDFB',
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    paddingHorizontal: spacing.xs,
  },
  totalRowLabel: {
    fontFamily: fonts.serif,
    fontSize: typeScale.body,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  totalRowScore: {
    fontFamily: fonts.sans,
    fontSize: typeScale.display,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  totalRowScoreWinner: {
    color: colors.primary,
  },
  actionContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  resetButtonWrapper: {
    width: '100%',
    maxWidth: 240,
  },
});

