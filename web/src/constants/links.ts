/**
 * APK Download URL Constants
 *
 * Method 1 (Expo Link): Use the direct artifact URL from EAS Build (expires in 30 days)
 * or the build details page URL.
 *
 * Method 2 (Manual Host): Download the APK and place it in the 'public/downloads'
 * folder of the web project, then use an absolute path like '/downloads/radio-quiz.apk'.
 */

// TODO: Replace with your actual EAS build link for Method 1
export const APK_DOWNLOAD_URL = "https://expo.dev/artifacts/eas/placeholder-link.apk";

// For Method 2, use:
// export const APK_DOWNLOAD_URL = "/downloads/radio-quiz-v1.0.apk";
