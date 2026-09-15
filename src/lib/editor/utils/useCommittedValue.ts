import {useLayoutEffect, useRef} from 'react';
import type {RefObject} from 'react';

/** Event handlers may resume after an await; never expose an uncommitted render. */
export const useCommittedValue = <T,>(value: T): RefObject<T | null> => {
    const committed = useRef<T | null>(null);

    useLayoutEffect(() => {
        committed.current = value;
        return () => {
            committed.current = null;
        };
    }, [value]);

    return committed;
};
