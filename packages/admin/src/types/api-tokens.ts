export interface ApiToken {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  lastUsed?: string;
  type?: string;
}

export interface CreateApiTokenPayload {
  name: string;
  description?: string;
  type?: string;
}
