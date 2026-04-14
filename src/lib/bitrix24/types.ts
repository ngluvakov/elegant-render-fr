export type BitrixDeal = {
  ID: string;
  TITLE: string;
  STAGE_ID: string;
  CATEGORY_ID: string;
  CONTACT_ID: string;
  OPPORTUNITY: string;
  CURRENCY_ID: string;
  COMMENTS: string;
  DATE_CREATE: string;
  DATE_MODIFY: string;
  [key: string]: unknown;
};

export type BitrixContact = {
  ID: string;
  NAME: string;
  LAST_NAME: string;
  EMAIL: Array<{ VALUE: string; VALUE_TYPE: string }>;
  PHONE: Array<{ VALUE: string; VALUE_TYPE: string }>;
  [key: string]: unknown;
};

export type BitrixTimelineComment = {
  ID: string;
  ENTITY_ID: string;
  ENTITY_TYPE: string;
  COMMENT: string;
  CREATED: string;
  [key: string]: unknown;
};
