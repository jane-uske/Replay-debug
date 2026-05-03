import React from 'react';
import { createRoot } from 'react-dom/client';
import ReplayApp from './ReplayApp';
import 'rrweb-player/dist/style.css';
import './styles.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<ReplayApp />);
}
