
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const QUICK_QUESTIONS = [
  'Tell me about popular tourist attractions in Sri Lanka?',
  'What are the best hotels in Colombo?',
  'Where is Sigiriya located?',
];

const WAVE_BARS = [16, 22, 14, 20, 12, 18, 24, 15, 19, 13, 22, 16, 20, 14, 18, 12];
const WAVE_COLORS = ['#4DA3FF', '#2CCB75', '#F4C14B', '#F08A4B'];

const BOT_SYSTEM_PROMPT =
  'You are an expert Sri Lanka travel assistant. Answer only about Sri Lankan attractions, hotels, travel tips, districts, and routes. Keep responses concise, practical, and accurate. If asked about anything outside Sri Lanka travel, politely redirect to Sri Lanka tourism topics.';

const AIChatScreen = () => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I can help with Sri Lankan tourist attractions and hotels. Ask me anything.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSend = useMemo(() => inputText.trim().length > 0 && !isLoading, [inputText, isLoading]);

  useEffect(() => {
    if (!chatStarted) {
      return;
    }

    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timer);
  }, [messages, isLoading, chatStarted]);

  const buildGeminiContents = (history, userText) => {
    const maxHistory = history.slice(-10);
    const prior = maxHistory
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

    prior.push({ role: 'user', parts: [{ text: userText }] });
    return prior;
  };

  const queryGemini = async (userText, history) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error('Set EXPO_PUBLIC_GEMINI_API_KEY in .env with a real Gemini API key.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: BOT_SYSTEM_PROMPT }],
        },
        contents: buildGeminiContents(history, userText),
        generationConfig: {
          temperature: 0.3,
          topP: 0.9,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini request failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || '')
      .join('')
      .replace(/\*\*/g, '')
      .trim();

    if (!text) {
      throw new Error('No response text returned by Gemini.');
    }

    return text;
  };

  const sendMessage = async (prefilledText) => {
    const userText = (prefilledText ?? inputText).trim();
    if (!userText || isLoading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const aiText = await queryGemini(userText, nextHistory);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: aiText,
        },
      ]);
    } catch (error) {
      const failText =
        error?.message ||
        'I could not fetch an answer right now. Please check your Gemini API key and network.';

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-error-${Date.now()}`,
          sender: 'bot',
          text: failText,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message) => {
    const isUser = message.sender === 'user';

    return (
      <View
        key={message.id}
        style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowBot]}
      >
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.botMessageText]}>
            {message.text}
          </Text>
        </View>
      </View>
    );
  };

  if (!chatStarted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.introContent} showsVerticalScrollIndicator={false}>
          <View style={styles.greetingWrap}>
            <Text style={styles.greetingText}>
              Hey! <Text style={styles.miraName}>I&apos;m Mira</Text>
            </Text>
            <Text style={styles.subGreeting}>How Can I Help Today?</Text>
          </View>

          <View style={styles.chipsRow}>
            <View style={styles.chip}><Text style={styles.chipText}>Things to do</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>Plan trip</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>Hotel guide</Text></View>
          </View>

          <View style={styles.waveRowIntro}>
            {WAVE_BARS.map((height, index) => (
              <View
                key={`intro-${index}`}
                style={[
                  styles.waveBar,
                  { height, backgroundColor: WAVE_COLORS[index % WAVE_COLORS.length], opacity: 0.7 },
                ]}
              />
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Get AI-powered Travel Insights</Text>
            <Text style={styles.featureText}>Discover destinations and hotels across Sri Lanka.</Text>
            <Text style={styles.featureText}>Get practical answers for routes, budgets, and stay options.</Text>

            <TouchableOpacity style={styles.startButton} onPress={() => setChatStarted(true)}>
              <Ionicons name="sparkles-outline" size={16} color="#ffffff" />
              <Text style={styles.startButtonText}>Start Chat</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 80}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setChatStarted(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#1F2A3A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Mira Travel Assistant</Text>
            <Text style={styles.headerSubtitle}>Sri Lanka attractions and hotels</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(renderMessage)}

          {isLoading && (
            <View style={[styles.messageRow, styles.messageRowBot]}>
              <View style={[styles.bubble, styles.botBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color="#1f6feb" />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.quickQuestionsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}
            keyboardShouldPersistTaps="handled"
          >
            {QUICK_QUESTIONS.map((question) => (
              <TouchableOpacity
                key={question}
                style={styles.quickChip}
                onPress={() => sendMessage(question)}
                disabled={isLoading}
              >
                <Text numberOfLines={1} style={styles.quickChipText}>
                  {question}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.inputRow, { marginBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about Sri Lanka attractions or hotels"
            placeholderTextColor="#8B95A6"
            style={styles.input}
            multiline
            maxLength={500}
            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)}
          />
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={!canSend}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF3F9',
  },
  flex: {
    flex: 1,
  },
  introContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  greetingWrap: {
    marginTop: 22,
  },
  greetingText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#222B38',
  },
  miraName: {
    color: '#2270D5',
    fontStyle: 'italic',
    fontWeight: '700',
  },
  subGreeting: {
    marginTop: 2,
    fontSize: 35,
    fontWeight: '700',
    color: '#222B38',
  },
  chipsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F3F5F8',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 12,
    color: '#5F6976',
    fontWeight: '600',
  },
  waveRowIntro: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  waveBar: {
    width: 3,
    borderRadius: 3,
  },
  card: {
    marginTop: 42,
    backgroundColor: '#F3F5F8',
    borderRadius: 18,
    padding: 16,
  },
  cardTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#28313F',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#697282',
    marginBottom: 8,
  },
  startButton: {
    marginTop: 16,
    height: 54,
    borderRadius: 999,
    backgroundColor: '#2270EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    marginLeft: 8,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2A3A',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#5D697A',
    fontWeight: '500',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 10,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  userBubble: {
    backgroundColor: '#2270EA',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E4E9F1',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#1F2A3A',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#536075',
    fontSize: 13,
    fontWeight: '600',
  },
  quickQuestionsWrap: {
    paddingTop: 6,
    paddingBottom: 4,
  },
  quickRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickChip: {
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#D9E2EE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 280,
  },
  quickChipText: {
    fontSize: 12,
    color: '#405066',
    fontWeight: '600',
  },
  inputRow: {
    marginTop: 8,
    marginHorizontal: 12,
    padding: 6,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5F1',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    color: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2270EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#9FB8DF',
  },
});

export default AIChatScreen;
