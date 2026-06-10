/** Portal-only Jitsi settings — lightweight defaults, full classroom features. */
export const TRANSIT_CLASSROOM_BRAND = {
  primary: "#0B3D91",
  accent: "#FFC107",
  surface: "#252423",
  panel: "#292828",
  live: "#C4314B",
} as const;

/** Poll chat only when the chat tab is open (seconds). */
export const CHAT_POLL_MS = 6000;
/** Poll raised hands only for lecturers on that tab (seconds). */
export const HAND_POLL_MS = 8000;

export function buildJitsiConfig(displayName: string, isModerator: boolean) {
  return {
    configOverwrite: {
      prejoinPageEnabled: false,
      enableWelcomePage: false,
      disableDeepLinking: true,
      disableInviteFunctions: true,
      hideConferenceSubject: true,
      disableProfile: true,
      enableClosePage: false,
      disableThirdPartyRequests: true,
      enableLobbyChat: false,
      enableLobby: false,
      lobby: { autoKnock: false, enableChat: false },
      requireDisplayName: false,
      enableInsecureRoomNameWarning: false,
      disableJoinLeaveSounds: true,
      startWithAudioMuted: !isModerator,
      startWithVideoMuted: !isModerator,
      startAudioOnly: false,
      readOnlyName: true,
      defaultLanguage: "en",
      toolbarButtons: [] as string[],
      notifications: [] as string[],
      gravatar: { disabled: true },
      disableRemoteMute: !isModerator,
      subject: "Transit Virtual Classroom",

      // Voice — echo cancel, noise suppression, talk detection
      enableNoisyMicDetection: true,
      enableTalkWhileMuted: true,
      disableAudioLevels: false,

      // Show all participants — lecturer + students see each other
      channelLastN: -1,
      maxFullResolutionParticipants: 4,
      disableTileView: false,
      filmstrip: { disableStageFilmstrip: false },
      resolution: 480,
      constraints: {
        video: {
          height: { ideal: 480, max: 720, min: 240 },
          frameRate: { ideal: 24, max: 30 },
        },
      },
      enableLayerSuspension: true,
      disableSimulcast: false,

      // Screen share (lecturer) — capped frame rate saves CPU
      desktopSharingFrameRate: { min: 5, max: 15 },
      desktopSharingSources: isModerator ? ["screen", "window"] : [],

      // Disable heavy unused features
      fileRecordingsEnabled: false,
      liveStreamingEnabled: false,
      transcribingEnabled: false,
      recordingService: { enabled: false },
      enableEmailInStats: false,

      // Route all participants through Jitsi bridge for reliable multi-party video
      p2p: { enabled: false },
    },
    interfaceConfigOverwrite: {
      TOOLBAR_BUTTONS: [] as string[],
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      SHOW_BRAND_WATERMARK: false,
      SHOW_POWERED_BY: false,
      DISPLAY_WELCOME_PAGE_CONTENT: false,
      MOBILE_APP_PROMO: false,
      HIDE_INVITE_MORE_HEADER: true,
      SHOW_CHROME_EXTENSION_BANNER: false,
      DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
      DEFAULT_BACKGROUND: TRANSIT_CLASSROOM_BRAND.surface,
      APP_NAME: "Transit Classroom",
      NATIVE_APP_NAME: "Transit Classroom",
      PROVIDER_NAME: "Transit E-Learning",
      VERTICAL_FILMSTRIP: true,
      FILM_STRIP_MAX_HEIGHT: 96,
      SETTINGS_SECTIONS: [] as string[],
      TOOLBAR_ALWAYS_VISIBLE: false,
      DISABLE_VIDEO_BACKGROUND: true,
    },
    userInfo: { displayName },
  };
}
