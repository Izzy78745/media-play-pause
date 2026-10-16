/// <reference path="./types/plugin.d.ts" />
/// <reference path="./types/system.d.ts" />
/// <reference path="./types/app.d.ts" />
/// <reference path="./types/core.d.ts" />

interface MediaKeyEvent {
    key?: string;
    code?: string;
    repeat?: boolean;
}

function init(): void {
    $ui.register((ctx) => {
        function getMediaAction(event: MediaKeyEvent): string | null {
            const { key, code } = event;

            if (
                key === "MediaPlayPause" ||
                key === "PlayPause" ||
                code === "MediaPlayPause" ||
                code === "PlayPause"
            ) {
                return "toggle";
            }

            if (key === "MediaPlay" || code === "MediaPlay") return "play";
            if (key === "MediaPause" || code === "MediaPause") return "pause";
            return null;
        }

        ctx.dom.onReady(() => {
            // Attach a keydown listener to the body to handle media key events
            ctx.dom.queryOne("body").then((body) => {
                if (!body) {
                    ctx.toast.error("Could not find the page body");
                    return;
                }

                body.addEventListener("keydown", (event) => {
                    const action = getMediaAction(event);
                    if (!action || event.repeat) return;

                    try {
                        const status = ctx.videoCore.getPlaybackStatus();
                        if (!status?.id || !status.clientId || typeof status.paused !== "boolean") {
                            ctx.toast.warning("No active video playback found");
                            return;
                        }

                        const shouldPause = action === "pause" || (action === "toggle" && !status.paused);

                        if (shouldPause && !status.paused)
                            ctx.videoCore.pause();
                        else if (!shouldPause && status.paused)
                            ctx.videoCore.resume();

                    } catch (error) {
                        const message = `Media key playback control failed: ${String(error)}`;
                        ctx.toast.error(message);
                        console.error("Media Key Play/Pause: ", message);
                    }
                });
            }).catch((error: unknown) => {
                const message = `Could not attach the key listener: ${String(error)}`;
                ctx.toast.error(message);
                console.error("Media Key Play/Pause: ", message);
            });
        });
    });
}
