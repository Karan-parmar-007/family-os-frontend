import { useFamilies } from '#/hooks/api/use-families'

/** Family id used as API context for personal-scoped features that still need a family. */
export function usePersonalFamilyId(): string | undefined {
  const { data } = useFamilies()
  const items = data?.items ?? []
  if (typeof window !== 'undefined') {
    const last = localStorage.getItem('lastFamilyId')
    if (last && items.some((f) => f.id === last)) return last
  }
  return items[0]?.id
}
