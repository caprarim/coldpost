import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

export type Pick = { key: string; video: string; thumb: string | null };

function folder(name: string) {
  const dir = new Directory(Paths.document, name);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export async function pickVideos(): Promise<Pick[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsMultipleSelection: true,
    orderedSelection: true,
    selectionLimit: 30,
    quality: 1,
  });
  if (result.canceled) return [];
  return Promise.all(
    result.assets.map(async (asset, i) => ({
      key: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      video: asset.uri,
      thumb: await thumbnail(asset.uri),
    })),
  );
}

async function thumbnail(uri: string) {
  try {
    const shot = await VideoThumbnails.getThumbnailAsync(uri, { time: 600, quality: 0.5 });
    return shot.uri;
  } catch {
    return null;
  }
}

export async function keep(uri: string | null, kind: 'videos' | 'thumbs', id: string) {
  if (!uri) return null;
  const source = new File(uri);
  const ext = source.extension || (kind === 'videos' ? '.mp4' : '.jpg');
  const target = new File(folder(kind), `${id}${ext}`);
  try {
    await source.move(target);
  } catch {
    await source.copy(target);
  }
  return target.uri;
}

export function discard(uri: string | null) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {}
}

export function fileExists(uri: string | null) {
  if (!uri) return false;
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}
