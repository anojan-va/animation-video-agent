import { CSSProperties } from "react";

export type LayoutDefinition = {
  avatar?: CSSProperties;
  prop?: CSSProperties;
  prop_secondary?: CSSProperties;
  prop_tertiary?: CSSProperties;
  textZone: CSSProperties;
};

export const LAYOUTS: Record<string, LayoutDefinition> = {
  
  // 1. Avatar center full screen - no text, no props
  avatar_full_center: {
    avatar: {
      position: "absolute",
      bottom: "0",
      left: "50%",
      transform: "translateX(-50%)",
      height: "100%",
      width: "auto",
      zIndex: 20
    },
    prop: { display: "none" },
    textZone: { display: "none" }
  },

  // 2. Prop center full screen - no text, no avatar
  prop_full_center: {
    avatar: { display: "none" },
    prop: {
      position: "absolute",
      bottom: "0",
      left: "50%",
      transform: "translateX(-50%)",
      height: "100%",
      width: "auto",
      zIndex: 20
    },
    textZone: { display: "none" }
  },

  // 3. Text center with 15% margins - no avatar, no props
  text_full_center: {
    avatar: { display: "none" },
    prop: { display: "none" },
    textZone: {
      position: "absolute",
      top: "15%",
      left: "15%",
      width: "70%",
      height: "70%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100
    }
  },

  // 4. Avatar right (30%) - text left (65%) with 5% margin
  avatar_right_text_left: {
    avatar: {
      position: "absolute",
      bottom: "0",
      right: "0",
      width: "30%",
      height: "85%",
      zIndex: 20
    },
    prop: { display: "none" },
    textZone: {
      position: "absolute",
      top: "15%",
      left: "0",
      width: "65%",
      display: "flex",
      justifyContent: "center",
      zIndex: 100
    }
  },

  // 5. Prop right (30%) - text left (65%) with 5% margin
  prop_right_text_left: {
    avatar: { display: "none" },
    prop: {
      position: "absolute",
      bottom: "0",
      right: "0",
      width: "30%",
      height: "85%",
      zIndex: 20
    },
    textZone: {
      position: "absolute",
      top: "15%",
      left: "0",
      width: "65%",
      display: "flex",
      justifyContent: "center",
      zIndex: 100
    }
  },

  // 6. Avatar left (30%) - text right (65%) with 5% margin
  avatar_left_text_right: {
    avatar: {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "35%",
      height: "85%",
      zIndex: 20
    },
    prop: { display: "none" },
    textZone: {
      position: "absolute",
      top: "15%",
      right: "0",
      width: "60%",
      display: "flex",
      justifyContent: "center",
      zIndex: 100
    }
  },

  // 7. Prop left (30%) - text right (65%) with 5% margin
  prop_left_text_right: {
    avatar: { display: "none" },
    prop: {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "30%",
      height: "85%",
      zIndex: 20
    },
    textZone: {
      position: "absolute",
      top: "15%",
      right: "0",
      width: "65%",
      display: "flex",
      justifyContent: "center",
      zIndex: 100
    }
  },

  // 8. Avatar middle (30%) - text left and right
  avatar_middle_text_sides: {
    avatar: {
      position: "absolute",
      bottom: "0",
      left: "50%",
      transform: "translateX(-50%)",
      width: "30%",
      height: "85%",
      zIndex: 20
    },
    prop: { display: "none" },
    textZone: {
      position: "absolute",
      top: "15%",
      left: "0",
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
      padding: "0 5%",
      zIndex: 100
    }
  },

  // 9. Text top center (35%) - avatar bottom center (55%) with 5% margin
  text_top_avatar_bottom: {
    avatar: {
      position: "absolute",
      bottom: "0",
      left: "50%",
      transform: "translateX(-50%)",
      height: "75%",
      width: "auto",
      zIndex: 20
    },
    prop: { display: "none" },
    textZone: {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "25%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100
    }
  },

  // 10. Text top center (35%) - prop bottom center (55%) with 5% margin
  text_top_prop_bottom: {
    avatar: { display: "none" },
    prop: {
      position: "absolute",
      bottom: "0",
      left: "50%",
      transform: "translateX(-50%)",
      height: "55%",
      width: "auto",
      zIndex: 20
    },
    textZone: {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "35%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100
    }
  },

  // 11. Avatar center (40%) - props left and right with 5% margins
  avatar_center_props_sides: {
    avatar: {
      position: "absolute",
      bottom: "0",
      left: "50%",
      transform: "translateX(-50%)",
      width: "40%",
      height: "85%",
      zIndex: 20
    },
    prop: {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "27.5%",
      height: "85%",
      zIndex: 20
    },
    prop_secondary: {
      position: "absolute",
      bottom: "0",
      right: "0",
      width: "27.5%",
      height: "85%",
      zIndex: 20
    },
    textZone: {
      position: "absolute",
      top: "5%",
      left: "0",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      zIndex: 100
    }
  },

  // 12. Three props left, center, right with 5% margins
  props_triple_row: {
    avatar: { display: "none" },
    prop: {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "30%",
      height: "85%",
      zIndex: 20
    },
    prop_tertiary: {
      position: "absolute",
      bottom: "0",
      left: "50%",
      transform: "translateX(-50%)",
      width: "30%",
      height: "85%",
      zIndex: 20
    },
    prop_secondary: {
      position: "absolute",
      bottom: "0",
      right: "0",
      width: "30%",
      height: "85%",
      zIndex: 20
    },
    textZone: {
      position: "absolute",
      top: "5%",
      left: "0",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      zIndex: 100
    }
  },

  // 13. Avatar right (50%) - prop left (40%) with 10% margin - NO TEXT
  avatar_right_prop_left: {
    avatar: {
      position: "absolute",
      bottom: "0",
      right: "0",
      width: "50%",
      height: "85%",
      zIndex: 20
    },
    prop: {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "40%",
      height: "85%",
      zIndex: 20
    },
    textZone: { display: "none" }
  },

  // 14. Avatar left (50%) - prop right (40%) with 10% margin - NO TEXT
  avatar_left_prop_right: {
    avatar: {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "55%",
      height: "95%",
      zIndex: 20
    },
    prop: {
      position: "absolute",
      bottom: "0",
      right: "0",
      width: "45%",
      height: "85%",
      zIndex: 20
    },
    textZone: { display: "none" }
  }
};
