import { interpolate } from "remotion";

export const ENTRANCES = {
  pop: (v: number) => `scale(${v})`,
  slide_up: (v: number) => `translateY(${interpolate(v, [0, 1], [100, 0])}%)`,
  drop_down: (v: number) => `translateY(${interpolate(v, [0, 1], [-150, 0])}%)`,
  slide_left: (v: number) => `translateX(${interpolate(v, [0, 1], [-100, 0])}%)`,
};

export const IDLES = {
  breathe: (f: number) => `translateY(${Math.sin(f / 30) * 5}px)`,
  shake: (f: number) => `translateX(${Math.sin(f / 2) * 3}px) rotate(${Math.sin(f / 3) * 2}deg)`,
  still: (f: number) => ``
};
