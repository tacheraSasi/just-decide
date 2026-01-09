import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Accelerometer } from "expo-sensors";

export default function App() {
  const [result, setResult] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const shakeCooldown = useRef(false);

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

    setTimeout(() => {
      const yes = Math.random() < 0.5;
      setResult(yes ? "YES" : "NO");

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
      <View>
        <Text style={styles.result}>
          {result ?? " "}
        </Text>
        {result && (
          <Text style={styles.sub}>
            {result === "YES" ? "Trust it." : "You already knew."}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  result: {
    color: "#fff",
    fontSize: 72,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
    transform: [{ scale: 1 }],
  },
  sub: {
    marginTop: 12,
    color: "#888",
    fontSize: 16,
    textAlign: "center",
  },
});
