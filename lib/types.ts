export type RequestStatus = "pending" | "approved" | "rejected";

export type MovementType =
  | "entry"
  | "output"
  | "adjustment"
  | "approval"
  | "rejection"
  | "cancellation"
  | "return";

export type StockCondition = "new" | "good" | "maintenance" | "used";

export type ReportPeriod = "weekly" | "monthly" | "custom";

export type Brand = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  brandId: string;
  name: string;
};

export type Location = {
  id: string;
  name: string;
};

export type MutationResult = {
  ok: boolean;
  message: string;
};

export type Article = {
  id: string;
  name: string;
  brandId: string;
  categoryId: string;
  reference: string;
  availableQty: number;
  alertThreshold: number;
  unit: string;
};

export type StockEntry = {
  id: string;
  articleId: string;
  quantity: number;
  source: string;
  condition: StockCondition;
  date: string;
  recordedBy: string;
  note: string;
};

export type StockRequest = {
  id: string;
  requester: string;
  articleId: string;
  quantity: number;
  reason: string;
  jobReference: string;
  status: RequestStatus;
  requestedAt: string;
  reviewComment?: string;
};

export type Movement = {
  id: string;
  type: MovementType;
  articleId: string;
  quantity: number;
  actor: string;
  source?: string;
  condition?: StockCondition;
  relatedRequestId?: string;
  date: string;
  note: string;
  correctionReason?: string;
  replacesMovementId?: string;
  replacedByMovementId?: string;
};

export type ReportFilter = {
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  brandId?: string;
  categoryId?: string;
  technician?: string;
};

export type InventoryState = {
  brands: Brand[];
  categories: Category[];
  locations: Location[];
  articles: Article[];
  entries: StockEntry[];
  requests: StockRequest[];
  movements: Movement[];
};

export type EntryDraft = {
  articleId: string;
  quantity: number;
  source: string;
  condition: StockCondition;
  recordedBy: string;
  note: string;
};

export type OutputDraft = {
  articleId: string;
  quantity: number;
  actor: string;
  note: string;
};

export type MovementUpdateDraft = {
  quantity: number;
  actor: string;
  source?: string;
  condition?: StockCondition;
  note: string;
  correctionReason: string;
};

export type RequestDraft = {
  articleId: string;
  quantity: number;
  requester: string;
  reason: string;
  jobReference: string;
  note?: string;
};

export type BrandDraft = {
  name: string;
};

export type CategoryDraft = {
  brandId: string;
  name: string;
};

export type LocationDraft = {
  name: string;
};

export type ArticleDraft = {
  name: string;
  brandId: string;
  categoryId: string;
  reference: string;
  availableQty: number;
  alertThreshold: number;
  unit: string;
};

export type ArticleUpdateDraft = {
  name: string;
  brandId: string;
  categoryId: string;
  reference: string;
  alertThreshold: number;
  unit: string;
};
