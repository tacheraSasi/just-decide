import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import { Accelerometer } from "expo-sensors";
import { ThemedView as View } from "@/components/themed-view";
import { ThemedText as Text } from "@/components/themed-text";

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
    <Pressable style={styles.container} onPress={decide}>
      <View style={styles.content}>
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  resultCard: {
    borderRadius: 24,
    paddingHorizontal: 48,
    paddingVertical: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  yesCard: {
    backgroundColor: "#10b981",
  },
  noCard: {
    backgroundColor: "#ef4444",
  },
  result: {
    fontSize: 80,
    fontWeight: "900",
    letterSpacing: 4,
    textAlign: "center",
  },
  yesText: {
    color: "#ffffff",
  },
  noText: {
    color: "#ffffff",
  },
  sub: {
    marginTop: 24,
    color: "#888",
    fontSize: 18,
    textAlign: "center",
    fontStyle: "italic",
    letterSpacing: 0.5,
  },
  promptCard: {
    paddingHorizontal: 48,
    paddingVertical: 32,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  prompt: {
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
    color: "#666",
    letterSpacing: 1,
  },
  promptSub: {
    fontSize: 16,
    textAlign: "center",
    color: "#999",
    marginTop: 4,
  },
});