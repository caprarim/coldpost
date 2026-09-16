import * as Clipboard from 'expo-clipboard';
import { File } from 'expo-file-system';
import TiktokShare from '../../modules/tiktok-share';

export async function copyCaption(caption: string) {
  if (caption) await Clipboard.setStringAsync(caption);
}

export async function openInTikTok(video: string, caption: string) {
  await copyCaption(caption);
  const file = new File(video);
  if (!file.exists) throw new Error('missing');
  const mime = file.type && file.type.startsWith('video/') ? file.type : 'video/mp4';
  return TiktokShare.share(file.contentUri, mime);
}
