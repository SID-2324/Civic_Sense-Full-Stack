import { randomUUID } from 'crypto';
import { AuthUser, ExposureAnswers, ThreatAnswers } from '../domain';
import { store } from '../store';
import { assessThreat, buildSafetyPlan, scoreExposure } from '../utils/risk';

export async function activateEmergencyMode(user: AuthUser, input: { reason?: string; exposureAnswers: ExposureAnswers; threatAnswers: ThreatAnswers; caseId?: string }) {
  const exposure = scoreExposure(input.exposureAnswers);
  const threat = assessThreat(input.threatAnswers);
  const riskScore = Math.max(exposure.score, threat.score);
  const caseId = input.caseId || `CASE-${randomUUID().slice(0, 8).toUpperCase()}`;

  const profile = await store.upsertEmergencyProfile({
    user_id: user.id,
    status: 'active',
    risk_score: riskScore,
    threat_level: threat.level,
    exposure_score: exposure.score,
    case_id: caseId,
    active: true
  });

  const plan = buildSafetyPlan({ exposure, threat });

  await store.addAuditLog({
    actor_id: user.id,
    actor_role: user.role,
    action: 'Emergency Activated',
    entity_type: 'emergency_profiles',
    entity_id: profile.id,
    metadata: {
      caseId,
      reason: input.reason || null,
      riskScore,
      exposureScore: exposure.score,
      threatScore: threat.score
    }
  });

  return {
    profile,
    caseId,
    exposure,
    threat,
    plan
  };
}

export async function getEmergencySnapshot(userId: string) {
  return store.getEmergencyProfile(userId);
}
