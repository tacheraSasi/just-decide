import { ThemedText as Text } from "@/components/themed-text";
import { useTheme } from "@/contexts/theme-context";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Accelerometer } from "expo-sensors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_SIZE = Math.min(SCREEN_WIDTH * 0.72, 300);
const SHAKE_THRESHOLD = 2.0;

type ResultType = "YES" | "NO" | "MAYBE" | null;

const RESULT_CONFIG = {
  YES: {
    emoji: "✨",
    subtitle: "Go for it!",
    icon: "checkmark-circle" as const,
    gradientLight: ["#34d399", "#059669"] as const,
    gradientDark: ["#10b981", "#047857"] as const,
  },
  NO: {
    emoji: "🚫",
    subtitle: "Not this time.",
    icon: "close-circle" as const,
    gradientLight: ["#fb7185", "#e11d48"] as const,
    gradientDark: ["#f43f5e", "#be123c"] as const,
  },
  MAYBE: {
    emoji: "🤷",
    subtitle: "Sleep on it.",
    icon: "help-circle" as const,
    gradientLight: ["#fbbf24", "#d97706"] as const,
    gradientDark: ["#f59e0b", "#b45309"] as const,
  },
};

export default function App() {
  const [result, setResult] = useState<ResultType>(null);
  const [locked, setLocked] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const shakeCooldown = useRef(false);

  const { isDark, toggle: toggleTheme, mode: themeMode } = useTheme();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const resultSlideAnim = useRef(new Animated.Value(30)).current;
  const hintOpacity = useRef(new Animated.Value(1)).current;

  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleSheetChanges = useCallback((_index: number) => {}, []);

  // Idle pulse animation for the prompt card
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    if (!locked && !result) pulse.start();
    return () => pulse.stop();
  }, [locked, result]); // eslint-disable-line react-hooks/exhaustive-deps

  // Glow animation when shaking
  useEffect(() => {
    if (isShaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [isShaking]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);

    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const force = Math.sqrt(x * x + y * y + z * z);
      if (force > SHAKE_THRESHOLD && !shakeCooldown.current && !locked) {
        setIsShaking(true);
        shakeCooldown.current = true;
        decide();
        setTimeout(() => {
          setIsShaking(false);
          shakeCooldown.current = false;
        }, 1800);
      }
    });

    return () => sub.remove();
  }, [locked]); // eslint-disable-line react-hooks/exhaustive-deps

  const animateShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 80,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -1,
        duration: 80,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0.5,
        duration: 80,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -0.5,
        duration: 80,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 80,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const decide = () => {
    if (locked) return;

    setLocked(true);
    setShowConfetti(false);
    animateShake();

    // Fade hint text
    Animated.timing(hintOpacity, {
      toValue: 0.4,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Fade out current content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setResult(null);

      // Bounce back
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.12,
          duration: 200,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 200,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();

      // Spin
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        const rand = Math.random();
        const resultText: ResultType =
          rand < 0.4 ? "YES" : rand < 0.8 ? "NO" : "MAYBE";
        setResult(resultText);

        // Slide + fade in
        resultSlideAnim.setValue(30);
        Animated.parallel([
          Animated.spring(fadeAnim, {
            toValue: 1,
            tension: 80,
            friction: 9,
            useNativeDriver: true,
          }),
          Animated.spring(resultSlideAnim, {
            toValue: 0,
            tension: 80,
            friction: 9,
            useNativeDriver: true,
          }),
          Animated.timing(hintOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();

        // Confetti for YES
        if (resultText === "YES") {
          setShowConfetti(true);
        }

        // Haptic feedback
        if (resultText === "YES") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (resultText === "MAYBE") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        setTimeout(() => setLocked(false), 500);
      }, 700);
    });
  };

  const shakeInterpolation = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-12deg", "0deg", "12deg"],
  });

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const bgGradient = (
    isDark
      ? ["#08080f", "#0f0f23", "#0c0c18"]
      : ["#f8f9ff", "#eef1fb", "#f5f0ff"]
  ) as [string, string, ...string[]];

  const styles = getStyles(isDark, isShaking);

  const themeIcon =
    themeMode === "system"
      ? "phone-portrait-outline"
      : isDark
        ? "moon"
        : "sunny";

  return (
    <LinearGradient colors={bgGradient} style={styles.mainContainer}>
      {/* Decorative orbs */}
      <View style={styles.orbContainer} pointerEvents="none">
        <View
          style={[
            styles.orb,
            {
              top: SCREEN_HEIGHT * 0.06,
              left: -SCREEN_WIDTH * 0.2,
              width: SCREEN_WIDTH * 0.6,
              height: SCREEN_WIDTH * 0.6,
              backgroundColor: isDark
                ? "rgba(99,102,241,0.07)"
                : "rgba(129,140,248,0.08)",
            },
          ]}
        />
        <View
          style={[
            styles.orb,
            {
              top: SCREEN_HEIGHT * 0.5,
              right: -SCREEN_WIDTH * 0.25,
              width: SCREEN_WIDTH * 0.7,
              height: SCREEN_WIDTH * 0.7,
              backgroundColor: isDark
                ? "rgba(236,72,153,0.05)"
                : "rgba(244,114,182,0.06)",
            },
          ]}
        />
        <View
          style={[
            styles.orb,
            {
              bottom: SCREEN_HEIGHT * 0.05,
              left: SCREEN_WIDTH * 0.1,
              width: SCREEN_WIDTH * 0.4,
              height: SCREEN_WIDTH * 0.4,
              backgroundColor: isDark
                ? "rgba(52,211,153,0.04)"
                : "rgba(52,211,153,0.05)",
            },
          ]}
        />
      </View>

      {/* Header with theme toggle */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerCenter}>
            <Text
              style={[
                styles.appTitle,
                { color: isDark ? "#f4f4f5" : "#18181b" },
              ]}
            >
              Just Decide
            </Text>
          </View>
          <View style={styles.headerTrailing}>
            <Pressable
              onPress={toggleTheme}
              style={({ pressed }) => [
                styles.themeToggle,
                pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
              ]}
              hitSlop={14}
            >
              <Ionicons
                name={themeIcon as any}
                size={20}
                color={isDark ? "#a1a1aa" : "#71717a"}
              />
            </Pressable>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {locked ? "Consulting the universe..." : "Tap the orb or shake"}
        </Text>
      </View>

      {/* Main Card Area */}
      <Pressable style={styles.container} onPress={decide} disabled={locked}>
        <Animated.View
          style={[
            styles.cardOuter,
            {
              transform: [
                {
                  scale: result
                    ? scaleAnim
                    : Animated.multiply(scaleAnim, pulseAnim),
                },
                { rotate: rotateInterpolation },
                { rotate: shakeInterpolation },
              ],
            },
          ]}
        >
          <Animated.View style={[styles.cardInner, { opacity: fadeAnim }]}>
            {result ? (
              <LinearGradient
                colors={
                  (isDark
                    ? [...RESULT_CONFIG[result].gradientDark]
                    : [...RESULT_CONFIG[result].gradientLight]) as [
                    string,
                    string,
                    ...string[],
                  ]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resultCard}
              >
                <View style={styles.resultIconRow}>
                  <Ionicons
                    name={RESULT_CONFIG[result].icon}
                    size={38}
                    color="rgba(255,255,255,0.9)"
                  />
                </View>
                <Text
                  style={styles.resultText}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {result}
                </Text>
                <View style={styles.resultDivider} />
                <Text style={styles.resultEmoji}>
                  {RESULT_CONFIG[result].emoji}
                </Text>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.promptCard,
                  isDark ? styles.promptCardDark : styles.promptCardLight,
                ]}
              >
                <LinearGradient
                  colors={
                    (isDark
                      ? ["rgba(255,255,255,0.04)", "rgba(255,255,255,0.01)"]
                      : [
                          "rgba(255,255,255,0.95)",
                          "rgba(240,243,255,0.8)",
                        ]) as [string, string]
                  }
                  style={styles.promptGlass}
                >
                  <Animated.View
                    style={{
                      opacity: isShaking ? glowAnim : 0.55,
                    }}
                  >
                    <Ionicons
                      name={isShaking ? "sparkles" : "help"}
                      size={CARD_SIZE * 0.2}
                      color={
                        isShaking ? "#818cf8" : isDark ? "#4a4a57" : "#b4b4c4"
                      }
                    />
                  </Animated.View>
                  <Text
                    style={[
                      styles.promptSub,
                      isShaking && {
                        color: isDark ? "#a5b4fc" : "#6366f1",
                      },
                    ]}
                  >
                    {isShaking ? "Deciding..." : "Tap to decide"}
                  </Text>
                </LinearGradient>
              </View>
            )}
          </Animated.View>
        </Animated.View>

        {/* Result subtitle below card */}
        {result && (
          <Animated.View
            style={[
              styles.footer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: resultSlideAnim }],
              },
            ]}
          >
            <Text style={styles.resultSubtitle}>
              {RESULT_CONFIG[result].subtitle}
            </Text>
          </Animated.View>
        )}
      </Pressable>

      {/* Bottom hint */}
      <Animated.View style={[styles.hintContainer, { opacity: hintOpacity }]}>
        <View style={styles.hintRow}>
          <Ionicons
            name="phone-portrait-outline"
            size={20}
            color={isDark ? "#52525b" : "#a1a1aa"}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.hintText}>Shake for a quick answer</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.aboutButton,
            pressed && { opacity: 0.6 },
          ]}
          onPress={() => bottomSheetRef.current?.expand()}
          hitSlop={12}
        >
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={isDark ? "#52525b" : "#a1a1aa"}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.aboutText}>About</Text>
        </Pressable>
      </Animated.View>

      {/* Confetti */}
      {showConfetti && (
        <ConfettiCannon
          count={80}
          origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
          autoStart
          fadeOut
          fallSpeed={2800}
          explosionSpeed={320}
          colors={[
            "#34d399",
            "#6ee7b7",
            "#fbbf24",
            "#818cf8",
            "#f472b6",
            "#ffffff",
          ]}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
          />
        )}
        enablePanDownToClose
        onChange={handleSheetChanges}
        backgroundStyle={{
          backgroundColor: isDark ? "#18182b" : "#ffffff",
          borderRadius: 28,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? "#3f3f5c" : "#d4d4d8",
          width: 40,
        }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <View style={styles.sheetIconWrap}>
            <Ionicons
              name="sparkles"
              size={26}
              color={isDark ? "#818cf8" : "#6366f1"}
            />
          </View>

          <Text
            style={[
              styles.sheetTitle,
              { color: isDark ? "#e4e4e7" : "#18181b" },
            ]}
          >
            What is this?
          </Text>

          <Text
            style={[
              styles.sheetBody,
              { color: isDark ? "#a1a1aa" : "#52525b" },
            ]}
          >
            You came here hoping for an explanation.
          </Text>
          <Text
            style={[
              styles.sheetBody,
              { color: isDark ? "#a1a1aa" : "#52525b" },
            ]}
          >
            {"There isn't one."}
          </Text>
          <Text
            style={[
              styles.sheetBody,
              { color: isDark ? "#a1a1aa" : "#52525b" },
            ]}
          >
            This app gives you permission to do what you already want. Or not.
          </Text>

          <View style={styles.sheetDivider} />

          <Text
            style={[
              styles.sheetCredit,
              { color: isDark ? "#52525b" : "#a1a1aa" },
            ]}
          >
            Created by Tach. Blame him.
          </Text>
        </BottomSheetView>
      </BottomSheet>
    </LinearGradient>
  );
}

function getStyles(isDark: boolean, isShaking: boolean) {
  return StyleSheet.create({
    mainContainer: {
      flex: 1,
      paddingTop: Platform.OS === "ios" ? 62 : 44,
    },
    orbContainer: {
      ...StyleSheet.absoluteFillObject,
      overflow: "hidden",
    },
    orb: {
      position: "absolute",
      borderRadius: 9999,
    },

    // ── Header ──────────────────────────────────────────
    header: {
      alignItems: "center",
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      marginBottom: 6,
    },
    headerSpacer: {
      width: 40,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    headerTrailing: {
      width: 40,
      alignItems: "flex-end",
    },
    themeToggle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    },
    appTitle: {
      fontSize: 32,
      fontWeight: "800",
      letterSpacing: -0.8,
      textAlign: "center",
      lineHeight: 42,
      paddingVertical: 2,
    },
    subtitle: {
      fontSize: 15,
      fontWeight: "500",
      color: isDark ? "#71717a" : "#a1a1aa",
      textAlign: "center",
      lineHeight: 22,
      paddingVertical: 2,
      paddingHorizontal: 16,
      letterSpacing: 0.2,
    },

    // ── Card area ───────────────────────────────────────
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    cardOuter: {
      width: CARD_SIZE,
      height: CARD_SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
    cardInner: {
      width: "100%",
      height: "100%",
    },

    // ── Result card ─────────────────────────────────────
    resultCard: {
      width: "100%",
      height: "100%",
      borderRadius: CARD_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      ...Platform.select({
        ios: {
          shadowColor: isDark ? "#000" : "#4338ca",
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: isDark ? 0.45 : 0.25,
          shadowRadius: 28,
        },
        android: {
          elevation: 20,
        },
      }),
    },
    resultIconRow: {
      marginBottom: 6,
    },
    resultText: {
      fontSize: CARD_SIZE * 0.14,
      fontWeight: "900",
      letterSpacing: 5,
      color: "#ffffff",
      textAlign: "center",
      lineHeight: CARD_SIZE * 0.2,
      paddingHorizontal: 16,
      paddingVertical: 4,
      textShadowColor: "rgba(0,0,0,0.25)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
    },
    resultDivider: {
      width: 36,
      height: 2,
      borderRadius: 1,
      backgroundColor: "rgba(255,255,255,0.3)",
      marginVertical: 10,
    },
    resultEmoji: {
      fontSize: 26,
      lineHeight: 36,
      paddingVertical: 2,
    },

    // ── Prompt card ─────────────────────────────────────
    promptCard: {
      width: "100%",
      height: "100%",
      borderRadius: CARD_SIZE / 2,
      overflow: "hidden",
      borderWidth: 1.5,
    },
    promptCardDark: {
      borderColor: isShaking
        ? "rgba(129,140,248,0.4)"
        : "rgba(255,255,255,0.07)",
      ...Platform.select({
        ios: {
          shadowColor: isShaking ? "#6366f1" : "#000",
          shadowOffset: { width: 0, height: isShaking ? 12 : 8 },
          shadowOpacity: isShaking ? 0.35 : 0.3,
          shadowRadius: isShaking ? 24 : 20,
        },
        android: { elevation: 12 },
      }),
    },
    promptCardLight: {
      borderColor: isShaking ? "rgba(99,102,241,0.25)" : "rgba(0,0,0,0.06)",
      ...Platform.select({
        ios: {
          shadowColor: isShaking ? "#6366f1" : "#94a3b8",
          shadowOffset: { width: 0, height: isShaking ? 10 : 8 },
          shadowOpacity: isShaking ? 0.2 : 0.15,
          shadowRadius: isShaking ? 22 : 18,
        },
        android: { elevation: 10 },
      }),
    },
    promptGlass: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 18,
      paddingHorizontal: 24,
    },
    promptSub: {
      fontSize: 17,
      fontWeight: "600",
      textAlign: "center",
      color: isDark ? "#62626e" : "#a1a1b5",
      letterSpacing: 0.5,
      lineHeight: 24,
      paddingVertical: 2,
    },

    // ── Footer / subtitle ───────────────────────────────
    footer: {
      marginTop: 28,
      alignItems: "center",
      paddingHorizontal: 24,
    },
    resultSubtitle: {
      fontSize: 20,
      fontWeight: "600",
      textAlign: "center",
      color: isDark ? "#d4d4d8" : "#374151",
      letterSpacing: 0.3,
      lineHeight: 28,
      paddingVertical: 4,
    },

    // ── Hint area ───────────────────────────────────────
    hintContainer: {
      paddingBottom: Platform.OS === "ios" ? 38 : 26,
      paddingTop: 10,
      alignItems: "center",
      gap: 10,
    },
    hintRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
    },
    hintText: {
      fontSize:20,
      color: isDark ? "#52525b" : "#a1a1aa",
      textAlign: "center",
      lineHeight: 20,
    },
    aboutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    },
    aboutText: {
      fontSize: 13,
      fontWeight: "500",
      color: isDark ? "#62626e" : "#a1a1aa",
      textAlign: "center",
      lineHeight: 20,
    },

    // ── Bottom Sheet ────────────────────────────────────
    sheetContent: {
      paddingHorizontal: 36,
      paddingTop: 8,
      paddingBottom: 44,
      alignItems: "center",
    },
    sheetIconWrap: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: isDark
        ? "rgba(129,140,248,0.1)"
        : "rgba(99,102,241,0.08)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },
    sheetTitle: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 18,
      lineHeight: 28,
      paddingVertical: 2,
      letterSpacing: -0.3,
      textAlign: "center",
    },
    sheetBody: {
      fontSize: 15,
      lineHeight: 24,
      textAlign: "center",
      paddingVertical: 2,
      paddingHorizontal: 8,
      marginBottom: 6,
    },
    sheetDivider: {
      width: 32,
      height: 1,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      marginVertical: 20,
    },
    sheetCredit: {
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
      paddingVertical: 2,
    },
  });
}
