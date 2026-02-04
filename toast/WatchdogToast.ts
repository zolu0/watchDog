/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import './WatchdogToast.css';

import { PING_URL } from '../assets/sound';

let sound: HTMLAudioElement | null = null;

fetch(PING_URL)
  .then((res) => res.blob())
  .then((blob) => {
    sound = new Audio(URL.createObjectURL(blob));
  })
  .catch(() => {});

export function createCustomToast(
  username: string,
  name: string,
  avatarUrl: string,
  onClick: () => void,
  playSound: boolean,
  volume: number,
) {
  const id = `watchdog-toast-${Date.now()}`;

  if (playSound && sound) {
    try {
      sound.volume = volume;
      sound.currentTime = 0;
      sound.play().catch(() => {});
    } catch (_) {}
  }

  const container =
    document.getElementById('watchdog-toast-container') ||
    (() => {
      const el = document.createElement('div');
      el.id = 'watchdog-toast-container';
      el.className = 'watchdog-toast-container';
      document.body.appendChild(el);
      return el;
    })();

  const toast = document.createElement('div');
  toast.id = id;
  toast.className = 'watchdog-toast';
  toast.style.cursor = 'pointer';

  const icon = document.createElement('span');
  icon.textContent = '🔔';
  icon.style.marginRight = '8px';

  const avatar = document.createElement('img');
  avatar.src = avatarUrl;
  avatar.alt = username;
  avatar.className = 'watchdog-avatar';

  const text = document.createElement('span');
  text.textContent = `${username} mentioned "${name}"`;
  text.className = 'watchdog-text';

  toast.appendChild(icon);
  toast.appendChild(avatar);
  toast.appendChild(text);

  toast.onclick = () => {
    onClick?.();
    toast.remove();
    if (container.childElementCount === 0) container.remove();
  };

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
    if (container.childElementCount === 0) container.remove();
  }, 6000);
}
