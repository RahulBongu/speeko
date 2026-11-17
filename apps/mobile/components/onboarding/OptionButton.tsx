import { Pressable, Text, View } from 'react-native';
import { COLORS } from '../../lib/theme';

export function OptionButton({
  selected,
  label,
  description,
  onPress,
  prefix,
}: {
  selected?: boolean;
  label: string;
  description: string;
  onPress: () => void;
  prefix?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: selected ?? false }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        alignSelf: 'stretch',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: selected ? COLORS.green : COLORS.dark,
        backgroundColor: selected ? COLORS.greenSoft : COLORS.white,
        paddingVertical: 12,
        paddingHorizontal: 14,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {prefix ? (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: COLORS.creamDeep,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '900', color: COLORS.muted }}>{prefix}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: COLORS.dark }}>{label}</Text>
        <Text style={{ marginTop: 2, fontSize: 13, lineHeight: 18, fontWeight: '600', color: COLORS.muted }}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}
