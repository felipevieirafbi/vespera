/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameCanvas } from './components/GameCanvas';

export default function App() {
  return (
    <main id="app-root" className="w-screen h-screen overflow-hidden bg-slate-900">
      <GameCanvas />
    </main>
  );
}

