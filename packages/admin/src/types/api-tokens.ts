export type ApiTokenType = "read-only" | "full-access" | "custom";

export interface ApiToken {
  id: number;
  name: string;
  description?: string;
  accessKey?: string;
  type?: ApiTokenType;
  lifespan?: string | null;
  createdAt?: string;
  lastUsed?: string;
}

export interface CreateApiTokenPayload {
  name: string;
  description?: string;
  type?: ApiTokenType;
  lifespan?: string | null;
}

export interface UpdateApiTokenPayload {
  name?: string;
  description?: string;
  type?: ApiTokenType;
  lifespan?: string | null;
  regenerate?: boolean;
}
