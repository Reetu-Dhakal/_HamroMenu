'use client';

import { useEffect, useState, useCallback } from 'react';
import api from './api';

export function useApi(fetcher, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher(...args);
        setData(result?.data ?? result);
        return result;
      } catch (err) {
        setError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useEffect(() => {
    if (enabled) run();
  }, [enabled, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, run, setData };
}

export function useRestaurant(restaurantId) {
  return useApi(() => api.get(`/restaurants/${restaurantId}`), [restaurantId], { enabled: !!restaurantId });
}

export function useMenu(restaurantId) {
  return useApi(() => api.get(`/restaurants/${restaurantId}/menu`), [restaurantId], { enabled: !!restaurantId });
}

export default api;