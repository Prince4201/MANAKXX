import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/officer/vendors')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/officer/vendors"!</div>
}
