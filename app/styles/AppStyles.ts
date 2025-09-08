// styles/AppStyles.ts
import { StyleSheet } from 'react-native';

// 색상 테마
export const Colors = {
// Primary Colors
primary: '#4A4DFF',
primaryLight: '#6366F1',
primaryDark: '#3730A3',

// Grayscale
white: '#FFFFFF',
gray50: '#F8F9FA',
gray100: '#F1F3F4',
gray200: '#E9ECEF',
gray300: '#DEE2E6',
gray400: '#CED4DA',
gray500: '#ADB5BD',
gray600: '#6C757D',
gray700: '#495057',
gray800: '#343A40',
gray900: '#212529',

// Status Colors
success: '#10B981',
warning: '#F59E0B',
error: '#EF4444',
info: '#0EA5E9',

// Background Colors
background: '#F8F9FA',
surface: '#FFFFFF',
overlay: 'rgba(0, 0, 0, 0.5)',

// Text Colors
textPrimary: '#212529',
textSecondary: '#6C757D',
textTertiary: '#ADB5BD',
textInverse: '#FFFFFF',

// Border Colors
border: '#E9ECEF',
borderLight: '#F1F3F4',
borderDark: '#DEE2E6',
};

// 글꼴 크기
export const FontSizes = {
xs: 10,
sm: 12,
base: 14,
lg: 16,
xl: 18,
'2xl': 20,
'3xl': 24,
'4xl': 32,
};

// 간격
export const Spacing = {
xs: 4,
sm: 8,
md: 12,
lg: 16,
xl: 20,
'2xl': 24,
'3xl': 32,
'4xl': 48,
};

// 반지름
export const BorderRadius = {
none: 0,
sm: 4,
md: 6,
lg: 8,
xl: 12,
'2xl': 16,
'3xl': 24,
full: 9999,
};

// 그림자
export const Shadows = {
sm: {
shadowColor: '#000',
shadowOffset: { width: 0, height: 1 },
shadowOpacity: 0.05,
shadowRadius: 2,
elevation: 1,
},
md: {
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
elevation: 2,
},
lg: {
shadowColor: '#000',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.15,
shadowRadius: 8,
elevation: 4,
},
};

// 공통 스타일
export const CommonStyles = StyleSheet.create({
// 컨테이너
container: {
flex: 1,
backgroundColor: Colors.background,
},
safeArea: {
flex: 1,
backgroundColor: Colors.surface,
},

// 플렉스
flexCenter: {
justifyContent: 'center',
alignItems: 'center',
},
flexRow: {
flexDirection: 'row',
},
flexRowCenter: {
flexDirection: 'row',
alignItems: 'center',
},
flexRowBetween: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},

// 텍스트
textCenter: {
textAlign: 'center',
},
textBold: {
fontWeight: 'bold',
},
textSemiBold: {
fontWeight: '600',
},
textMedium: {
fontWeight: '500',
},

// 버튼
button: {
paddingHorizontal: Spacing.lg,
paddingVertical: Spacing.md,
borderRadius: BorderRadius.lg,
alignItems: 'center',
justifyContent: 'center',
},
buttonPrimary: {
backgroundColor: Colors.primary,
},
buttonSecondary: {
backgroundColor: Colors.gray100,
borderWidth: 1,
borderColor: Colors.border,
},
buttonText: {
fontSize: FontSizes.base,
fontWeight: '600',
},
buttonTextPrimary: {
color: Colors.textInverse,
},
buttonTextSecondary: {
color: Colors.textSecondary,
},

// 카드
card: {
backgroundColor: Colors.surface,
borderRadius: BorderRadius.xl,
borderWidth: 1,
borderColor: Colors.border,
padding: Spacing.lg,
...Shadows.sm,
},

// 입력 필드
input: {
borderWidth: 1,
borderColor: Colors.border,
borderRadius: BorderRadius.lg,
paddingHorizontal: Spacing.md,
paddingVertical: Spacing.sm,
fontSize: FontSizes.base,
backgroundColor: Colors.surface,
},
inputFocused: {
borderColor: Colors.primary,
},

// 구분선
divider: {
height: 1,
backgroundColor: Colors.border,
},
dividerVertical: {
width: 1,
backgroundColor: Colors.border,
},

// 뱃지
badge: {
paddingHorizontal: Spacing.sm,
paddingVertical: Spacing.xs,
borderRadius: BorderRadius.full,
alignSelf: 'flex-start',
},
badgePrimary: {
backgroundColor: Colors.primary + '20',
},
badgeSuccess: {
backgroundColor: Colors.success + '20',
},
badgeWarning: {
backgroundColor: Colors.warning + '20',
},
badgeError: {
backgroundColor: Colors.error + '20',
},
badgeText: {
fontSize: FontSizes.xs,
fontWeight: '600',
},
badgeTextPrimary: {
color: Colors.primary,
},
badgeTextSuccess: {
color: Colors.success,
},
badgeTextWarning: {
color: Colors.warning,
},
badgeTextError: {
color: Colors.error,
},
});

// 유틸리티 함수들
export const createSpacing = (size: keyof typeof Spacing) => ({
margin: Spacing\[size],
});

export const createPadding = (size: keyof typeof Spacing) => ({
padding: Spacing\[size],
});

export const createMargin = (
top?: keyof typeof Spacing,
right?: keyof typeof Spacing,
bottom?: keyof typeof Spacing,
left?: keyof typeof Spacing
) => ({
marginTop: top ? Spacing\[top] : 0,
marginRight: right ? Spacing\[right] : 0,
marginBottom: bottom ? Spacing\[bottom] : 0,
marginLeft: left ? Spacing\[left] : 0,
});

export const createPaddingStyle = (
top?: keyof typeof Spacing,
right?: keyof typeof Spacing,
bottom?: keyof typeof Spacing,
left?: keyof typeof Spacing
) => ({
paddingTop: top ? Spacing\[top] : 0,
paddingRight: right ? Spacing\[right] : 0,
paddingBottom: bottom ? Spacing\[bottom] : 0,
paddingLeft: left ? Spacing\[left] : 0,
});

// 반응형 유틸리티 (화면 크기에 따른 조정)
export const responsive = {
fontSize: (base: number, scale: number = 1.2) => Math.round(base \* scale),
spacing: (base: number, scale: number = 1.5) => Math.round(base \* scale),
};
