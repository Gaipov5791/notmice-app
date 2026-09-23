import { LIFESTYLE_KNOWLEDGE_BASE } from '../../../data/lifestyleInterventions';
import { isLifestyleId, LIFESTYLE_IDS, type LifestyleCopy } from '../../lifestyleIds';

export function buildEnglishLifestyle(): LifestyleCopy {
  const copy = {} as LifestyleCopy;
  for (const bucket of Object.values(LIFESTYLE_KNOWLEDGE_BASE)) {
    const items = [
      ...bucket.highRiskRecommendations,
      ...bucket.moderateRiskRecommendations,
      ...bucket.optimalRecommendations,
    ];
    for (const item of items) {
      if (!isLifestyleId(item.id)) {
        throw new Error(`Lifestyle id missing from LIFESTYLE_IDS: ${item.id}`);
      }
      copy[item.id] = {
        title: item.title,
        clinicalMechanism: item.clinicalMechanism,
        actionProtocol: [...item.actionProtocol],
        targetGoal: item.targetGoal,
        ...(item.contraindicationsOrNotes ? { note: item.contraindicationsOrNotes } : {}),
      };
    }
  }
  for (const id of LIFESTYLE_IDS) {
    if (!copy[id]) {
      throw new Error(`English lifestyle copy missing id: ${id}`);
    }
  }
  return copy;
}
