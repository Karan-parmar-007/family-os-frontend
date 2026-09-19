import { createFileRoute } from '@tanstack/react-router'
import { PersonalFeatureRedirect } from '#/components/personal/personal-feature-redirect'

export const Route = createFileRoute('/_authenticated/personal/assets')({
  component: () => <PersonalFeatureRedirect feature="assets" />,
})
