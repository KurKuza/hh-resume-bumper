const baseHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0',
  Accept: '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
};

export const getHeaders = (token, xsrf) => {
  if (!token) {
    throw new Error('HH token is required');
  }

  const tempHeaders = { ...baseHeaders };
  tempHeaders['Cookie'] = `hhtoken=${token};`;

  if (xsrf) {
    tempHeaders['Cookie'] += `_xsrf=${xsrf};`;
    tempHeaders['x-xsrftoken'] = xsrf;
  }

  return tempHeaders;
};
