import * as Haptics from 'expo-haptics';

export async function triggerStudentAction() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
