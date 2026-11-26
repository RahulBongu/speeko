import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { ModuleBrief } from '@speeko/core';
import { playLetsGoSound } from '../lib/mascot';
import { hasMobileAudio, playMobileAudio } from '../lib/audio';
import { TactileButton } from './Tactile';
import { COLORS } from '../lib/theme';

export function ModuleBriefModal({
  visible,
  brief,
  onContinue,
  onClose,
}: {
  visible: boolean;
  brief: ModuleBrief | null;
  onContinue: () => void;
  onClose: () => void;
}) {
  if (!brief) return null;

  function handleContinue() {
    void playLetsGoSound();
    onContinue();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(42, 18, 8, 0.45)',
          justifyContent: 'center',
          padding: 18,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 24,
            borderWidth: 2,
            borderColor: COLORS.dark,
            padding: 18,
            maxHeight: '85%',
            gap: 12,
          }}
        >
          <View>
            <Text style={{ fontSize: 11, fontWeight: '900', color: COLORS.greenDark, letterSpacing: 1 }}>
              MODULE {brief.originalUnitNumber} OVERVIEW
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.dark, marginTop: 2 }}>
              {brief.title}
            </Text>
          </View>

          <View
            style={{
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: COLORS.green,
              backgroundColor: COLORS.greenSoft,
              padding: 12,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '900', color: COLORS.greenDark, letterSpacing: 0.8 }}>
              TOPICS NOTE
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.dark }}>
              {brief.topicNote}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.muted }}>
              {brief.lessonCount} lessons
              {brief.listeningCount > 0 ? ` · ${brief.listeningCount} audio listening checks` : ''}
            </Text>
          </View>

          <Text style={{ fontSize: 11, fontWeight: '900', color: COLORS.muted, letterSpacing: 0.8 }}>
            UPCOMING ANSWERS GUIDE
          </Text>

          <ScrollView style={{ maxHeight: 230 }} contentContainerStyle={{ gap: 8 }}>
            {brief.answersGuide.map((item) => (
              <View
                key={`${item.target}-${item.prompt}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: COLORS.line,
                  backgroundColor: COLORS.cream,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.muted }}>
                    {item.prompt}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }}>
                    {item.target}
                  </Text>
                  {item.romanized ? (
                    <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.muted }}>
                      {item.romanized}
                    </Text>
                  ) : null}
                </View>
                {item.exerciseId && hasMobileAudio(item.exerciseId) ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Listen to ${item.prompt}`}
                    onPress={() => void playMobileAudio(item.exerciseId!)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: COLORS.green,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: COLORS.white, fontWeight: '900', fontSize: 14 }}>▶</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </ScrollView>

          <View style={{ gap: 8, marginTop: 4 }}>
            <TactileButton label="Continue" onPress={handleContinue} />
            <TactileButton label="Back to map" tone="cream" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function InlineModuleBriefBanner({
  brief,
  onContinue,
}: {
  brief: ModuleBrief;
  onContinue: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.green,
        backgroundColor: COLORS.white,
        padding: 12,
        gap: 8,
      }}
    >
      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: 10, fontWeight: '900', color: COLORS.greenDark, letterSpacing: 0.8 }}>
          MODULE {brief.originalUnitNumber} GUIDE · {brief.title.toUpperCase()}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.dark }}>
          Topics: {brief.topicNote}
        </Text>
        {brief.answersGuide.length > 0 ? (
          <Text numberOfLines={2} style={{ fontSize: 11, fontWeight: '600', color: COLORS.muted }}>
            Upcoming: {brief.answersGuide.slice(0, 3).map((a) => `${a.prompt} → ${a.target}`).join(' · ')}
          </Text>
        ) : null}
      </View>

      {expanded ? (
        <View style={{ gap: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: COLORS.line }}>
          {brief.answersGuide.map((item) => (
            <View
              key={`${item.target}-${item.prompt}`}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.muted }}>{item.prompt}</Text>
              <Text style={{ fontSize: 13, fontWeight: '900', color: COLORS.dark }}>
                {item.target} {item.romanized ? `(${item.romanized})` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setExpanded((v) => !v)}
          style={{
            flex: 1,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: COLORS.line,
            backgroundColor: COLORS.cream,
            paddingVertical: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.dark }}>
            {expanded ? 'Hide answers guide' : `Answers guide (${brief.answersGuide.length})`}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void playLetsGoSound();
            onContinue();
          }}
          style={{
            flex: 1,
            borderRadius: 10,
            backgroundColor: COLORS.green,
            paddingVertical: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '900', color: COLORS.white }}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}
