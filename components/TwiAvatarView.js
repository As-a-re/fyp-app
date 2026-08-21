import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { buildTalkingHeadHtml } from "./twiAvatarHtml";

/**
 * Renders the TalkingHead 3D avatar and exposes an imperative `speak()`
 * method. Communication with the embedded page happens purely over
 * postMessage (see twiAvatarHtml.js for the message contract), so this
 * wrapper stays a thin platform switch: <iframe> on web, react-native-webview
 * on native.
 */
const TwiAvatarView = forwardRef(function TwiAvatarView(
  { avatarUrl, onReady, onSpeakingStart, onSpeakingEnd, onError },
  ref,
) {
  const iframeRef = useRef(null);
  const webViewRef = useRef(null);
  const [WebViewComponent, setWebViewComponent] = useState(null);
  const html = buildTalkingHeadHtml({ avatarUrl });

  useEffect(() => {
    if (Platform.OS !== "web") {
      try {
        const { WebView } = require("react-native-webview");
        setWebViewComponent(() => WebView);
      } catch (error) {
        onError?.("react-native-webview is not available: " + error.message);
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return undefined;

    const handleMessage = (event) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "ready") onReady?.();
      if (data.type === "speaking-start") onSpeakingStart?.();
      if (data.type === "speaking-end") onSpeakingEnd?.();
      if (data.type === "error") onError?.(data.message);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onReady, onSpeakingStart, onSpeakingEnd, onError]);

  const handleNativeMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "ready") onReady?.();
      if (data.type === "speaking-start") onSpeakingStart?.();
      if (data.type === "speaking-end") onSpeakingEnd?.();
      if (data.type === "error") onError?.(data.message);
    } catch {
      // ignore malformed messages
    }
  };

  useImperativeHandle(ref, () => ({
    speak(payload) {
      const message = { type: "speak", ...payload };
      if (Platform.OS === "web") {
        iframeRef.current?.contentWindow?.postMessage(message, "*");
      } else {
        webViewRef.current?.postMessage(JSON.stringify(message));
      }
    },
    idle() {
      const message = { type: "idle" };
      if (Platform.OS === "web") {
        iframeRef.current?.contentWindow?.postMessage(message, "*");
      } else {
        webViewRef.current?.postMessage(JSON.stringify(message));
      }
    },
  }));

  if (Platform.OS === "web") {
    return (
      <iframe
        ref={iframeRef}
        title="Twi AI Avatar"
        srcDoc={html}
        style={{ width: "100%", height: "100%", border: "none", background: "transparent" }}
        allow="autoplay"
      />
    );
  }

  if (!WebViewComponent) {
    return <View style={styles.fill} />;
  }

  return (
    <WebViewComponent
      ref={webViewRef}
      source={{ html }}
      style={styles.fill}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={["*"]}
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback
      onMessage={handleNativeMessage}
    />
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "transparent" },
});

export default TwiAvatarView;
