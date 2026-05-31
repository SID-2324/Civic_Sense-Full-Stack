import { ExposureAnswers, ThreatAnswers } from '../domain';
import { assessThreat, buildSafetyPlan, scoreExposure } from '../utils/risk';

export function runExposureAssessment(answers: ExposureAnswers) {
  return scoreExposure(answers);
}

export function runThreatAssessment(answers: ThreatAnswers) {
  return assessThreat(answers);
}

export function generateSafetyPlan(exposureAnswers: ExposureAnswers, threatAnswers: ThreatAnswers) {
  const exposure = scoreExposure(exposureAnswers);
  const threat = assessThreat(threatAnswers);
  return {
    exposure,
    threat,
    plan: buildSafetyPlan({ exposure, threat })
  };
}
