"use client";

/**
 * Thin controller surface for audio preview lifecycle.
 * Logic lives in hooks/useAudioPreview + AudioPreviewProvider.
 */
export {
  AudioPreviewProvider,
  useAudioPreviewContext as useAudioPreviewController,
} from "@/components/providers/AudioPreviewProvider";
