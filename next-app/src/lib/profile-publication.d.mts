export const MIN_PROFILE_PHOTOS: number
export function canPublishProfile(photoCount: number): boolean
export function getMissingProfilePhotos(photoCount: number): number
export function canRemoveProfilePhoto(status: string, currentPhotoCount: number): boolean
export function isPublicProfileStatus(status: string): boolean
