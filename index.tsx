/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { OptionType } from "@utils/types";
import { FluxDispatcher, NavigationRouter, UserStore } from "@webpack/common";

import { addLog } from "./data/logDB";
import { openWatchdogModal } from "./modals/WatchdogModal";
import { createCustomToast } from "./toast/WatchdogToast";

function normalizeNames(input: string): string[] {
    return input
        .split(",")
        .map(n => n.trim().toLowerCase())
        .filter(Boolean);
}

let unsub: (() => void) | null = null;

export default definePlugin({
    name: "WatchDog",
    description: "A plugin to watch your friends and enemies",
    authors: [Devs.zol],

    settings: definePluginSettings({
        names: {
            type: OptionType.STRING,
            default: "",
            description: "Separate names with commas",
        },
        playSound: {
            type: OptionType.BOOLEAN,
            default: true,
            description: "Play a sound to notify you when a name is mentioned",
        },
        volume: {
            type: OptionType.SLIDER,
            default: 0.1,
            description: "Notification sound volume",
            markers: [0, 0.25, 0.5, 0.75, 1],
            stickToMarkers: false,
        },
    }),

    toolboxActions: {
        "WatchDog Logs"() {
            openWatchdogModal();
        },
    },

    start() {
        const settingsStore = this.settings.store;

        unsub = FluxDispatcher.subscribe("MESSAGE_CREATE", event => {
            (async () => {
                const { message } = event;
                const selfId = UserStore.getCurrentUser().id;
                if (!message || message.author?.id === selfId) return;

                const keywords = normalizeNames(settingsStore.names);
                const content = message.content.toLowerCase();

                for (const name of keywords) {
                    if (content.includes(name)) {
                        const avatarUrl = message.author?.avatar
                            ? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`
                            : "https://cdn.discordapp.com/embed/avatars/0.png";

                        createCustomToast(
                            message.author.username,
                            name,
                            avatarUrl,
                            () => {
                                NavigationRouter.transitionTo(
                                    `/channels/${message.guild_id ?? "@me"}/${message.channel_id
                                    }/${message.id}`,
                                );
                            },
                            settingsStore.playSound,
                            settingsStore.volume,
                        );

                        await addLog({
                            id: message.id,
                            timestamp: Date.now(),
                            content: message.content,
                            user: message.author.username,
                            avatar: avatarUrl,
                            channelId: message.channel_id,
                            guildId: message.guild_id,
                        });

                        break;
                    }
                }
            })();
        });
    },

    stop() {
        unsub?.();
        document.getElementById("watchdog-toast-container")?.remove();
    },
});
