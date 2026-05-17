import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'

type VehicleStatus = 'Active' | 'UnderMaintenance' | 'Inactive' | 'Disposed'

type Route = {
  id: string
  routeCode: string
  routeName: string
  vehicleId?: string
  vehicleNumber?: string
  driverName?: string
  driverPhone?: string
  totalStops: number
  studentCount: number
  morningDeparture: string
  eveningDeparture: string
  status: 'Active' | 'Suspended'
  coverageArea: string
}

type Vehicle = {
  id: string
  registrationNumber: string
  make: string
  model: string
  year: number
  capacity: number
  currentOccupancy: number
  fuelType: 'Diesel' | 'Petrol' | 'CNG' | 'Electric'
  status: VehicleStatus
  lastServiceDate?: string
  nextServiceDue?: string
  assignedRoute?: string
  gpsTracking: boolean
}

type Driver = {
  id: string
  name: string
  licenseNumber: string
  phone: string
  emergencyContact: string
  assignedVehicle?: string
  assignedRoute?: string
  status: 'Active' | 'OnLeave' | 'Terminated'
  joiningDate: string
  experience: number
}

type StudentAssignment = {
  id: string
  studentName: string
  class: string
  section: string
  routeCode: string
  routeName: string
  stopName: string
  morning: boolean
  evening: boolean
  feeMonthly: number
  status: 'Active' | 'Suspended'
}

type TransportSummary = {
  totalRoutes: number
  activeRoutes: number
  totalVehicles: number
  activeVehicles: number
  totalDrivers: number
  totalStudents: number
  vehiclesUnderMaintenance: number
}

const VEHICLE_STATUS_COLORS: Record<VehicleStatus, string> = {
  Active:           'bg-emerald-100 text-emerald-700',
  UnderMaintenance: 'bg-amber-100 text-amber-700',
  Inactive:         'bg-gray-100 text-gray-600',
  Disposed:         'bg-red-100 text-red-600',
}

type Tab = 'routes' | 'vehicles' | 'drivers' | 'students'

export default function TransportPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('routes')
  const [showAddRoute, setShowAddRoute] = useState(false)
  const [routeForm, setRouteForm] = useState({ routeName: '', coverageArea: '', morningDeparture: '', eveningDeparture: '' })

  const summaryQuery = useQuery({
    queryKey: ['transport-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<TransportSummary>('/transport/summary')
      return res.data
    },
    retry: false,
  })

  const routesQuery = useQuery({
    queryKey: ['transport-routes'],
    queryFn: async () => {
      const res = await axiosClient.get<Route[] | { items: Route[] }>('/transport/routes')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
    enabled: activeTab === 'routes',
  })

  const vehiclesQuery = useQuery({
    queryKey: ['transport-vehicles'],
    queryFn: async () => {
      const res = await axiosClient.get<Vehicle[] | { items: Vehicle[] }>('/transport/vehicles')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
    enabled: activeTab === 'vehicles',
  })

  const driversQuery = useQuery({
    queryKey: ['transport-drivers'],
    queryFn: async () => {
      const res = await axiosClient.get<Driver[] | { items: Driver[] }>('/transport/drivers')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
    enabled: activeTab === 'drivers',
  })

  const studentsQuery = useQuery({
    queryKey: ['transport-students'],
    queryFn: async () => {
      const res = await axiosClient.get<StudentAssignment[] | { items: StudentAssignment[] }>('/transport/student-assignments')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
    enabled: activeTab === 'students',
  })

  const createRouteMutation = useMutation({
    mutationFn: (data: typeof routeForm) => axiosClient.post('/transport/routes', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport-routes'] })
      qc.invalidateQueries({ queryKey: ['transport-summary'] })
      setShowAddRoute(false)
      setRouteForm({ routeName: '', coverageArea: '', morningDeparture: '', eveningDeparture: '' })
    },
  })

  const s = summaryQuery.data

  const routeColumns: Column<Route>[] = [
    { key: 'routeCode', header: 'Code', width: '90px', render: (r) => <span className="font-mono text-xs font-semibold text-primary-700">{r.routeCode}</span> },
    {
      key: 'routeName', header: 'Route',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.routeName}</p>
          <p className="text-xs text-muted-foreground">{r.coverageArea}</p>
        </div>
      ),
    },
    { key: 'vehicleNumber', header: 'Vehicle', width: '110px', render: (r) => r.vehicleNumber ?? '—' },
    {
      key: 'driverName', header: 'Driver',
      render: (r) => r.driverName
        ? <div><p className="text-sm">{r.driverName}</p><p className="text-xs text-muted-foreground">{r.driverPhone}</p></div>
        : <span className="text-muted-foreground">—</span>,
    },
    { key: 'totalStops',   header: 'Stops',    width: '70px' },
    { key: 'studentCount', header: 'Students', width: '80px', render: (r) => <span className="font-semibold">{r.studentCount}</span> },
    { key: 'morningDeparture', header: 'Morning', width: '90px', render: (r) => <span className="font-mono text-xs">{r.morningDeparture}</span> },
    { key: 'eveningDeparture', header: 'Evening', width: '90px', render: (r) => <span className="font-mono text-xs">{r.eveningDeparture}</span> },
    {
      key: 'status', header: 'Status', width: '100px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {r.status}
        </span>
      ),
    },
  ]

  const vehicleColumns: Column<Vehicle>[] = [
    { key: 'registrationNumber', header: 'Reg #', width: '110px', render: (r) => <span className="font-mono text-xs font-semibold">{r.registrationNumber}</span> },
    {
      key: 'make', header: 'Vehicle',
      render: (r) => <div><p className="font-medium">{r.make} {r.model}</p><p className="text-xs text-muted-foreground">{r.year} · {r.fuelType}</p></div>,
    },
    {
      key: 'currentOccupancy', header: 'Occupancy', width: '110px',
      render: (r) => {
        const pct = Math.round((r.currentOccupancy / r.capacity) * 100)
        return (
          <div>
            <p className="text-sm font-medium">{r.currentOccupancy}/{r.capacity}</p>
            <div className="bg-gray-100 rounded-full h-1.5 mt-1">
              <div className={`h-1.5 rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      },
    },
    { key: 'assignedRoute', header: 'Route',   width: '110px', render: (r) => r.assignedRoute ?? '—' },
    { key: 'gpsTracking',   header: 'GPS',     width: '70px',  render: (r) => r.gpsTracking ? <span className="text-emerald-700 font-medium">On</span> : <span className="text-muted-foreground">Off</span> },
    {
      key: 'status', header: 'Status', width: '140px',
      render: (r) => <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${VEHICLE_STATUS_COLORS[r.status]}`}>{r.status}</span>,
    },
  ]

  const driverColumns: Column<Driver>[] = [
    { key: 'name', header: 'Name', render: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.phone}</p></div> },
    { key: 'licenseNumber', header: 'License #', width: '120px', render: (r) => <span className="font-mono text-xs">{r.licenseNumber}</span> },
    { key: 'assignedVehicle', header: 'Vehicle', width: '110px', render: (r) => r.assignedVehicle ?? '—' },
    { key: 'assignedRoute',   header: 'Route',   width: '100px', render: (r) => r.assignedRoute ?? '—' },
    { key: 'experience',      header: 'Exp (yrs)', width: '90px' },
    {
      key: 'status', header: 'Status', width: '100px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : r.status === 'OnLeave' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
          {r.status}
        </span>
      ),
    },
  ]

  const studentColumns: Column<StudentAssignment>[] = [
    { key: 'studentName', header: 'Student', render: (r) => <div><p className="font-medium">{r.studentName}</p><p className="text-xs text-muted-foreground">{r.class} {r.section}</p></div> },
    { key: 'routeCode',   header: 'Route',   width: '90px',  render: (r) => <span className="font-mono text-xs font-semibold text-primary-700">{r.routeCode}</span> },
    { key: 'stopName',    header: 'Stop',    width: '130px' },
    { key: 'morning',     header: '🌅 AM',  width: '60px',  render: (r) => r.morning ? '✓' : '—' },
    { key: 'evening',     header: '🌆 PM',  width: '60px',  render: (r) => r.evening ? '✓' : '—' },
    {
      key: 'status', header: 'Status', width: '100px',
      render: (r) => <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>,
    },
  ]

  const TABS: { key: Tab; label: string }[] = [
    { key: 'routes',   label: 'Routes' },
    { key: 'vehicles', label: 'Vehicles' },
    { key: 'drivers',  label: 'Drivers' },
    { key: 'students', label: 'Student Assignments' },
  ]

  const isError = routesQuery.isError || vehiclesQuery.isError || driversQuery.isError || studentsQuery.isError

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transport Management</h1>
          <p className="text-sm text-muted-foreground">Manage routes, vehicles, drivers and student transport assignments.</p>
        </div>
        {activeTab === 'routes' && (
          <button onClick={() => setShowAddRoute(true)}
            className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Add Route
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Active Routes"   value={s?.activeRoutes ?? '—'}              icon="🗺️" />
        <KpiCard label="Total Vehicles"  value={s?.totalVehicles ?? '—'}             icon="🚌" />
        <KpiCard label="Under Maint."    value={s?.vehiclesUnderMaintenance ?? '—'}  icon="🔧" trend={s && s.vehiclesUnderMaintenance > 0 ? 'neutral' : 'up'} />
        <KpiCard label="Students"        value={s?.totalStudents ?? '—'}             icon="👥" />
      </div>

      {isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Transport API not yet available. Will appear once the Transport backend module is deployed.
        </p>
      )}

      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === t.key ? 'bg-primary-700 text-white' : 'bg-white border border-border text-gray-700 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'routes' && !routesQuery.isLoading && !routesQuery.isError && (
        <DataTable<Route> columns={routeColumns} data={routesQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['routeCode', 'routeName', 'coverageArea', 'driverName', 'vehicleNumber']}
          pageSize={15} emptyMessage="No routes configured." />
      )}
      {activeTab === 'vehicles' && !vehiclesQuery.isLoading && !vehiclesQuery.isError && (
        <DataTable<Vehicle> columns={vehicleColumns} data={vehiclesQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['registrationNumber', 'make', 'model', 'assignedRoute']}
          pageSize={15} emptyMessage="No vehicles registered." />
      )}
      {activeTab === 'drivers' && !driversQuery.isLoading && !driversQuery.isError && (
        <DataTable<Driver> columns={driverColumns} data={driversQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['name', 'licenseNumber', 'phone', 'assignedRoute', 'assignedVehicle']}
          pageSize={15} emptyMessage="No drivers on record." />
      )}
      {activeTab === 'students' && !studentsQuery.isLoading && !studentsQuery.isError && (
        <DataTable<StudentAssignment> columns={studentColumns} data={studentsQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['studentName', 'routeCode', 'routeName', 'stopName']}
          pageSize={15} emptyMessage="No student assignments." />
      )}

      <Modal open={showAddRoute} onClose={() => setShowAddRoute(false)} title="Add Route" size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddRoute(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button form="route-form" type="submit" disabled={createRouteMutation.isPending}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {createRouteMutation.isPending ? 'Saving…' : 'Create Route'}
            </button>
          </div>
        }>
        <form id="route-form" onSubmit={(e) => { e.preventDefault(); createRouteMutation.mutate(routeForm) }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Route Name *</label>
            <input value={routeForm.routeName} onChange={(e) => setRouteForm((p) => ({ ...p, routeName: e.target.value }))} required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Coverage Area</label>
            <input value={routeForm.coverageArea} onChange={(e) => setRouteForm((p) => ({ ...p, coverageArea: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Morning Departure</label>
              <input type="time" value={routeForm.morningDeparture} onChange={(e) => setRouteForm((p) => ({ ...p, morningDeparture: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Evening Departure</label>
              <input type="time" value={routeForm.eveningDeparture} onChange={(e) => setRouteForm((p) => ({ ...p, eveningDeparture: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          {createRouteMutation.isError && <p className="text-sm text-red-600">Failed to create route.</p>}
        </form>
      </Modal>
    </div>
  )
}
