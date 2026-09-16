# Design

## Scene
A dim room past midnight, phone in one hand, queueing tonight's videos for two accounts before US prime time. Dark theme is the only theme.

## Color
Strategy: Restrained. Pure neutral darks, one rose red for the next action, one ice blue for time, and six account colors for identity.

| Role | OKLCH | Use |
| --- | --- | --- |
| bg | 0.15 0 0 | App background |
| surface | 0.20 0 0 | Rows, inputs |
| raised | 0.25 0 0 | Pressed and selected |
| line | 0.31 0 0 | Borders |
| ink | 0.96 0 0 | Primary text |
| muted | 0.72 0 0 | Secondary text |
| faint | 0.62 0 0 | Placeholders |
| primary | 0.58 0.21 10 | Main button fill, white label |
| primaryInk | 0.74 0.16 10 | Red text on dark |
| accent | 0.86 0.06 220 | Times, done ticks |
| account | 0.80 0.12 hue | Hues 20, 70, 140, 200, 260, 320 |

## Typography
System sans (Roboto) in weights 400, 600, 700. Scale: 13, 15, 17, 20, 24, 34. Times use tabular figures.

## Shape and spacing
Spacing steps 4, 8, 12, 16, 24, 32. Radius 10 for small parts, 14 for rows, 20 for media, full pill for chips and buttons.

## Components
Primary button: full width pill, 56 tall, white label on primary. Secondary: surface fill with line border. Chips: pill with account dot. Rows: surface fill, no side stripes. Thumbnails keep 9:16.

## Motion
Native stack transitions only. Press feedback through fill change and a slight scale. Haptics on schedule, posted and delete.
