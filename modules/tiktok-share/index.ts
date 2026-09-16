import { requireNativeModule } from 'expo';

type TiktokShareModule = {
  share(contentUri: string, mimeType: string): 'tiktok' | 'chooser';
};

export default requireNativeModule<TiktokShareModule>('TiktokShare');
