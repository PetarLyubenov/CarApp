/**
 * Take one photo with the phone's camera.
 * Used by the quick camera button and by the photo picker in the forms.
 */
import * as ImagePicker from 'expo-image-picker';

import type { LocalPhoto } from '@/services/photos';

/**
 * Asks for camera permission (the system dialog appears only the first time), then opens the camera.
 * Returns the photo, `null` if the user closed the camera, or 'denied' without permission.
 */
export async function takePhoto(): Promise<LocalPhoto | null | 'denied'> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return 'denied';

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true, // lets the user crop the shot
    aspect: [4, 3],
    quality: 1, // compressed later, when uploading
  });
  if (result.canceled) return null;
  const { uri, width } = result.assets[0];
  return { uri, width };
}
