
export const createYouTubePlayer = (containerId, videoId, callbacks) => {
    return new YT.Player(containerId, {
        height: "100%",
        width: "100%",
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          playsinline: 1,
          controls: 1,
          rel: 0,
          enablejsapi: 1,
        },
        events: callbacks
    });
};
