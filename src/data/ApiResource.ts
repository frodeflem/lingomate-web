import {
  PrimitiveAtom,
  Atom,
  WritableAtom,
  atom,
  useSetAtom,
  useAtomValue,
  useAtom,
} from "jotai";
import { loadable } from "jotai/utils";
import { Loadable } from "jotai/vanilla/utils/loadable";
import { atomEffect } from "jotai-effect";
import { Dispatch, useEffect, useState } from "react";
import { Getter, SetStateAction } from "jotai/vanilla";

type LoadingState = "hasData" | "loading" | "hasError";

type ApiResource<T> = {
  draftAtom: PrimitiveAtom<T>;
  remoteAtom: WritableAtom<Promise<T | null>, [action: "trigger"], Promise<void>>;
  refreshRemoteAtom: WritableAtom<null, [], Promise<void>>;
  loadableAtom: Atom<Loadable<Promise<T | null>>>;
  latestAtom: PrimitiveAtom<T | null>;
  latestEffect: Atom<void>;
  commitUpdateAtom: WritableAtom<null, [], Promise<void>>;
  commitAtom: WritableAtom<null, [value: unknown], Promise<void>>;
};

type ApiResourceProps<T> = {
  getFunc?: (get: Getter) => Promise<T | null>;
  postFunc?: (draft: T) => Promise<void>;
  putFunc?: (draft: T, diff: T) => Promise<T | null>;
};

type ResourceRefresh<T> = () => void;

type ResourceReadOnly<T> = {
  remote: T | null;
  latest: T | null;
  setLatest: Dispatch<SetStateAction<T | null>>;
  state: LoadingState;
};

function findDiff<T>(obj1: T, obj2: T): Partial<T> {
  const diff: Partial<T> = {};
  Object.keys({ ...obj1, ...obj2 } as object).forEach((key) => {
    if ((obj1 as any)[key] !== (obj2 as any)[key]) {
      (diff as any)[key] = (obj2 as any)[key];
    }
  });
  return diff;
}

export function atomWithRefresh<T>(fn?: (get: Getter) => Promise<T | null>) {
  const refreshCounter = atom(0);

  const remoteAtom = atom(
    async (get) => {
      if (!fn)
        throw new Error(
          "Attempted to fetch a resource that has no GET function"
        );
      // console.log("Fetching remoteAtom");
      get(refreshCounter);
      return await fn(get);
    },
    async (get, set, action: "trigger") => {
      if (action === "trigger") {
        set(refreshCounter, (i) => i + 1);
        // console.log("action:", action, get(refreshCounter));
      }
    }
  );

  // Refresh atom: triggers a refresh of the remote atom
  const refreshRemoteAtom: WritableAtom<null, [], Promise<void>> = atom(null, async (_, set) => {
    // console.log("refreshRemoteAtom set");
    await set(remoteAtom, "trigger");
  });

  return { remoteAtom, refreshRemoteAtom };
}

export function createApiResource<T>({
  getFunc,
  postFunc,
  putFunc,
}: ApiResourceProps<T>): ApiResource<T> {
  const draftAtom = atom<T>({} as T);
  const latestAtom = atom<T | null>(null);
  const { remoteAtom, refreshRemoteAtom } = atomWithRefresh<T>(getFunc);
  const loadableAtom = loadable(remoteAtom);

  const latestEffect = atomEffect((get, set) => {
    const loadableValue = get(loadableAtom);

    // console.log("Effect, perhaps?");
    if (loadableValue.state === "hasData") {
      // console.log("Effect, setting latestAtom");
      set(latestAtom, loadableValue.data);
    }
  });

  // Commit function: updates local state, then POSTs to the server and updates the remote state
  const commitUpdateAtom = atom(null, async (get, set) => {
    if (!putFunc)
      throw new Error(
        "Attempted to update a resource that has no PUT function"
      );

    const draftValue = get(draftAtom);
    if (draftValue) {
      // Update local state
      set(latestAtom, (prev) => ({
        ...prev,
        ...draftValue,
      }));

      // Find all the fields that changed in draftValue, compared to latest state (typescript):
      const remote = get(loadableAtom);
      const latest = remote.state === "hasData" ? remote.data : get(latestAtom);
      const diff = findDiff(latest, draftValue) as T;

      await putFunc(draftValue, diff);

      // Fetch latest remote value and update
      set(refreshRemoteAtom);
      const newRemoteValue = await get(remoteAtom);
      // console.log("NEW REMOTE VALUE: ", newRemoteValue);
      set(latestAtom, newRemoteValue);
    }
  });

  const commitAtom = atom(null, async (get, set, value) => {
    if (!postFunc)
      throw new Error(
        "Attempted to update a resource that has no POST function"
      );

    const draftValue = get(draftAtom);
    if (draftValue) {
      await postFunc(draftValue);
      set(refreshRemoteAtom);
      const newRemoteValue = await get(remoteAtom);
      set(latestAtom, newRemoteValue);
    }
  });

  return {
    draftAtom,
    remoteAtom,
    refreshRemoteAtom,
    loadableAtom,
    latestAtom,
    latestEffect,
    commitUpdateAtom,
    commitAtom,
  };
}

export function useRefresh<T>(resource: ApiResource<T>): ResourceRefresh<T> {
  const setTrigger = useSetAtom(resource.refreshRemoteAtom);

  // These must be mounted in order to function:
  useAtomValue(resource.loadableAtom);
  useAtomValue(resource.latestEffect);

  return setTrigger;
}

export function useResource<T>(resource: ApiResource<T>): ResourceReadOnly<T> {
  const loadable = useAtomValue(resource.loadableAtom);
  const [ latest, setLatest ] = useAtom(resource.latestAtom);
  const remote = loadable.state === "hasData" ? loadable.data : null;
  const state = loadable?.state;

  // The effect must be mounted in order to function:
  useAtomValue(resource.latestEffect);

  return { latest, setLatest, remote, state };
}

export function useUpdateDraft<T>(
  resource: ApiResource<T>
): [T, typeof setDraft, typeof commit] {
  const { latest } = useResource(resource);
  const [_draft, setDraft] = useAtom(resource.draftAtom);
  const commit = useSetAtom(resource.commitUpdateAtom);
  const draft =
    _draft && Object.keys(_draft).length > 0 ? _draft : latest || ({} as T);

  useEffect(() => {
    if (!latest) return;
    // console.log("Copied latest into draft: ", latest);
    setDraft(latest);
  }, [latest]);

  return [draft, setDraft, commit];
}


// interface DraftOptions {
//   immerStyle?: boolean;
// }

// export function useDraft<T>(
//   resource: ApiResource<T>,
//   options: DraftOptions = {
//     immerStyle: true,
//   }
// ): [T, typeof setDraft, typeof commit] {
//   const { latest } = useResource(resource);
//   const [draft, _setDraft] = useState<T>({} as T);
//   const _commit = useSetAtom(resource.commitAtom);
  

//   function commit() {
//     _commit(draft);
//   }

//   let setDraft: Dispatch<SetStateAction<T>>;

//   if (options.immerStyle) {
//     setDraft = (prev: T) => {
//       _setDraft((prevDraft: T) => {
//         value(prevDraft);
//       });
//     }
//   }
//   else {
//     setDraft = _setDraft;
//   }

//   useEffect(() => {
//     if (!latest) return;
//     // console.log("Copied latest into draft: ", latest);
//     setDraft(latest);
//   }, [latest]);

//   return [draft, setDraft, commit];
// }
