import { Text, type TextProps } from 'react-native';
import { color, font } from './theme';

type Variant = 'caption' | 'body' | 'label' | 'title' | 'heading' | 'display';

type Props = TextProps & { variant?: Variant; tone?: string; tabular?: boolean };

export function Txt({ variant = 'body', tone = color.ink, tabular, style, ...rest }: Props) {
  return <Text {...rest} style={[font[variant], { color: tone }, tabular ? font.tabular : null, style]} />;
}
