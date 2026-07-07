import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { SvgIconComponent } from '@mui/icons-material';
import { ROUTES } from '@/constants/routes';
import { MODULE_PERMISSIONS } from '@/config/rbac';

export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
  allowedRoles?: string[];
}

// One entry per top-level backend domain/controller. Order matches the
// business-domain analysis (Drivers first as the core entity, then the
// modules that hang off a driver, then Transporters/Notifications).
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: DashboardOutlinedIcon, allowedRoles: MODULE_PERMISSIONS.dashboard.read },
  { label: 'Drivers', path: ROUTES.DRIVERS, icon: PeopleAltOutlinedIcon, allowedRoles: MODULE_PERMISSIONS.drivers.read },
  { label: 'Licenses', path: ROUTES.LICENSES, icon: BadgeOutlinedIcon, allowedRoles: MODULE_PERMISSIONS.licenses.read },
  { label: 'Medical Records', path: ROUTES.MEDICAL, icon: FavoriteBorderOutlinedIcon, allowedRoles: MODULE_PERMISSIONS.medical.read },
  { label: 'Trainings', path: ROUTES.TRAININGS, icon: SchoolOutlinedIcon, allowedRoles: MODULE_PERMISSIONS.trainings.read },
  { label: 'Incidents', path: ROUTES.INCIDENTS, icon: ReportProblemOutlinedIcon, allowedRoles: MODULE_PERMISSIONS.incidents.read },
  { label: 'Plant Movements', path: ROUTES.PLANT_MOVEMENTS, icon: DirectionsCarFilledOutlinedIcon, allowedRoles: MODULE_PERMISSIONS.plantMovements.read },
  { label: 'Transporters', path: ROUTES.TRANSPORTERS, icon: LocalShippingOutlinedIcon, allowedRoles: MODULE_PERMISSIONS.transporters.read },
  { label: 'Notifications', path: ROUTES.NOTIFICATIONS, icon: NotificationsNoneOutlinedIcon, allowedRoles: MODULE_PERMISSIONS.notifications.read },
];
