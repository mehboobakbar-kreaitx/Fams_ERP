export default function ParentCommunicationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Communications</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Notifications and messages from the school.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        Inbound communication log will populate as the school sends SMS/email/in-app notifications
        to you (FR-CRM-05). Recent notifications also appear in the bell icon at the top right.
      </div>
    </div>
  )
}
