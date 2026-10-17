/// <reference path="./types/plugin.d.ts" />
/// <reference path="./types/system.d.ts" />
/// <reference path="./types/app.d.ts" />
/// <reference path="./types/core.d.ts" />

function init(): void {
    \$ui.register((ctx) => {
        
        function handlePlayback(action: "toggle" | "play" | "pause") {
            try {
                const status = ctx.videoCore.getPlaybackStatus();
                if (!status?.id || !status.clientId || typeof status.paused !== "boolean") {
                    ctx.toast.warning("No active video playback found");
                    return;
                }

                const shouldPause = action === "pause" || (action === "toggle" && !status.paused);

                if (shouldPause && !status.paused) {
                    ctx.videoCore.pause();
                    updateMediaSessionState(true);
                } else if (!shouldPause && status.paused) {
                    ctx.videoCore.resume();
                    updateMediaSessionState(false);
                }
            } catch (error) {
                const message = `Media key playback control failed: ${String(error)}`;
                ctx.toast.error(message);
                console.error("Media Key Play/Pause: ", message);
            }
        }

        function updateMediaSessionState(isPaused: boolean) {
            if ("mediaSession" in navigator) {
                navigator.mediaSession.playbackState = isPaused ? "paused" : "playing";
            }
        }

        ctx.dom.onReady(() => {
            // 1. Keyboard event listener fallback
            ctx.dom.queryOne("body").then((body) => {
                if (!body) return;
                body.addEventListener("keydown", (event) => {
                    const { key, code } = event;
                    if (event.repeat) return;

                    if (key === "MediaPlayPause" || key === "PlayPause" || code === "MediaPlayPause" || code === "MediaPlayPause" || key === "Pause") {
                        handlePlayback("toggle");
                    } else if (key === "MediaPlay" || code === "MediaPlay") {
                        handlePlayback("play");
                    } else if (key === "MediaPause" || code === "MediaPause") {
                        handlePlayback("pause");
                    }
                });
            }).catch((error: unknown) => {
                console.error("Media Key Play/Pause keyboard fallback init failed: ", error);
            });

            // 2. Browser Media Session listeners (Fixes OS-level mouse hardware commands)
            if ("mediaSession" in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: "App Stream",
                    artist: "Streaming Core"
                });

                navigator.mediaSession.setActionHandler("play", () => {
                    handlePlayback("play");
                });
                navigator.mediaSession.setActionHandler("pause", () => {
                    handlePlayback("pause");
                });
                
                try {
                    const currentStatus = ctx.videoCore.getPlaybackStatus();
                    if (currentStatus && typeof currentStatus.paused === "boolean") {
                        updateMediaSessionState(currentStatus.paused);
                    }
                } catch (e) {
                    // Core might not be ready yet
                }
            }
        });
    });
}
