import PortalLayout, { type PortalNavItem, type PortalTheme } from './PortalLayout'

const theme: PortalTheme = {
  sidebarBg: 'bg-primary-800',
  sidebarActiveBg: 'bg-primary-900 text-white',
  sidebarHoverBg: 'hover:bg-primary-700',
  sidebarText: 'text-white',
  sidebarMutedText: 'text-primary-100',
  badgeBg: 'bg-secondary',
  badgeText: 'text-white',
  avatarBg: 'bg-primary-700',
}

const navItems: PortalNavItem[] = [
  // 1. Dashboard & Analytics
  { to: '/campus/dashboard', label: 'Dashboard', icon: '🏠' },

  // 2 & 3. Institution + Academic Management
  {
    label: 'Academic Management',
    icon: '📚',
    defaultOpen: true,
    children: [
      { to: '/campus/students',     label: 'Students',        icon: '👥' },
      { to: '/campus/admissions',   label: 'Admissions',      icon: '📋' },
      { to: '/campus/classes',      label: 'Classes & Sections', icon: '🏛️' },
      { to: '/campus/attendance',   label: 'Attendance',      icon: '📅' },
      { to: '/campus/exams',        label: 'Examinations',    icon: '📝' },
      { to: '/campus/results',      label: 'Results & GPA',   icon: '📊' },
      { to: '/campus/certificates', label: 'Certificates',    icon: '🎓' },
    ],
  },

  // 4. Staff & HRM — Directory + Recruitment
  {
    label: 'Staff & Recruitment',
    icon: '👤',
    children: [
      { to: '/campus/hrm',              label: 'HR Dashboard',  icon: '🏢' },
      { to: '/campus/hrm/departments',  label: 'Departments',   icon: '🏛️' },
      {
        to: '/campus/hrm/recruitment',
        label: 'Recruitment',
        icon: '📋',
        roles: ['HrOfficer', 'Principal'],
      },
      {
        to: '/campus/hrm/contracts',
        label: 'Contracts',
        icon: '📄',
        roles: ['HrOfficer', 'Principal'],
      },
      {
        to: '/campus/hrm/resignations',
        label: 'Resignations',
        icon: '🚪',
        roles: ['HrOfficer', 'Principal'],
      },
    ],
  },

  // 4b. HR Operations
  {
    label: 'HR Operations',
    icon: '⚙️',
    children: [
      { to: '/campus/hrm/leaves',           label: 'Leave Management',  icon: '🌴' },
      { to: '/campus/hrm/staff-attendance', label: 'Staff Attendance',  icon: '📅' },
      { to: '/campus/hrm/performance',      label: 'Performance',       icon: '📈' },
      { to: '/campus/hrm/benefits',         label: 'Benefits',          icon: '🎁' },
      { to: '/campus/hrm/reports',          label: 'HR Reports',        icon: '📊' },
    ],
  },

  // 5. Finance & Accounting
  {
    label: 'Finance & Accounting',
    icon: '💰',
    children: [
      { to: '/campus/finance',                  label: 'Finance Dashboard',  icon: '🏠' },
      { to: '/campus/fee',                      label: 'Fee Management',     icon: '💳' },
      { to: '/campus/finance/fee-structures',   label: 'Fee Structures',     icon: '🏗️' },
      { to: '/campus/finance/payments',         label: 'Payments',           icon: '💵' },
      { to: '/campus/finance/budget',           label: 'Budgeting',          icon: '📊' },
      { to: '/campus/finance/expenses',         label: 'Expense Tracking',   icon: '🧾' },
      { to: '/campus/finance/reports',          label: 'Financial Reports',  icon: '📈' },
    ],
  },

  // 5b. Payroll Finance (restricted — Accountant / Principal)
  {
    label: 'Payroll Finance',
    icon: '⚖️',
    children: [
      {
        to: '/campus/finance/payroll-summary',
        label: 'Payroll Cost View',
        icon: '💰',
        roles: ['Accountant', 'Principal'],
      },
      {
        to: '/campus/finance/salary-expenses',
        label: 'Salary Expenses',
        icon: '💸',
        roles: ['Accountant', 'Principal'],
      },
      {
        to: '/campus/finance/payroll-ledger',
        label: 'Payroll Ledger',
        icon: '📒',
        roles: ['Accountant', 'Principal'],
      },
    ],
  },

  // 8. Payroll & Salaries
  {
    label: 'Payroll & Salaries',
    icon: '💵',
    children: [
      { to: '/campus/payroll',             label: 'Payroll Dashboard', icon: '🏠' },
      {
        to: '/campus/payroll/processing',
        label: 'Payroll Processing',
        icon: '⚙️',
        roles: ['Accountant', 'Principal'],
      },
      { to: '/campus/payroll/payslips',    label: 'Payslips',          icon: '🧾' },
      { to: '/campus/payroll/structures',  label: 'Salary Structures', icon: '🏗️' },
      { to: '/campus/payroll/grades',      label: 'Salary Grades',     icon: '📊' },
      {
        to: '/campus/payroll/bonuses',
        label: 'Bonuses',
        icon: '🎁',
        roles: ['Accountant', 'Principal'],
      },
      { to: '/campus/payroll/deductions',  label: 'Deductions',        icon: '➖' },
      { to: '/campus/payroll/overtime',    label: 'Overtime',          icon: '⏰' },
      {
        to: '/campus/payroll/taxes',
        label: 'Taxes',
        icon: '🏛️',
        roles: ['Accountant', 'Principal'],
      },
      { to: '/campus/payroll/reports',     label: 'Payroll Reports',   icon: '📈' },
      {
        to: '/campus/payroll/audit',
        label: 'Audit Logs',
        icon: '🔒',
        roles: ['Accountant', 'Principal'],
      },
    ],
  },

  // 6. Vendor & Procurement
  {
    label: 'Vendor & Procurement',
    icon: '🛒',
    children: [
      { to: '/campus/procurement',              label: 'Procurement Dashboard', icon: '🏠', roles: ['ProcurementOfficer', 'Principal'] },
      { to: '/campus/procurement/vendors',      label: 'Vendors',               icon: '🏢', roles: ['ProcurementOfficer', 'Principal'] },
      { to: '/campus/procurement/requests',     label: 'Purchase Requests',     icon: '📋', roles: ['ProcurementOfficer', 'Principal'] },
      { to: '/campus/procurement/quotations',   label: 'Quotations',            icon: '📄', roles: ['ProcurementOfficer', 'Principal'] },
      { to: '/campus/procurement/orders',       label: 'Purchase Orders',       icon: '🛒', roles: ['ProcurementOfficer', 'Principal'] },
      { to: '/campus/procurement/approvals',    label: 'Approvals',             icon: '✅', roles: ['ProcurementOfficer', 'Principal'] },
      { to: '/campus/procurement/grn',          label: 'Goods Receiving',       icon: '📦', roles: ['ProcurementOfficer', 'Principal'] },
      { to: '/campus/procurement/reports',      label: 'Procurement Reports',   icon: '📊', roles: ['ProcurementOfficer', 'Principal'] },
    ],
  },

  // 7. Asset & Inventory
  {
    label: 'Asset & Inventory',
    icon: '📦',
    children: [
      { to: '/campus/assets',                label: 'Asset Dashboard',   icon: '🏠' },
      { to: '/campus/assets/registry',       label: 'Asset Registry',    icon: '🗂️' },
      { to: '/campus/assets/assignments',    label: 'Assignments',        icon: '👤' },
      { to: '/campus/assets/maintenance',    label: 'Maintenance',        icon: '🔧' },
      { to: '/campus/assets/depreciation',   label: 'Depreciation',       icon: '📉' },
      { to: '/campus/assets/inventory',      label: 'Inventory Stock',    icon: '📦' },
      { to: '/campus/assets/transfers',      label: 'Transfers',          icon: '🔄' },
      { to: '/campus/assets/audit',          label: 'Audit Logs',         icon: '🔒' },
    ],
  },

  // 9. Transport
  {
    label: 'Transport',
    icon: '🚌',
    children: [
      { to: '/campus/transport', label: 'Transport Management', icon: '🚌' },
    ],
  },

  // 10. Library
  {
    label: 'Library',
    icon: '📚',
    children: [
      { to: '/campus/library', label: 'Library Management', icon: '📚' },
    ],
  },

  // 11. Hostel
  {
    label: 'Hostel',
    icon: '🏨',
    children: [
      { to: '/campus/hostel', label: 'Hostel Management', icon: '🏨' },
    ],
  },

  // 12. Communication & Engagement
  {
    label: 'Communication',
    icon: '💬',
    children: [
      { to: '/campus/notifications', label: 'Notifications',    icon: '🔔' },
      { to: '/campus/messaging',     label: 'SMS & Email',      icon: '📧' },
      { to: '/campus/support',       label: 'Support Tickets',  icon: '🎫' },
    ],
  },

  // 13. Reports & Analytics
  {
    label: 'Reports & Analytics',
    icon: '📊',
    children: [
      { to: '/campus/reports',                label: 'Reports Hub',       icon: '📊' },
      { to: '/campus/reports/academic',       label: 'Academic Reports',  icon: '📚' },
      { to: '/campus/reports/attendance',     label: 'Attendance',        icon: '📅' },
      { to: '/campus/reports/campus-kpi',     label: 'Campus KPIs',       icon: '🏆' },
      { to: '/campus/reports/operational',    label: 'Operational',       icon: '⚙️' },
    ],
  },
]

export default function CampusLayout() {
  return (
    <PortalLayout
      portalName="Campus Portal"
      portalShortName="Campus"
      theme={theme}
      navItems={navItems}
    />
  )
}
