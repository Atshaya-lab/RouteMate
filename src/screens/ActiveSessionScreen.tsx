import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../theme/tokens';
import { ActiveSession, ChatMessage, LocationCoordinate } from '../types';
import { LiveMapView } from '../components/map/LiveMapView';
import { VoiceCallModal } from '../components/modals/VoiceCallModal';
import { socketService } from '../services/socket';

interface ActiveSessionScreenProps {
  session: ActiveSession;
  currentTravelerLocation: LocationCoordinate;
  onFinishSession: () => void;
}

export const ActiveSessionScreen: React.FC<ActiveSessionScreenProps> = ({
  session,
  currentTravelerLocation,
  onFinishSession,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      sessionId: session.id,
      senderId: session.guide.id,
      senderName: session.guide.name,
      senderAvatar: session.guide.avatarUrl,
      text: `Hi Alex! I see you near the cobblestone alley. I am walking towards Mustek Metro Exit A with you.`,
      timestamp: session.startedAt,
      isGuide: true,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [durationText, setDurationText] = useState('00:00');
  const chatScrollRef = useRef<ScrollView>(null);

  // Server timestamp synchronized session duration
  useEffect(() => {
    const updateTimer = () => {
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000));
      const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
      const secs = String(elapsedSeconds % 60).padStart(2, '0');
      setDurationText(`${mins}:${secs}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    // Subscribe to real-time Socket.io chat room
    const unsubscribe = socketService.subscribeToSession(
      session.id,
      (msg) => {
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
      },
      (loc) => {
        // Update guide peer location
      },
      () => {
        Alert.alert('Session Ended', 'Your escort session has been safely concluded.');
        onFinishSession();
      }
    );

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [session.id, session.startedAt]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sessionId: session.id,
      senderId: 'traveler-001',
      senderName: 'Alex',
      text: inputText.trim(),
      timestamp: Date.now(),
      isGuide: false,
    };

    setMessages((prev) => [...prev, newMsg]);
    socketService.sendMessage(session.id, 'traveler-001', 'Alex', inputText.trim(), false);
    setInputText('');

    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Mock guide auto-reply for interactive walkthrough
    setTimeout(() => {
      const guideReply: ChatMessage = {
        id: 'msg-reply-' + Date.now(),
        sessionId: session.id,
        senderId: session.guide.id,
        senderName: session.guide.name,
        senderAvatar: session.guide.avatarUrl,
        text: 'Turn left right at the green lantern post ahead — that will bring us into the lighted square.',
        timestamp: Date.now(),
        isGuide: true,
      };
      setMessages((prev) => [...prev, guideReply]);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 2500);
  };

  const handleSafeFinish = () => {
    Alert.alert(
      'Complete Guidance Walk',
      'Have you reached your destination safely?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I Am Safe',
          style: 'default',
          onPress: () => {
            socketService.endSession(session.id);
            onFinishSession();
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Live Map with Route & Guide Pin */}
      <View style={styles.mapContainer}>
        <LiveMapView
          travelerLocation={currentTravelerLocation}
          guides={[session.guide]}
          height={260}
          routePolyline={[
            currentTravelerLocation,
            { latitude: currentTravelerLocation.latitude - 0.001, longitude: currentTravelerLocation.longitude + 0.001 },
            session.guide.location,
          ]}
        />

        {/* Floating Active HUD */}
        <View style={styles.floatingHud}>
          <View style={styles.hudGuideInfo}>
            <Image source={{ uri: session.guide.avatarUrl }} style={styles.hudAvatar} />
            <View>
              <View style={styles.hudGuideNameRow}>
                <Text style={styles.hudGuideName}>{session.guide.name}</Text>
                <View style={styles.livePill}>
                  <View style={styles.greenDot} />
                  <Text style={styles.liveText}>Live Escort</Text>
                </View>
              </View>
              <Text style={styles.hudDestination} numberOfLines={1}>
                To: {session.destination}
              </Text>
            </View>
          </View>

          <View style={styles.hudTimerBox}>
            <MaterialIcons name="timer" size={14} color={Colors.primaryContainer} />
            <Text style={styles.hudTimerText}>{durationText}</Text>
          </View>
        </View>
      </View>

      {/* Audio Guard Control Strip */}
      <View style={styles.audioGuardStrip}>
        <TouchableOpacity
          style={styles.callGuideBtn}
          onPress={() => setIsVoiceCallActive(true)}
          activeOpacity={0.85}
        >
          <MaterialIcons name="record-voice-over" size={18} color={Colors.onPrimary} />
          <Text style={styles.callGuideBtnText}>Voice Relay (Audio Guard Active)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.finishBtn}
          onPress={handleSafeFinish}
          activeOpacity={0.8}
        >
          <MaterialIcons name="check-circle" size={18} color={Colors.onSecondary} />
          <Text style={styles.finishBtnText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Real-time Socket.io Chat Room */}
      <View style={styles.chatSection}>
        <ScrollView
          ref={chatScrollRef}
          contentContainerStyle={styles.chatScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chatIntroBadge}>
            <MaterialIcons name="lock" size={12} color={Colors.secondaryLive} />
            <Text style={styles.chatIntroText}>
              End-to-End Encrypted Session • Telemetry active with RouteMate Sentinel
            </Text>
          </View>

          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubbleRow,
                msg.isGuide ? styles.guideBubbleRow : styles.travelerBubbleRow,
              ]}
            >
              {msg.isGuide && (
                <Image source={{ uri: session.guide.avatarUrl }} style={styles.chatAvatar} />
              )}
              <View
                style={[
                  styles.messageBubble,
                  msg.isGuide ? styles.guideBubble : styles.travelerBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.isGuide ? styles.guideText : styles.travelerText,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    msg.isGuide ? styles.guideTime : styles.travelerTime,
                  ]}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Chat Input Bar */}
        <View style={styles.chatInputBar}>
          <TextInput
            style={styles.chatInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message your guide..."
            placeholderTextColor={Colors.onSurfaceVariant}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <MaterialIcons name="send" size={18} color={Colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Voice Call Overlay Modal */}
      <VoiceCallModal
        visible={isVoiceCallActive}
        guide={session.guide}
        startedAt={session.startedAt}
        onEndCall={() => setIsVoiceCallActive(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  mapContainer: {
    position: 'relative',
  },
  floatingHud: {
    position: 'absolute',
    top: 12,
    left: Spacing.gutter,
    right: Spacing.gutter,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: Radii.lg,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Elevation.level2,
    zIndex: 20,
  },
  hudGuideInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  hudAvatar: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
  },
  hudGuideNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hudGuideName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radii.full,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryLive,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSecondaryContainer,
  },
  hudDestination: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    maxWidth: 160,
  },
  hudTimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  hudTimerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryContainer,
    fontVariant: ['tabular-nums'],
  },
  audioGuardStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  callGuideBtn: {
    flex: 1,
    height: 42,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radii.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  callGuideBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  finishBtn: {
    height: 42,
    paddingHorizontal: 14,
    backgroundColor: Colors.secondaryLive,
    borderRadius: Radii.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  finishBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSecondary,
  },
  chatSection: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  chatScroll: {
    padding: Spacing.gutter,
    gap: 12,
  },
  chatIntroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radii.full,
    marginBottom: 6,
  },
  chatIntroText: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  guideBubbleRow: {
    justifyContent: 'flex-start',
  },
  travelerBubbleRow: {
    justifyContent: 'flex-end',
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: Radii.full,
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.lg,
  },
  guideBubble: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomLeftRadius: 2,
    ...Elevation.level1,
  },
  travelerBubble: {
    backgroundColor: Colors.primaryContainer,
    borderBottomRightRadius: 2,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  guideText: {
    color: Colors.onSurface,
  },
  travelerText: {
    color: Colors.onPrimary,
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  guideTime: {
    color: Colors.outline,
  },
  travelerTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHigh,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    height: 42,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    fontSize: 13,
    color: Colors.onSurface,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
});
