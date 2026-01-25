
/**
 * Utility service for handling the raw PCM audio returned by Gemini TTS
 */

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class SpiritAudioPlayer {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private isPlaying: boolean = false;

  async play(base64Data: string): Promise<void> {
    if (this.source) {
      this.stop();
    }

    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const audioBytes = decodeBase64(base64Data);
    const audioBuffer = await decodeAudioData(audioBytes, this.context, 24000, 1);

    this.source = this.context.createBufferSource();
    this.source.buffer = audioBuffer;
    this.source.connect(this.context.destination);
    
    this.source.onended = () => {
      this.isPlaying = false;
    };

    this.source.start(0);
    this.isPlaying = true;
  }

  stop() {
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
        // Source might already be stopped
      }
      this.source = null;
    }
    this.isPlaying = false;
  }

  get currentlyPlaying() {
    return this.isPlaying;
  }
}

export const audioPlayer = new SpiritAudioPlayer();
