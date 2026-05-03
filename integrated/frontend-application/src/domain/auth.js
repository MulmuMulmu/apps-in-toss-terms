// @ts-nocheck

export function normalizeTossLoginExchangeResponse(data) {
  const accessToken =
    data?.result?.jwt ??
    data?.result?.accessToken ??
    data?.data?.accessToken ??
    data?.data?.success?.accessToken ??
    data?.success?.accessToken ??
    null;

  const firstLogin =
    data?.result?.firstLogin ??
    data?.data?.firstLogin ??
    data?.data?.success?.firstLogin ??
    data?.success?.firstLogin ??
    false;

  if (!accessToken) {
    throw new Error('AccessToken을 가져오지 못했어요.');
  }

  return {
    accessToken,
    firstLogin,
    raw: data,
  };
}
