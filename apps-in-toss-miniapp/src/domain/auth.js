// @ts-nocheck

export function normalizeTossLoginExchangeResponse(data) {
  const accessToken =
    data?.result?.jwt ??
    data?.result?.accessToken ??
    data?.data?.accessToken ??
    data?.data?.success?.accessToken ??
    data?.success?.accessToken ??
    null;

  const refreshToken =
    data?.result?.refreshToken ??
    data?.data?.refreshToken ??
    data?.data?.success?.refreshToken ??
    data?.success?.refreshToken ??
    null;

  if (!accessToken) {
    throw new Error('AccessToken을 가져오지 못했어요.');
  }

  return {
    accessToken,
    refreshToken,
    raw: data,
  };
}
