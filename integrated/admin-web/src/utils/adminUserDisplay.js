export const maskTossUserKey = (value) => {
  if (!value) return '';
  const text = String(value);
  if (text.length <= 6) return text;
  return `${text.slice(0, 3)}•••${text.slice(-3)}`;
};

export const getProviderLabel = (provider) => {
  switch (provider) {
    case 'APP_IN_TOSS':
      return '앱인토스';
    case 'KAKAO':
      return '카카오';
    case 'LOCAL':
      return '일반';
    default:
      return provider || '-';
  }
};

export const formatAdminUserLabel = ({
  nickName,
  name,
  tossUserKey,
  userId,
  loginProvider,
} = {}) => {
  const displayName = nickName || name || '-';
  const maskedKey = maskTossUserKey(tossUserKey);
  if (maskedKey) return `${displayName} (${maskedKey})`;
  if (userId) return `${displayName} (${userId})`;
  if (loginProvider) return `${displayName} (${getProviderLabel(loginProvider)})`;
  return displayName;
};
