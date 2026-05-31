import { store } from '../store';

export async function listAuditLogs(actorId?: string) {
  return store.listAuditLogs(actorId);
}
