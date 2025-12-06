export const LAYOUTS: Record<string, Record<string, any>> = {
  default: {
    avatar: {
      left: '50px',
      top: '50px',
      width: '400px',
      height: '600px',
    },
    prop: {
      right: '50px',
      top: '50px',
      width: '400px',
      height: '600px',
    },
  },
  narrator_left_prop_right: {
    avatar: {
      left: '50px',
      top: '100px',
      width: '350px',
      height: '550px',
    },
    prop: {
      right: '50px',
      top: '100px',
      width: '350px',
      height: '550px',
    },
  },
  centered: {
    avatar: {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: '600px',
      height: '700px',
    },
    prop: {
      display: 'none',
    },
  },
  split_horizontal: {
    avatar: {
      left: '0',
      top: '0',
      width: '50%',
      height: '100%',
    },
    prop: {
      right: '0',
      top: '0',
      width: '50%',
      height: '100%',
    },
  },
};
