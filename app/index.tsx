import { ThemedText as Text } from "@/components/themed-text";
import { ThemedView as View } from "@/components/themed-view";
import * as Haptics from "expo-haptics";
import { Accelerometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

export default function App() {
  const [result, setResult] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const shakeCooldown = useRef(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);

    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const force = Math.sqrt(x * x + y * y + z * z);
      if (force > 2.2 && !shakeCooldown.current) {
        shakeCooldown.current = true;
        decide();
        setTimeout(() => (shakeCooldown.current = false), 1500);
      }
    });

    return () => sub.remove();
  }, []);

  function decide() {
    if (locked) return;

    setLocked(true);
    setResult(null);
    fadeAnim.setValue(0);

    // Pulse animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      const yes = Math.random() < 0.5;
      setResult(yes ? "YES" : "NO");

      // Fade in animation
      Animated.spring(fadeAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      if (yes) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setTimeout(() => setLocked(false), 300);
    }, 220);
  }

  return (
    <View style={{ flex: 1 }}>
      <Text>Just Decide</Text>
      <Pressable style={styles.container} onPress={decide}>
        <View style={styles.content}>
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
              alignItems: 'center',
            }}
          >
            {result ? (
              <>
                <View style={[
                  styles.resultCard,
                  result === "YES" ? styles.yesCard : styles.noCard
                ]}>
                  <Text style={[
                    styles.result,
                    result === "YES" ? styles.yesText : styles.noText
                  ]}>
                    {result}
                  </Text>
                </View>
                <Text style={styles.sub}>
                  {result === "YES" ? "Trust it." : "You already knew."}
                </Text>
              </>
            ) : (
              <View style={styles.promptCard}>
                <Text style={styles.prompt}>Tap or shake</Text>
                <Text style={styles.promptSub}>for your answer</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
    maxWidth: 360,
  },
  resultCard: {
    borderRadius: 32,
    paddingHorizontal: 60,
    paddingVertical: 50,
    minWidth: 280,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    transform: [{ scale: 1.02 }],
  },
  yesCard: {
    backgroundColor: "#059669",
    borderWidth: 3,
    borderColor: "#10b981",
  },
  noCard: {
    backgroundColor: "#dc2626",
    borderWidth: 3,
    borderColor: "#ef4444",
  },
  result: {
    fontSize: 96,
    fontWeight: "900",
    letterSpacing: 6,
    textAlign: "center",
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  yesText: {
    color: "#ffffff",
  },
  noText: {
    color: "#ffffff",
  },
  sub: {
    marginTop: 36,
    color: "#666",
    fontSize: 22,
    textAlign: "center",
    fontStyle: "italic",
    letterSpacing: 1,
    fontWeight: "500",
  },
  promptCard: {
    paddingHorizontal: 60,
    paddingVertical: 50,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    minWidth: 280,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  prompt: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    color: "#374151",
    letterSpacing: 2,
    marginBottom: 8,
  },
  promptSub: {
    fontSize: 18,
    textAlign: "center",
    color: "#6b7280",
    letterSpacing: 0.5,
    fontWeight: "400",
  },
});