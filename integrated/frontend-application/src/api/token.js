let _token = null;

export const getToken = () => _token;
export const setToken = (token) => { _token = token; };
export const clearToken = () => { _token = null; };
