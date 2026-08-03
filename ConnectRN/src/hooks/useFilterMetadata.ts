import { useEffect, useState } from 'react';
import { getFilterMetadata } from '../api/stores';
import type { FilterMetadataResponseDto } from '../api/types';

const EMPTY: FilterMetadataResponseDto = { regions: [], categories: ['전체'], universities: [], timeOptions: ['상관없음'] };

export function useFilterMetadata(): FilterMetadataResponseDto {
  const [metadata, setMetadata] = useState<FilterMetadataResponseDto>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    getFilterMetadata()
      .then((data) => {
        if (!cancelled) setMetadata(data);
      })
      .catch((e) => console.warn('Failed to load filter metadata', e));
    return () => {
      cancelled = true;
    };
  }, []);

  return metadata;
}
