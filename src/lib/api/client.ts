import type { ApiResult } from '@/types/api';
import type {
  GatewayToken,
  Session,
  SignInRequest,
  SignUpRequest,
  UpgradeGuestRequest,
} from '@/types/auth';
import type {
  CatalogOverview,
  FilterOptions,
  PlayerDirectory,
} from '@/types/catalog';
import type { AppConfig } from '@/types/config';
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
  // For the socket handshake only
  getGatewayToken(): Promise<ApiResult<GatewayToken>>;
}

export interface CatalogApi {
  getFilterOptions(): Promise<ApiResult<FilterOptions>>;
  // Once per match, for guess suggestions
  getPlayerDirectory(): Promise<ApiResult<PlayerDirectory>>;
  // Public: the landing page, before any session
  getOverview(): Promise<ApiResult<CatalogOverview>>;
}

export interface SoloApi {
  findMatch(filters: Filters): Promise<ApiResult<SoloMatchOffer>>;
  chooseSide(sessionId: string, side: Side): Promise<ApiResult<SoloSession>>;
  guess(request: SoloGuessRequest): Promise<ApiResult<SoloGuessResponse>>;
  // Re-read server state when the countdown hits 0
  syncSession(sessionId: string): Promise<ApiResult<SoloSession>>;
  quit(sessionId: string): Promise<ApiResult<SoloSummary>>;
  getSummary(sessionId: string): Promise<ApiResult<SoloSummary>>;
}

export interface ProfileApi {
  getProfile(): Promise<ApiResult<Profile>>;
  getHistory(query: HistoryQuery): Promise<ApiResult<HistoryPage>>;
}

export interface ConfigApi {
  // Public: whether the Free/Pro split is on
  getConfig(): Promise<ApiResult<AppConfig>>;
}

export interface ApiClient {
  config: ConfigApi;
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
