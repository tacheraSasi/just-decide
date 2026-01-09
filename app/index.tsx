import { ThemedText as Text } from "@/components/themed-text";
import { ThemedView as View } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";
import { Accelerometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_SIZE = Math.min(SCREEN_WIDTH * 0.85, 340);
const SHAKE_THRESHOLD = 2.0;

export default function App() {
  const [result, setResult] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const shakeCooldown = useRef(false);
  const colorScheme = useColorScheme();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const styles = getStyles(colorScheme, isShaking);

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
  }, [locked]);

  const animateShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -1,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const decide = () => {
    if (locked) return;

    setLocked(true);
    animateShake();

    // Fade out current content
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setResult(null);

      // Bounce animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      // Rotate animation
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        const yes = Math.random() < 0.5;
        const resultText = yes ? "YES" : "NO";
        setResult(resultText);

        // Fade in new result
        Animated.spring(fadeAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }).start();

        // Haptic feedback
        if (yes) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        setTimeout(() => setLocked(false), 500);
      }, 600);
    });
  };

  const shakeInterpolation = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-15deg", "0deg", "15deg"],
  });

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text type="title" style={styles.appTitle}>
          Just Decide
        </Text>
        <Text style={styles.subtitle}>
          Tap or shake to make a decision
        </Text>
      </View>

      <Pressable
        style={styles.container}
        onPress={decide}
        disabled={locked}
        android_ripple={{ color: "rgba(255,255,255,0.1)", borderless: false }}
      >
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: rotateInterpolation },
                { rotate: shakeInterpolation },
              ],
              opacity: fadeAnim,
            },
          ]}
        >
          {result ? (
            <View
              style={[
                styles.resultCard,
                result === "YES" ? styles.yesCard : styles.noCard,
              ]}
            >
              <Text
                style={[
                  styles.result,
                  result === "YES" ? styles.yesText : styles.noText,
                ]}
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {result}
              </Text>
            </View>
          ) : (
            <View style={styles.promptCard}>
              <Text style={styles.prompt}>?</Text>
              <Text style={styles.promptSub}>
                {isShaking ? "Deciding..." : "Ask a question"}
              </Text>
            </View>
          )}
        </Animated.View>

        {result && (
          <Animated.View
            style={[
              styles.footer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.resultSubtitle}>
              {result === "YES"
                ? "Go for it! ✨"
                : "Maybe not... 🤔"}
            </Text>
          </Animated.View>
        )}
      </Pressable>

      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          {locked
            ? "Consulting the universe..."
            : "Shake your phone for a quick decision"}
        </Text>

        <View style={styles.aboutContainer}><Text style={styles.aboutText}>about</Text></View>
        
      </View>
    </View>
  );
}

function getStyles(colorScheme: "light" | "dark" | null | undefined, isShaking: boolean) {
  const isDark = colorScheme === "dark";

  return StyleSheet.create({
    mainContainer: {
      flex: 1,
      paddingTop: 60,
      paddingHorizontal: 20,
    },
    header: {
      alignItems: "center",
      marginBottom: 40,
    },
    appTitle: {
      fontSize: 36,
      fontWeight: "800",
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? "#a1a1aa" : "#666",
      textAlign: "center",
    },
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    cardContainer: {
      width: CARD_SIZE,
      height: CARD_SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
    resultCard: {
      width: "100%",
      height: "100%",
      borderRadius: CARD_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: isDark ? "#000" : "#000",
      shadowOffset: {
        width: 0,
        height: isShaking ? 20 : 10,
      },
      shadowOpacity: isShaking ? 0.4 : 0.2,
      shadowRadius: isShaking ? 30 : 20,
      elevation: 15,
    },
    yesCard: {
      backgroundColor: isDark ? "#059669" : "#10b981",
      borderWidth: 4,
      borderColor: isDark ? "#34d399" : "#a7f3d0",
    },
    noCard: {
      backgroundColor: isDark ? "#dc2626" : "#ef4444",
      borderWidth: 4,
      borderColor: isDark ? "#f87171" : "#fca5a5",
    },
    result: {
      fontSize: CARD_SIZE * 0.1,
      fontWeight: "900",
      letterSpacing: 2,
      textAlign: "center",
      textShadowColor: "rgba(0,0,0,0.2)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
    },
    yesText: {
      color: "#ffffff",
    },
    noText: {
      color: "#ffffff",
    },
    promptCard: {
      width: "100%",
      height: "100%",
      borderRadius: CARD_SIZE / 2,
      borderWidth: 4,
      borderColor: isShaking
        ? isDark
          ? "#6366f1"
          : "#4f46e5"
        : isDark
          ? "#404040"
          : "#cbd5e1",
      borderStyle: "dashed",
      backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: isShaking ? "#6366f1" : isDark ? "#000" : "#000",
      shadowOffset: {
        width: 0,
        height: isShaking ? 15 : 8,
      },
      shadowOpacity: isShaking ? 0.3 : 0.1,
      shadowRadius: isShaking ? 25 : 16,
      elevation: 8,
    },
    prompt: {
      fontSize: CARD_SIZE * 0.25,
      fontWeight: "200",
      textAlign: "center",
      color: isShaking
        ? isDark
          ? "#6366f1"
          : "#4f46e5"
        : isDark
          ? "#71717a"
          : "#9ca3af",
      marginBottom: 16,
      opacity: isShaking ? 1 : 0.8,
    },
    promptSub: {
      fontSize: 18,
      fontWeight: "600",
      textAlign: "center",
      color: isShaking
        ? isDark
          ? "#6366f1"
          : "#4f46e5"
        : isDark
          ? "#a1a1aa"
          : "#6b7280",
      letterSpacing: 0.5,
    },
    footer: {
      marginTop: 40,
      alignItems: "center",
    },
    resultSubtitle: {
      fontSize: 22,
      fontWeight: "600",
      textAlign: "center",
      color: isDark ? "#e4e4e7" : "#374151",
      letterSpacing: 0.5,
    },
    hintContainer: {
      paddingVertical: 24,
      alignItems: "center",
    },
    hintText: {
      fontSize: 14,
      color: isDark ? "#71717a" : "#9ca3af",
      textAlign: "center",
      fontStyle: "italic",
    },
    aboutContainer: { marginTop: 12 },
    aboutText: {
      fontSize: 14,
      color: isDark ? "#71717a" : "#9ca3af",
      textAlign: "center",
      textDecorationLine: "underline",
    },
  });

}