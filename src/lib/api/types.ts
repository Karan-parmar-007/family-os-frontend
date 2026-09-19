/**
 * Shared API DTOs — aligned with the FastAPI backend schemas.
 */

export interface MessageResponse {
  message: string
}

export interface ValidationErrorItem {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface HTTPValidationError {
  detail?: ValidationErrorItem[]
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export interface SignupRequest {
  email: string
  password: string
  name: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ForgetPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface InviteMemberRequest {
  email: string
  family_id: string
}

export interface AccountSetupRequest {
  email: string
  token: string
  name: string
  password: string
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export interface UserMeResponse {
  id: string
  email: string
  name: string
  is_active: boolean
  is_email_verified: boolean
  is_super_admin: boolean
  preferred_currency: string
  personal_currency: string
  friend_code?: string
  created_at: string
}

export interface UserMeUpdate {
  name?: string
  preferred_currency?: string
  personal_currency?: string
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

export interface RequestEmailChange {
  new_email: string
  current_password: string
}

export interface VerifyEmailChangeOtp {
  new_email: string
  otp: string
}

/* ------------------------------------------------------------------ */
/* Families                                                            */
/* ------------------------------------------------------------------ */

export interface FamilySummary {
  id: string
  name: string
  currency: string
  timezone?: string
  is_manager: boolean
  isManager?: boolean
  membershipCode?: string
  linkCode?: string
  created_at: string
}

export interface FamilyListResponse {
  items: FamilySummary[]
  membershipCount?: number
  maxFamilyMemberships?: number
}

export interface FamilyCreateRequest {
  name: string
  currency?: string
  timezone?: string
  originAmount: number
}
export interface FamilyJoinRequestItem {
  id: string
  familyId: string
  userId: string
  userName: string
  userEmail: string
  status: string
  createdAt: string
}

export interface FamilyJoinRequestListResponse {
  items: FamilyJoinRequestItem[]
}

export interface FamilyJoinRequestActionResponse {
  message: string
  id: string
  status: string
}

export interface FamilyInviteResponse {
  id: string
  familyId: string
  email: string
  token: string
  status: string
  expiresAt: string
  createdAt: string
}


export interface FamilyCreateResponse {
  message: string
  id: string
  name: string
}

export interface FamilyMember {
  id: string
  email: string
  name: string
  isFamilyManager: boolean
  joinedAt: string
}

export interface FamilyMemberListResponse {
  items: FamilyMember[]
}

export interface FamilyTotalSavingsResponse {
  familyId: string
  totalSavings: number | null
}

export interface PersonalTotalSavingsResponse {
  familyId: string
  userId: string
  totalSavings: number | null
  keepInFamilyOnly?: boolean | null
}

export interface FamilyTotalSavingsCreateRequest {
  total_savings: number
}

export interface PersonalTotalSavingsCreateRequest {
  total_savings: number
}

export interface FamilyTotalSavingsUpdateRequest {
  amount: number
}

export interface PersonalTotalSavingsUpdateRequest {
  amount: number
}

export interface FamilyTotalSavingsUpdateResponse {
  message: string
  total_savings: number
}

export interface PersonalTotalSavingsUpdateResponse {
  message: string
  total_savings: number
}

export interface FamilyUpdateRequest {
  name?: string
  currency?: string
}

export interface FamilyUpdateResponse {
  id: string
  name: string
  currency: string
}

/* ------------------------------------------------------------------ */
/* Income — Recurring                                                  */
/* ------------------------------------------------------------------ */

export interface FamilyRecurringIncomeSummary {
  id: string
  recurring_income_id: string
  split_name: string
  amount: number
  received_every: string | null
  repeat_interval_days: number | null
  repeat_interval_months: number | null
  repeat_interval_years: number | null
  next_receiving_date: string | null
  earned_by_user_id: string
  display_amount: number
}

export interface RecurringIncomeFamilySplitDetail {
  family_id: string
  family_name: string | null
  split_name: string
  amount: number
}

export interface RecurringIncomePersonalSplitDetail {
  user_id: string
  amount: number
}

export interface RecurringIncomeDetail {
  id: string
  user_id: string
  income_name: string
  total_amount: number
  personal_savings_amount: number | null
  received_every: string | null
  repeat_interval_days: number | null
  repeat_interval_months: number | null
  repeat_interval_years: number | null
  next_receiving_date: string | null
  document_id: string | null
  show_docs_to_all: boolean
  repeat_doc_with_logs: boolean
  is_family_managed: boolean
  let_everyone_edit: boolean
  doc_viewer_user_ids: string[]
  family_splits: RecurringIncomeFamilySplitDetail[]
  personal_splits?: RecurringIncomePersonalSplitDetail[]
  can_edit?: boolean | null
  category_id?: string | null
  created_at: string
  updated_at: string
}

export interface FamilyRecurringIncomeDetail extends RecurringIncomeDetail {
  family_id?: string
  amount_to_be_added_to_family?: number
  personal_savings_user_id?: string | null
  earned_by_user_id?: string | null
  added_by_user_id?: string
}

export interface FamilyRecurringIncomeSummaryListResponse {
  items: FamilyRecurringIncomeSummary[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface FamilyRecurringIncomeMineListResponse {
  items: FamilyRecurringIncomeDetail[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface FamilyRecurringIncomeCreateResponse {
  message: string
  income_id: string
  document_id: string | null
}

export interface FamilyRecurringIncomeUpdateResponse {
  message: string
  income_id: string
  document_id: string | null
}

/* ------------------------------------------------------------------ */
/* Income — Logs                                                       */
/* ------------------------------------------------------------------ */

export interface FamilyIncomeLogListItem {
  id: string
  income_name: string
  source_type: string
  income_date: string
  added_by_user_id: string
  total_amount: number
  family_amount: number | null
  personal_savings_amount: number | null
  personal_savings_user_id: string | null
  earned_by_user_name: string | null
  earned_by_user_id: string | null
  document_id: string | null
  show_doc_to_all: boolean
  doc_viewer_user_ids: string[]
  can_edit: boolean
  family_id?: string | null
  family_name?: string | null
  hasBreakdown?: boolean
  category_id?: string | null
  category_name?: string | null
  entry_done_by?: string | null
}

export interface FamilyIncomeLogListResponse {
  items: FamilyIncomeLogListItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface FamilyIncomeLogDetailResponse {
  id: string
  family_id: string
  logged_by: string
  income_name: string
  total_amount: number
  family_amount: number | null
  income_date: string
  source_type: string
  source_id: string | null
  personal_savings_amount: number | null
  personal_savings_user_id: string | null
  earned_by_user_id: string | null
  document_id: string | null
  added_by_user_id: string
  show_doc_to_all: boolean
  show_funding_to_family?: boolean
  doc_viewer_user_ids: string[]
  created_at: string
  updated_at: string
  category_id: string | null
  entry_done_by?: string | null
}

export interface FamilyIncomeLogCreateResponse {
  message: string
  log_id: string
  family_savings_updated: number
  personal_savings_updated: number | null
  personal_savings_user_id: string | null
}

export interface FamilyIncomeLogUpdateResponse {
  message: string
  log_id: string
  family_savings_updated: number
  personal_savings_updated: number | null
  personal_savings_user_id: string | null
}

export interface IncomeLogsFilters {
  page?: number
  page_size?: number
  start_date?: string
  end_date?: string
  earned_by_user_id?: string
  category_id?: string
}

export interface PersonalIncomeLogListItem {
  id: string
  income_name: string
  amount: number
  income_date: string
  source_type: string
  family_id: string | null
  family_name: string | null
  family_income_log_id: string | null
  document_id: string | null
  show_doc_to_all: boolean
  can_edit: boolean
  category_id?: string | null
  category_name?: string | null
}

export interface PersonalIncomeLogListResponse {
  items: PersonalIncomeLogListItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PersonalIncomeLogDetailResponse {
  id: string
  family_id: string | null
  user_id: string
  logged_by: string
  income_name: string
  amount: number
  income_date: string
  source_type: string
  source_id: string | null
  family_income_log_id: string | null
  family_amount: number | null
  document_id: string | null
  show_doc_to_all: boolean
  can_edit: boolean
  category_id?: string | null
  category_name?: string | null
  created_at: string
  updated_at: string
}

export interface PersonalIncomeLogCreateResponse {
  message: string
  log_id: string
  personal_savings_updated: number
}

export interface PersonalIncomeLogUpdateResponse {
  message: string
  log_id: string
  personal_savings_delta: number
}

/* ------------------------------------------------------------------ */
/* Expense — Recurring                                                   */
/* ------------------------------------------------------------------ */

export interface FamilyRecurringExpenseSummary {
  id: string
  recurring_expense_id: string
  split_name: string
  amount: number
  paid_every: string | null
  repeat_interval_days: number | null
  repeat_interval_months: number | null
  repeat_interval_years: number | null
  next_payment_date: string | null
  paid_by_user_id: string
  display_amount: number
}

export interface RecurringExpenseFamilySplitDetail {
  family_id: string
  family_name: string | null
  split_name: string
  amount: number
}

export interface RecurringExpensePersonalSplitDetail {
  user_id: string
  amount: number
}

export interface RecurringExpenseDetail {
  id: string
  user_id: string
  expense_name: string
  total_amount: number
  personal_savings_amount: number | null
  paid_every: string | null
  repeat_interval_days: number | null
  repeat_interval_months: number | null
  repeat_interval_years: number | null
  next_payment_date: string | null
  document_id: string | null
  show_docs_to_all: boolean
  repeat_doc_with_logs: boolean
  is_family_managed: boolean
  let_everyone_edit: boolean
  doc_viewer_user_ids: string[]
  family_splits: RecurringExpenseFamilySplitDetail[]
  personal_splits?: RecurringExpensePersonalSplitDetail[]
  can_edit?: boolean | null
  category_id?: string | null
  created_at: string
  updated_at: string
}

export interface FamilyRecurringExpenseDetail extends RecurringExpenseDetail {}

export interface FamilyRecurringExpenseSummaryListResponse {
  items: FamilyRecurringExpenseSummary[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface FamilyRecurringExpenseMineListResponse {
  items: FamilyRecurringExpenseDetail[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface FamilyRecurringExpenseCreateResponse {
  message: string
  expense_id: string
  document_id: string | null
}

export interface FamilyRecurringExpenseUpdateResponse {
  message: string
  expense_id: string
  document_id: string | null
}

export interface FamilyExpenseLogListItem {
  id: string
  expense_name: string
  source_type: string
  expense_date: string
  added_by_user_id: string
  total_amount: number
  family_amount: number | null
  personal_savings_amount: number | null
  personal_savings_user_id: string | null
  logged_by_user_name: string | null
  logged_by_user_id: string | null
  document_id: string | null
  show_doc_to_all: boolean
  doc_viewer_user_ids: string[]
  can_edit: boolean
  family_id?: string | null
  family_name?: string | null
  hasBreakdown?: boolean
  category_id?: string | null
  category_name?: string | null
  expense_made_for_user_id?: string | null
  entry_done_by?: string | null
}

export interface FamilyExpenseLogListResponse {
  items: FamilyExpenseLogListItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface FamilyExpenseLogDetailResponse {
  id: string
  family_id: string
  logged_by: string
  expense_name: string
  total_amount: number
  family_amount: number | null
  expense_date: string
  source_type: string
  source_id: string | null
  personal_savings_amount: number | null
  personal_savings_user_id: string | null
  document_id: string | null
  added_by_user_id: string
  show_doc_to_all: boolean
  show_funding_to_family?: boolean
  doc_viewer_user_ids: string[]
  created_at: string
  updated_at: string
  category_id?: string | null
  expense_made_for_user_id?: string | null
  entry_done_by?: string | null
}

export interface FamilyExpenseLogCreateResponse {
  message: string
  log_id: string
  family_savings_updated: number
  personal_savings_updated: number | null
  personal_savings_user_id: string | null
}

export interface FamilyExpenseLogUpdateResponse {
  message: string
  log_id: string
  family_savings_updated: number
  personal_savings_updated: number | null
  personal_savings_user_id: string | null
}

export interface ExpenseLogsFilters {
  page?: number
  page_size?: number
  start_date?: string
  end_date?: string
  logged_by_user_id?: string
  category_id?: string
}

export interface PersonalExpenseLogListItem {
  id: string
  expense_name: string
  amount: number
  expense_date: string
  source_type: string
  family_id: string | null
  family_name: string | null
  family_expense_log_id: string | null
  document_id: string | null
  show_doc_to_all: boolean
  can_edit: boolean
  category_id?: string | null
  category_name?: string | null
}

export interface PersonalExpenseLogListResponse {
  items: PersonalExpenseLogListItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PersonalExpenseLogDetailResponse {
  id: string
  family_id: string | null
  user_id: string
  logged_by: string
  expense_name: string
  amount: number
  expense_date: string
  source_type: string
  source_id: string | null
  family_expense_log_id: string | null
  family_amount: number | null
  document_id: string | null
  show_doc_to_all: boolean
  can_edit: boolean
  category_id?: string | null
  category_name?: string | null
  created_at: string
  updated_at: string
}

export interface PersonalExpenseLogCreateResponse {
  message: string
  log_id: string
  personal_savings_updated: number
}

export interface PersonalExpenseLogUpdateResponse {
  message: string
  log_id: string
  personal_savings_delta: number
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

export interface DocumentInfo {
  id: string
  filename: string | null
  file_path: string | null
}

export interface GetDocumentResponse {
  document: DocumentInfo
}

/* ------------------------------------------------------------------ */
/* Family System V2 — scope, sub-families, expenses, debts, notifications */
/* ------------------------------------------------------------------ */

export interface PaginatedMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SubFamilySummary {
  id: string
  familyId: string
  parentSubFamilyId: string | null
  depth: number
  name: string
  description: string | null
  visibility: string
  memberCount: number
  isMember: boolean
  myRole: string | null
  createdAt: string
}

export interface SubFamilyListResponse {
  items: SubFamilySummary[]
}

export interface SubFamilyTreeNode extends SubFamilySummary {
  children: SubFamilyTreeNode[]
}

export interface SubFamilyTreeResponse {
  items: SubFamilyTreeNode[]
}

export interface SubFamilyDetailResponse extends SubFamilySummary {
  autoTransferEnabled?: boolean
  autoTransferAmount?: number | null
  autoTransferEvery?: string | null
}

export interface SubFamilyCreateRequest {
  name: string
  description?: string
  visibility?: string
  parentSubFamilyId?: string
  initialMemberIds?: string[]
}

export interface ExpenseLog {
  id: string
  familyId: string
  scopeType: string
  subFamilyId: string | null
  loggedBy: string
  expenseName: string
  amount: number
  expenseDate: string
  isPersonal: boolean
  userId?: string | null
  categoryId?: string | null
  expenseMadeForUserId?: string | null
  addedByUserId?: string | null
  entryDoneBy?: string | null
}

export interface ExpenseLogListResponse extends PaginatedMeta {
  items: ExpenseLog[]
}

export interface ExpenseRecurring extends ExpenseLog {
  isRecurring: boolean
  paidEvery: string | null
  nextPaymentDate: string | null
}

export interface ExpenseRecurringListResponse extends PaginatedMeta {
  items: ExpenseRecurring[]
}

export interface ExpenseCategoryResponse {
  id: string
  familyId: string
  categoryName: string
  createdAt: string
}

export interface ExpenseCategoryListResponse {
  items: ExpenseCategoryResponse[]
}

export interface DebtScopeViewSummary {
  id?: string
  scopeKind: 'PERSONAL' | 'FAMILY'
  familyId?: string | null
  userId?: string | null
  isPrimary?: boolean
  displayName?: string | null
  displayType?: string | null
  displayTotalAmount?: number | string | null
  displayRemainingAmount?: number | string | null
  displayEmiAmount?: number | string | null
  displayInterestRate?: number | null
  isMasked?: boolean
  showBreakdown?: boolean
  accessLevel?: string
}

export type PartPaymentMode =
  | 'REDUCE_EMI'
  | 'REDUCE_TENURE'
  | 'REDUCE_BOTH'
  | 'CLEAR_UPCOMING'
  | 'ADVANCE_INSTALLMENTS'
  | 'FORECLOSURE'

export interface DebtSummary {
  id: string
  familyId: string
  debtName: string
  type: string
  status: string
  totalAmount: number
  remainingAmount: number
  totalPaid?: number
  isPersonal: boolean
  scopeType: string
  userId?: string
  showDocToAll?: boolean
  docViewerUserIds?: string[]
  hasInterest?: boolean
  interestType?: string | null
  interestRate?: number | null
  compoundingFrequency?: string | null
  fixedFeeAmount?: number | null
  hasEmi?: boolean
  emiAmount?: number | null
  emiEvery?: string | null
  emiIntervalDays?: number | null
  emiIntervalMonths?: number | null
  emiIntervalYears?: number | null
  emiNextDate?: string | null
  tenureMonths?: number | null
  documentId?: string | null
  isMasked?: boolean
  showBreakdown?: boolean
  showSplitToFamily?: boolean
  viewId?: string | null
  scopeViews?: DebtScopeViewSummary[]
  debtInTheNameOf?: string
  accessLevel?: string
  allowAutoDefault?: boolean
  startDate?: string | null
  endDate?: string | null
  real?: {
    totalAmount?: number | null
    remainingAmount?: number | null
    emiAmount?: number | null
    interestRate?: number | null
  } | null
  requiresConfirmation?: boolean
  bounceFineAmount?: number
  completedAt?: string | null
  balanceForPartPayment?: number
  splitLines?: Array<{
    poolType: string
    familyId?: string | null
    userId?: string | null
    amount: number | string
    expectedTotal?: number | string | null
    obligationRemaining?: number | string | null
  }>
  myEmiAmount?: number | null
  myObligationRemaining?: number | null
  myExpectedTotal?: number | null
  canContribute?: boolean
  isOwner?: boolean
  canPartPayment?: boolean
}

export interface DebtListResponse extends PaginatedMeta {
  items: DebtSummary[]
}

export interface NotificationMeta {
  jobType?: string
  entityName?: string
  amount?: string
  periodKey?: string
  currentSplit?: Array<{
    poolType: string
    familyId?: string | null
    amount: string
  }>
  incomeSplits?: Array<{
    familyId: string
    familyName: string
    amount: string
  }>
  personalAmount?: string
}

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string | null
  status: string
  allowedActions: string[]
  relatedJobId: string | null
  meta?: NotificationMeta | null
  actionTaken?: string | null
  createdAt: string
}

export interface NotificationListResponse extends PaginatedMeta {
  items: NotificationItem[]
}

export interface UnreadCountResponse {
  count: number
  actionableCount?: number
}

export interface NotificationActionPayload {
  newAmount?: string | null
  splitLines?: Array<{
    poolType: string
    familyId?: string | null
    userId?: string | null
    amount: string
  }> | null
  incomeAllocations?: Array<{ familyId: string; amount: string }> | null
  personalAmount?: string | null
}

export interface NotificationActionRequest {
  action: string
  delayDays?: number
  payload?: NotificationActionPayload | null
}

export interface TransferSummary {
  id: string
  familyId?: string | null
  toFamilyId?: string | null
  toUserId?: string | null
  fromUserId?: string | null
  fromScope: string
  toScope: string
  entityType: string
  amount: number
  status: string
  isRecurring: boolean
  recurringEvery: string | null
  nextRunDate?: string | null
  direction?: string | null
  note?: string | null
  createdBy: string
  createdAt: string
}

export interface FriendshipSummary {
  id: string
  userAId: string
  userBId: string
  requestedBy: string
  status: string
  createdAt: string
  otherUserId?: string | null
  otherUserName?: string | null
  direction?: 'INCOMING' | 'OUTGOING' | 'ACTIVE' | null
}

export interface FriendshipListResponse {
  items: FriendshipSummary[]
}

export interface FriendUserOption {
  id: string
  name: string
}

export interface FriendUserListResponse {
  items: FriendUserOption[]
}

export interface FriendCodeResponse {
  friendCode: string
}

export interface TransferListResponse {
  items: TransferSummary[]
}

export interface FundingSourceInput {
  poolType: 'FAMILY' | 'PERSONAL'
  familyId?: string | null
  userId?: string | null
  amount: number
}

export interface FamilyRelationship {
  id: string
  familyAId: string
  familyBId: string
  relationshipType: string | null
  label: string | null
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REMOVED'
  initiatedByFamilyId: string
  initiatedByUserId: string
  respondedByUserId: string | null
  createdAt: string
  updatedAt: string
}

export interface FamilyRelationshipListResponse {
  items: FamilyRelationship[]
}

export interface FamilyRelationshipCreateRequest {
  target_member_email: string
  relationship_type?: string
  label?: string
}

export interface FamilyJoinCodeResponse {
  joinCode: string
}

export interface FamilyConnectByCodeRequest {
  join_code?: string
  joinCode?: string
  label?: string | null
}

export interface AssetSummary {
  id: string
  familyId: string
  assetName: string
  type: string
  scopeType: string
  subFamilyId: string | null
  value: number
  accessLevel: string
  isPersonal: boolean
  documentId?: string | null
  acquiredOn?: string | null
  notes?: string | null
  inSomeoneName?: string | null
  createdAt: string
}

export interface AssetListResponse extends PaginatedMeta {
  items: AssetSummary[]
  totalValue?: number
}

export interface InsuranceSummary {
  id: string
  familyId: string
  insuranceName: string
  type: string
  provider?: string | null
  policyNumber?: string | null
  premiumAmount: number
  coverageAmount: number
  premiumEvery?: string | null
  nextPremiumDate?: string | null
  scopeType: string
  subFamilyId: string | null
  status: string
  accessLevel: string
  isPersonal: boolean
  documentId?: string | null
  createdAt: string
}

export interface InsuranceListResponse extends PaginatedMeta {
  items: InsuranceSummary[]
}

export interface GoalSummary {
  id: string
  familyId: string
  goalName: string
  targetAmount: number
  collectedAmount: number
  scopeType: string
  status: string
  accessLevel: string
  notes?: string | null
  completedAt?: string | null
  isPersonal: boolean
  createdAt: string
}

export interface GoalListResponse extends PaginatedMeta {
  items: GoalSummary[]
}

export interface SavingsPlanSummary {
  id: string
  familyId: string
  planName: string
  targetAmount: number
  accumulatedAmount: number
  scopeType: string
  status: string
  accessLevel: string
  isPersonal: boolean
  purposeType?: string | null
  contributionAmount?: number | null
  contributionEvery?: string | null
  nextContributionDate?: string | null
  createdAt: string
}

export interface SavingsPlanListResponse extends PaginatedMeta {
  items: SavingsPlanSummary[]
}

export interface LinkCandidateResponse {
  id: string
  name: string
  amount: number
  nextDate?: string | null
  suggestedContribution?: number | null
}

export interface LinkCandidateListResponse {
  items: LinkCandidateResponse[]
}

export interface ScheduledJobSummary {
  id: string
  familyId: string
  subFamilyId: string | null
  jobType: string
  sourceType: string
  sourceId: string
  assignedUserId: string | null
  amount: number
  direction: string
  periodKey: string
  scheduledFor: string
  requiresConfirmation: boolean
  status: string
  attemptCount: number
  createdAt: string
}

export interface ScheduledJobListResponse extends PaginatedMeta {
  items: ScheduledJobSummary[]
}

export type ScheduledJobResponse = ScheduledJobSummary

export interface EntityShare {
  id: string
  entityType: string
  entityId: string
  subFamilyId: string
  sharedBy: string
  shareAmount: number | null
  shareLogs: boolean
  shareDocs: boolean
  createdAt: string
}

export interface EntityShareListResponse {
  items: EntityShare[]
}

export interface EntityShareCreateRequest {
  entity_type: string
  entity_id: string
  sub_family_id: string
  share_amount?: number | null
  share_logs?: boolean
  share_docs?: boolean
}

export interface EntityShareUpdateRequest {
  share_amount?: number | null
  share_logs?: boolean
  share_docs?: boolean
}

export interface PersonalSavingsShare {
  id: string
  userId: string
  familyId: string
  subFamilyId: string
  initialAmount: number
  shareRecurring: boolean
  shareFutureLogs: boolean
  status: string
  createdAt: string
}

export interface PersonalSavingsShareCreateRequest {
  initial_amount: number
  share_recurring?: boolean
  share_future_logs?: boolean
}

export interface PersonalSavingsShareUpdateRequest {
  initial_amount?: number
  share_recurring?: boolean
  share_future_logs?: boolean
}

export interface SavingsLedgerEntry {
  id: string
  poolType: string
  familyId: string | null
  subFamilyId: string | null
  userId: string | null
  amount: number
  direction: string
  sourceType: string
  sourceId: string | null
  description: string | null
  documentId: string | null
  occurredAt: string
}

export interface SavingsLedgerListResponse extends PaginatedMeta {
  items: SavingsLedgerEntry[]
}

export interface PersonalSavingsFlagRequest {
  keep_in_family_only: boolean
}

export interface PersonalSavingsFlagResponse {
  familyId: string
  userId: string
  keepInFamilyOnly: boolean
  totalSavings: number | null
}

export interface GlobalSavingsResponse {
  userId: string
  originAmount: number
  totalSavings: number
}

export interface GlobalSavingsOriginRequest {
  origin_amount: number
}

export interface GlobalSavingsAdjustRequest {
  amount: number
}

export interface GlobalSavingsMutationResponse {
  message: string
  totalSavings: number
}

export interface SubFamilySavingsResponse {
  subFamilyId: string
  familyId: string
  originAmount: number | null
  totalSavings: number | null
}

export interface UpcomingItem {
  type: string
  direction: string
  name: string
  amount: number
  sourceType: string
  sourceId: string
  subFamilyId: string | null
  isPersonal: boolean
  date: string
  jobId?: string | null
  sourceEndpoint?: string | null
}

export interface UpcomingResponse {
  horizonDays: number
  items: UpcomingItem[]
}

export interface HistoryItem {
  entityType: string
  id: string
  name: string
  headline: string
  completedAt: string
  terminalStatus: string
}

export interface HistoryListResponse extends PaginatedMeta {
  items: HistoryItem[]
}

export interface GlobalPersonalEntryCreateRequest {
  name: string
  amount: number
  direction?: 'IN' | 'OUT'
  entry_date?: string
  note?: string
}

export interface GlobalPersonalEntry {
  id: string
  userId: string
  name: string
  amount: number
  direction: string
  entryDate: string
  note: string | null
  createdAt: string
}

export interface GlobalPersonalEntryListResponse {
  items: GlobalPersonalEntry[]
  totalSavings: number
}

// ---------------------------------------------------------------------------
// Plan 02 – Debt additions
// ---------------------------------------------------------------------------

export interface PartPaymentRequest {
  amount: number | string
  mode: PartPaymentMode
  splitLines?: Array<{
    poolType: string
    familyId?: string | null
    userId?: string | null
    amount: number | string
    expectedTotal?: number | string | null
    obligationRemaining?: number | string | null
  }> | null
  paidExternally?: boolean
  targetEmi?: number | null
  targetTenure?: number | null
  note?: string | null
  useBalance?: boolean
  reassignments?: Array<{
    poolType: string
    familyId?: string | null
    userId?: string | null
    amount: number | string
    expectedTotal?: number | string | null
    obligationRemaining?: number | string | null
  }> | null
}

export interface PartPaymentResponse {
  oldRemaining: string | number
  newRemaining: string | number
  oldEmi: string | number
  newEmi: string | number
  newPeriods: number
  note: string
  interestSavedEstimate?: string | number
  payoffDate?: string | null
  periodsCleared?: number
}

export interface DebtPaymentEvent {
  id: string
  debtId: string
  eventType: string
  amount?: number | string
  actualAmount?: number | string
  principalPortion?: number | string | null
  interestPortion?: number | string | null
  partPaymentMode?: string | null
  paidExternally?: boolean
  note?: string | null
  occurredAt?: string
  paidAt?: string
  createdAt: string
}

export interface DebtPaymentEventListResponse {
  items: DebtPaymentEvent[]
}

export interface DebtDefaultEntry {
  id: string
  reason: string
  amount: string
  fineAmount: string
  status: string
  settledAt: string | null
  createdAt: string
}

export interface DebtDefaultListResponse {
  items: DebtDefaultEntry[]
  totalOpen: string
}

// ---------------------------------------------------------------------------
// Plan 04 – Investments
// ---------------------------------------------------------------------------

export type InvestmentStatus = 'ACTIVE' | 'MATURED' | 'CLOSED' | 'CANCELLED'
export type InvestmentReturnType = 'SIMPLE' | 'COMPOUND' | 'MARKET'

export interface FamilyInvestmentSummary {
  id: string
  familyId: string
  scopeType: string
  investmentName: string
  type: string
  status: InvestmentStatus
  isPersonal: boolean
  inSomeoneName: string | null
  investedAmount: string
  currentValue: string
  returnType: string | null
  annualReturnRate: number | null
  compoundingFrequency: string | null
  hasRecurring: boolean
  contributionAmount: string | null
  contributionEvery: string | null
  nextContributionDate: string | null
  tenureMonths: number | null
  requiresConfirmation: boolean
  maturityDate: string | null
  maturityAmount: string | null
  autoCredit: boolean
  completedAt: string | null
  accessLevel: string
  createdAt: string
}

export type FamilyInvestmentResponse = FamilyInvestmentSummary

export interface FamilyInvestmentListResponse {
  items: FamilyInvestmentSummary[]
  investedTotal: string
  currentValueTotal: string
}

export interface InvestmentTxn {
  id: string
  investmentScope: string
  investmentId: string
  txnType: string
  amount: string
  direction: string
  occurredAt: string
  sourceType: string
  note: string | null
}

export interface InvestmentTxnListResponse {
  items: InvestmentTxn[]
}

export interface CreateInvestmentRequest {
  investmentName: string
  type: string
  inSomeoneName?: string | null
  initialLumpSum?: string | null
  splitLines?: Array<{ poolType: string; amount: string; familyId?: string | null }> | null
  returnType?: string | null
  annualReturnRate?: number | null
  compoundingFrequency?: string | null
  hasRecurring?: boolean
  contributionAmount?: string | null
  contributionEvery?: string | null
  nextContributionDate?: string | null
  tenureMonths?: number | null
  requiresConfirmation?: boolean
  maturityDate?: string | null
  maturityAmount?: string | null
  autoCreditOnMaturity?: boolean
  documentId?: string | null
  accessLevel?: string
  isPersonal?: boolean
  excludedUserIds?: string[]
  selectedUserIds?: string[]
}

export type UpdateInvestmentRequest = Partial<CreateInvestmentRequest>

export interface ContributeToInvestmentRequest {
  amount: string
  splitLines?: Array<{ poolType: string; amount: string; familyId?: string | null }> | null
  mode?: 'KEEP_SCHEDULE' | 'REDUCE_CONTRIBUTION' | 'REDUCE_TENURE'
  note?: string | null
  paidExternally?: boolean
}

export interface RedeemInvestmentRequest {
  amount: string
  creditPool?: 'FAMILY' | 'PERSONAL'
  note?: string | null
}

export interface UpdateInvestmentValueRequest {
  currentValue: string
}

// ---------------------------------------------------------------------------
// Plan 10 – Currency
// ---------------------------------------------------------------------------

export interface CurrencyRate {
  id: string
  baseCurrency: string
  quoteCurrency: string
  rate: string
  status: 'DRAFT' | 'FINAL'
  effectiveFrom: string
  finalizedBy: string | null
  finalizedAt: string | null
  createdAt: string
}

export interface CurrencyRateListResponse {
  items: CurrencyRate[]
}

export interface CreateCurrencyRateRequest {
  baseCurrency: string
  quoteCurrency: string
  rate: string
  effectiveFrom: string
}

export interface ConvertedAmount {
  amount: string
  converted: string
  rate: string | null
  isConverted: boolean
  baseCurrency: string
  quoteCurrency: string
}


