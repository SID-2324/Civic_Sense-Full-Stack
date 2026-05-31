import { ExposureAnswers, ThreatAnswers, ThreatLevel } from '../domain';

export interface ExposureScoreResult {
  score: number;
  level: ThreatLevel;
  checklist: string[];
}

export interface ThreatScoreResult {
  score: number;
  level: ThreatLevel;
  checklist: string[];
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function scoreToLevel(score: number): ThreatLevel {
  if (score >= 85) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function scoreExposure(answers: ExposureAnswers): ExposureScoreResult {
  const weights: Record<keyof ExposureAnswers, number> = {
    publicInstagram: 20,
    locationSharing: 25,
    publicEmail: 10,
    strangersFollow: 15,
    sharedAddress: 20,
    sharedPhone: 10
  };

  const score = clampScore(
    (answers.publicInstagram ? weights.publicInstagram : 0) +
      (answers.locationSharing ? weights.locationSharing : 0) +
      (answers.publicEmail ? weights.publicEmail : 0) +
      (answers.strangersFollow ? weights.strangersFollow : 0) +
      (answers.sharedAddress ? weights.sharedAddress : 0) +
      (answers.sharedPhone ? weights.sharedPhone : 0)
  );

  return {
    score,
    level: scoreToLevel(score),
    checklist: buildExposureChecklist(answers)
  };
}

export function assessThreat(answers: ThreatAnswers): ThreatScoreResult {
  const weights: Record<keyof ThreatAnswers, number> = {
    knowsAddress: 20,
    knowsPhone: 10,
    directThreats: 35,
    stalking: 25,
    violenceHistory: 30
  };

  const score = clampScore(
    (answers.knowsAddress ? weights.knowsAddress : 0) +
      (answers.knowsPhone ? weights.knowsPhone : 0) +
      (answers.directThreats ? weights.directThreats : 0) +
      (answers.stalking ? weights.stalking : 0) +
      (answers.violenceHistory ? weights.violenceHistory : 0)
  );

  return {
    score,
    level: scoreToLevel(score),
    checklist: buildThreatChecklist(answers)
  };
}

function buildExposureChecklist(answers: ExposureAnswers): string[] {
  const checklist: string[] = ['Set social accounts to private'];

  if (answers.publicInstagram) checklist.push('Review Instagram followers and remove unknown accounts');
  if (answers.locationSharing) checklist.push('Disable live location sharing and background location permissions');
  if (answers.publicEmail) checklist.push('Create a private recovery email and remove public contact details');
  if (answers.strangersFollow) checklist.push('Block suspicious accounts and review privacy settings');
  if (answers.sharedAddress) checklist.push('Remove public address listings and delivery notes');
  if (answers.sharedPhone) checklist.push('Replace public phone numbers with a forwarding number');

  return checklist;
}

function buildThreatChecklist(answers: ThreatAnswers): string[] {
  const checklist: string[] = ['Save recent messages and screenshots'];

  if (answers.directThreats) checklist.push('Preserve direct threats in the evidence vault');
  if (answers.stalking) checklist.push('Document times, places, and patterns of contact');
  if (answers.knowsAddress) checklist.push('Review home safety and share a safety plan with trusted contacts');
  if (answers.knowsPhone) checklist.push('Consider replacing the number used for public contact');
  if (answers.violenceHistory) checklist.push('Escalate monitoring and contact emergency services if risk becomes immediate');

  return checklist;
}

export function buildSafetyPlan(input: {
  exposure: ExposureScoreResult;
  threat: ThreatScoreResult;
}): string[] {
  const steps = new Set<string>([
    'Make social profiles private',
    'Change passwords for critical accounts',
    'Enable two-factor authentication',
    'Collect evidence and store it securely'
  ]);

  for (const item of input.exposure.checklist) steps.add(item);
  for (const item of input.threat.checklist) steps.add(item);

  if (input.threat.level === 'high' || input.threat.level === 'critical') {
    steps.add('Share your case summary with a trusted person');
    steps.add('Reduce location visibility across all devices');
  }

  if (input.exposure.level === 'critical') {
    steps.add('Review every public profile and archive old posts');
  }

  return Array.from(steps);
}
