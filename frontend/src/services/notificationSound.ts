import notificationSound from "../assets/media/sound.mp3";

let notificationAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;

function getNotificationAudio(): HTMLAudioElement {
  if (!notificationAudio) {
    notificationAudio = new Audio(notificationSound);
    notificationAudio.preload = "auto";
    notificationAudio.volume = 0.6;
  }

  return notificationAudio;
}

/**
 * Unlock audio after the user interacts with the application.
 */
export function initializeNotificationSound(): void {
  if (audioUnlocked) {
    return;
  }

  const audio = getNotificationAudio();

  audio.muted = true;

  void audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      audioUnlocked = true;
    })
    .catch(() => {
      // Browser still doesn't allow audio.
      // Another user interaction can try again.
    });
}

/**
 * Play the notification sound.
 */
export function playNotificationSound(): void {
  const audio = getNotificationAudio();

  audio.currentTime = 0;
  audio.muted = false;

  void audio.play().catch((error: unknown) => {
    console.warn(
      "Unable to play notification sound:",
      error,
    );
  });
}
