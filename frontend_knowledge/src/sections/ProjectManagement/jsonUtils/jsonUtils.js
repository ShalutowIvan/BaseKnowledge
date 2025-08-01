const json = (data, init = {}) => {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    status: init.status || 200,
  });
};

export {json}