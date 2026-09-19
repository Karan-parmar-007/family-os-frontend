import { apiFetch } from '../client'
import type {
  PersonalSavingsFlagRequest,
  PersonalSavingsFlagResponse,
  SavingsLedgerListResponse,
} from '../types'

export const savingsApi = {
  listFamilyLedger(familyId: string, page = 1, pageSize = 20) {
    return apiFetch<SavingsLedgerListResponse>(
      `/api/familyos/families/${familyId}/savings/ledger`,
      { params: { page, page_size: pageSize } },
    )
  },

  toggleKeepInFamilyOnly(familyId: string, body: PersonalSavingsFlagRequest) {
    return apiFetch<PersonalSavingsFlagResponse>(
      `/api/familyos/families/${familyId}/personal-total-savings/flag`,
      { method: 'PATCH', json: body },
    )
  },
}
