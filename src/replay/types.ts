declare module 'rrweb-player' {
  interface RRWebPlayerProps {
    events: any[];
    width?: number;
    height?: number;
    autoPlay?: boolean;
    showController?: boolean;
    speed?: number;
    speedOption?: number[];
  }

  class RRWebPlayer {
    constructor(props: { target: HTMLElement; props: RRWebPlayerProps });
  }

  export default RRWebPlayer;
}

declare module '*.css' {
  const content: string;
  export default content;
}

declare module 'rrweb-player/dist/style.css';
