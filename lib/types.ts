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

export type Article = {
  id: string;
  name: string;
  brandId: string;
  categoryId: string;
  reference: string;
  availableQty: number;
  alertThreshold: number;
  location: string;
  condition: StockCondition;
  unit: string;
};

export type StockEntry = {
  id: string;
  articleId: string;
  quantity: number;
  source: string;
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
  relatedRequestId?: string;
  date: string;
  note: string;
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
  articles: Article[];
  entries: StockEntry[];
  requests: StockRequest[];
  movements: Movement[];
};

export type EntryDraft = {
  articleId: string;
  quantity: number;
  source: string;
  recordedBy: string;
  note: string;
};

export type RequestDraft = {
  articleId: string;
  quantity: number;
  requester: string;
  reason: string;
  jobReference: string;
  note?: string;
};
