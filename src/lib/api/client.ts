import type { ApiResult } from '@/types/api';
import type {
  Session,
  SignInRequest,
  SignUpRequest,
  UpgradeGuestRequest,
} from '@/types/auth';
import type { FilterOptions } from '@/types/catalog';
import type { Filters } from '@/types/filters';
import type { Side } from '@/types/match';
import type { HistoryPage, HistoryQuery, Profile } from '@/types/profile';
import type {
  SoloGuessRequest,
  SoloGuessResponse,
  SoloMatchOffer,
  SoloSession,
  SoloSummary,
} from '@/types/solo';

export interface AuthApi {
  getSession(): Promise<ApiResult<Session | null>>;
  signIn(request: SignInRequest): Promise<ApiResult<Session>>;
  signUp(request: SignUpRequest): Promise<ApiResult<Session>>;
  continueAsGuest(): Promise<ApiResult<Session>>;
  upgradeGuest(request: UpgradeGuestRequest): Promise<ApiResult<Session>>;
  signOut(): Promise<ApiResult<void>>;
}

export interface CatalogApi {
  getFilterOptions(): Promise<ApiResult<FilterOptions>>;
}

export interface SoloApi {
  findMatch(filters: Filters): Promise<ApiResult<SoloMatchOffer>>;
  chooseSide(sessionId: string, side: Side): Promise<ApiResult<SoloSession>>;
  guess(request: SoloGuessRequest): Promise<ApiResult<SoloGuessResponse>>;
  // Re-read server state when the rendered countdown reaches zero
  syncSession(sessionId: string): Promise<ApiResult<SoloSession>>;
  quit(sessionId: string): Promise<ApiResult<SoloSummary>>;
  getSummary(sessionId: string): Promise<ApiResult<SoloSummary>>;
}

export interface ProfileApi {
  getProfile(): Promise<ApiResult<Profile>>;
  getHistory(query: HistoryQuery): Promise<ApiResult<HistoryPage>>;
}

export interface ApiClient {
  auth: AuthApi;
  catalog: CatalogApi;
  solo: SoloApi;
  profile: ProfileApi;
}

let registeredClient: ApiClient | null = null;

export function setApiClient(client: ApiClient): void {
  registeredClient = client;
}

export function getApiClient(): ApiClient {
  if (!registeredClient) {
    throw new Error(
      'No API client registered. Call setApiClient() during app bootstrap.',
    );
  }

  return registeredClient;
}
