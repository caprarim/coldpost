import { forwardRef } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { color, font, radius, space } from './theme';

export const Field = forwardRef<TextInput, TextInputProps>(function Field({ style, ...rest }, ref) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={color.faint}
      selectionColor={color.primary}
      cursorColor={color.primaryInk}
      {...rest}
      style={[font.body, styles.base, rest.multiline ? styles.multi : styles.single, style]}
    />
  );
});

const styles = StyleSheet.create({
  base: {
    color: color.ink,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.lg,
  },
  single: { height: 52 },
  multi: { minHeight: 52, paddingTop: 14, paddingBottom: 14, textAlignVertical: 'top' },
});
