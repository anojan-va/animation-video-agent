interface MotionPreset {
  getTransform: (progress: number) => string;
  getOpacity: (progress: number) => number;
}

export const MOTION_PRESETS: Record<string, MotionPreset> = {
  default: {
    getTransform: () => 'scale(1)',
    getOpacity: () => 1,
  },

  slide_in_left: {
    getTransform: (progress: number) => {
      const x = -100 + progress * 100;
      return `translateX(${x}px)`;
    },
    getOpacity: (progress: number) => {
      return Math.max(0, progress);
    },
  },

  slide_in_right: {
    getTransform: (progress: number) => {
      const x = 100 - progress * 100;
      return `translateX(${x}px)`;
    },
    getOpacity: (progress: number) => {
      return Math.max(0, progress);
    },
  },

  pop_in: {
    getTransform: (progress: number) => {
      const scale = progress;
      return `scale(${scale})`;
    },
    getOpacity: (progress: number) => {
      return progress;
    },
  },

  shake: {
    getTransform: (progress: number) => {
      const angle = Math.sin(progress * Math.PI * 4) * 5;
      return `rotate(${angle}deg)`;
    },
    getOpacity: () => 1,
  },

  highlight_red: {
    getTransform: () => 'scale(1.1)',
    getOpacity: () => 1,
  },

  fade_in: {
    getTransform: () => 'scale(1)',
    getOpacity: (progress: number) => {
      return progress;
    },
  },

  bounce: {
    getTransform: (progress: number) => {
      const bounceProgress = progress < 0.5 ? progress * 2 : 2 - progress * 2;
      const y = Math.sin(bounceProgress * Math.PI) * 30;
      return `translateY(${-y}px)`;
    },
    getOpacity: () => 1,
  },
};
