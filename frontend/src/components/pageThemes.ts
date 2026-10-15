export type ThemeName =
  | 'home'
  | 'cbse'
  | 'icse'
  | 'stateboard'
  | 'counseling'
  | 'skills'
  | 'booking'
  | 'success';

export type PageTexture = 'dots' | 'grid' | 'none';

interface PageTheme {
  gradient: string;
  textureColor: string;
}

export const PAGE_THEMES: Record<ThemeName, PageTheme> = {
  home: {
    gradient: 'linear-gradient(135deg, #071b24 0%, #0b2731 50%, #0c3440 100%)',
    textureColor: 'rgba(94, 234, 212, 0.09)',
  },
  cbse: {
    gradient: 'linear-gradient(135deg, #071b24 0%, #0b2731 55%, #103743 100%)',
    textureColor: 'rgba(56, 189, 248, 0.11)',
  },
  icse: {
    gradient: 'linear-gradient(135deg, #101b2d 0%, #18253a 55%, #30223a 100%)',
    textureColor: 'rgba(244, 114, 182, 0.11)',
  },
  stateboard: {
    gradient: 'linear-gradient(135deg, #10231f 0%, #15332e 55%, #3a3020 100%)',
    textureColor: 'rgba(251, 191, 36, 0.11)',
  },
  counseling: {
    gradient: 'linear-gradient(135deg, #e9d5ff 0%, #f5d0fe 50%, #fecdd3 100%)',
    textureColor: 'rgba(147, 51, 234, 0.15)',
  },
  skills: {
    gradient: 'linear-gradient(135deg, #071b24 0%, #0b2731 55%, #112e42 100%)',
    textureColor: 'rgba(94, 234, 212, 0.11)',
  },
  booking: {
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6d28d9 100%)',
    textureColor: 'rgba(255, 255, 255, 0.12)',
  },
  success: {
    gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)',
    textureColor: 'rgba(255, 255, 255, 0.12)',
  },
};