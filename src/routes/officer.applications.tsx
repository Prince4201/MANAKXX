import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/officer/applications')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/officer/applications"!</div>
}
