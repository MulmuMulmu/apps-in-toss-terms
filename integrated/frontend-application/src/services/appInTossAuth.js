export const APPS_IN_TOSS_LOGIN_UNAVAILABLE = 'APPS_IN_TOSS_LOGIN_UNAVAILABLE';

export class AppsInTossLoginUnavailableError extends Error {
  constructor() {
    super('토스 앱 안에서 다시 열어 주세요.');
    this.code = APPS_IN_TOSS_LOGIN_UNAVAILABLE;
  }
}

const getGlobalObject = () => {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  return {};
};

export const getAppsInTossAppLogin = () => {
  const root = getGlobalObject();
  const candidates = [
    root.appLogin,
    root.AppsInToss?.appLogin,
    root.appsInToss?.appLogin,
    root.__APPS_IN_TOSS__?.appLogin,
    root.__AIT_MOCK_APP_LOGIN__,
  ];

  return candidates.find(candidate => typeof candidate === 'function') ?? null;
};

export const requestAppsInTossAuthorization = async () => {
  const appLogin = getAppsInTossAppLogin();

  if (appLogin == null) {
    throw new AppsInTossLoginUnavailableError();
  }

  const result = await appLogin();
  const authorizationCode = result?.authorizationCode;
  const referrer = result?.referrer;

  if (!authorizationCode || !referrer) {
    throw new Error('토스 로그인 인가 정보를 받지 못했어요.');
  }

  return { authorizationCode, referrer };
};
