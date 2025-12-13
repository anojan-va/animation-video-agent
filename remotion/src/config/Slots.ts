import { CSSProperties } from "react";

interface SlotConfig {
  style: CSSProperties;
  zIndex: number;
  allowedAnimations?: string[];
}

export const SLOTS: Record<string, SlotConfig> = {
  // Grounded Character (Left)
  narrator_left: {
    style: { position: "absolute", bottom: "-2%", left: "5%", height: "85%" },
    zIndex: 20,
    allowedAnimations: ["slide_up", "pop", "drop_down"]
  },
  // Floating Prop (Right)
  float_top_right: {
    style: { position: "absolute", top: "20%", right: "10%", height: "40%" },
    zIndex: 10,
    allowedAnimations: ["pop", "drop_down"]
  },
  // Background Object
  bg_center: {
    style: { position: "absolute", bottom: "0", left: "50%", transform: "translateX(-50%)", height: "60%" },
    zIndex: 5,
    allowedAnimations: ["pop"]
  },
  
  // Additional slots for flexibility
  narrator_right: {
    style: { position: "absolute", bottom: "-2%", right: "5%", height: "85%" },
    zIndex: 20,
    allowedAnimations: ["slide_up", "pop", "drop_down"]
  },
  
  float_top_left: {
    style: { position: "absolute", top: "20%", left: "10%", height: "40%" },
    zIndex: 10,
    allowedAnimations: ["pop", "drop_down"]
  },
  
  float_center: {
    style: { position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", height: "50%" },
    zIndex: 15,
    allowedAnimations: ["pop", "drop_down"]
  }
};
