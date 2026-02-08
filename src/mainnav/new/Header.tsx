import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HoverMenu from './HoverMenu';
import ProjectDetailsCard from './ProjectDetailsCard';
import BookmarksMenu from './FavoritesMenu';
import Tooltip from './Tooltip';

// --- Icon Definitions ---

// Base wrapper for small nav icons
const NavIconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={`w-6 h-6 ${className}`}
    >
        {children}
    </svg>
);

// Base wrapper for menu item icons (in hover menu)
const MenuIconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {children}
        </svg>
    </div>
);

// Base wrapper for large main category icons
const MainIconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className="relative w-[30.6px] h-[30.6px] flex items-center justify-center cursor-pointer z-50">
        <div className={`absolute w-[34px] h-[34px] rounded-md transform -rotate-6 shadow-lg ${className} opacity-80`}></div>
        <div className={`absolute w-[34px] h-[34px] rounded-md transform rotate-6 shadow-lg ${className} opacity-90`}></div>
        <div className={`absolute w-[30.6px] h-[30.6px] rounded-md flex items-center justify-center shadow-2xl ${className}`}>
             <NavIconWrapper className="text-white">
                {children}
            </NavIconWrapper>
        </div>
    </div>
);


// --- All Icons ---

// Project Management
const ProjectIcon = () => <NavIconWrapper><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></NavIconWrapper>;
const PortfolioIcon = () => <NavIconWrapper><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></NavIconWrapper>;
const PlannerIcon = () => <NavIconWrapper><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="m9 16 2 2 4-4" /></NavIconWrapper>;
const ScheduleIcon = () => <NavIconWrapper><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></NavIconWrapper>;

// Collaboration
const CommunicationIcon = () => <NavIconWrapper><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></NavIconWrapper>;
const DirectoryIcon = () => <NavIconWrapper><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></NavIconWrapper>;
const MyTeamIcon = () => <NavIconWrapper><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></NavIconWrapper>;

// Quality
const PunchlistIcon = () => <NavIconWrapper><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><polyline points="3 6 4 7 6 5"></polyline><polyline points="3 12 4 13 6 11"></polyline><polyline points="3 18 4 19 6 17"></polyline></NavIconWrapper>;
const ChecklistIcon = () => <NavIconWrapper><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="m9 14 2 2 4-4"/></NavIconWrapper>;

// Finance
const FinanceIcon = () => <NavIconWrapper><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></NavIconWrapper>;
const CostsIcon = () => <NavIconWrapper><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></NavIconWrapper>;
const ContractIcon = () => <NavIconWrapper><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="m16 14-2-2-2 2"/><path d="m10 10 2 2 2-2"/><path d="M14 2v6h6"/></NavIconWrapper>;
const ChangeOrderIcon = () => <NavIconWrapper><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M12 18a3 3 0 0 0 3-3 3 3 0 0 0-3-3 3 3 0 0 0-3 3c0 1.66 1.34 3 3 3Z"/><path d="M12 12v-1"/></NavIconWrapper>;

// Field & Site
const SiteIcon = () => <NavIconWrapper><path d="m12 13.4-4.5 4.5" /><path d="m18 17.1-4.5-4.5" /><path d="m12 3-4.5 4.5" /><path d="m18 7.5-4.5-4.5" /><path d="M21 11.5a8.38 8.38 0 0 1-3.6 7.4l-4.9-4.9" /><path d="M3 11.5a8.38 8.38 0 0 0 3.6 7.4l4.9-4.9" /><path d="M12 21a8.38 8.38 0 0 0 7.4-3.6" /><path d="M12 3a8.38 8.38 0 0 1 7.4 3.6" /></NavIconWrapper>;
const FieldIcon = () => <NavIconWrapper><path d="M20.5 14.5A4.5 4.5 0 0 0 21 12V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6c0 1.2.4 2.4 1.2 3.2L7 18.5V21h10v-2.5l2.8-2.8H21z"/><path d="M7 15h10"/></NavIconWrapper>;
const EquipmentIcon = () => <NavIconWrapper><path d="M5 18H3c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2h-2"/><path d="M17 18h-2v-4.3c0-.6.4-1.2 1-1.4l1-.4c.6-.2 1.2.2 1.4 1l.6 1.7"/><path d="M17 18H9"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></NavIconWrapper>;
const SafetyIcon = () => <NavIconWrapper><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></NavIconWrapper>;
const AnalyticsIcon = () => <NavIconWrapper><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></NavIconWrapper>;
const FeedsIcon = () => <NavIconWrapper><path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" /></NavIconWrapper>;

// Documentation
const DocumentIcon = () => <NavIconWrapper><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></NavIconWrapper>;
const PlansIcon = () => <NavIconWrapper><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><path d="M18 3v5h5"/><path d="M8 18h8"/><path d="M8 14h8"/><path d="M8 10h3"/></NavIconWrapper>;
const RFIIcon = () => <NavIconWrapper><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><circle cx="12" cy="14" r="1"/><path d="M12 10a2 2 0 0 1-2-2c0-1.5.5-3 3-3s3 1.5 3 3"/></NavIconWrapper>;
const SubmittalsIcon = () => <NavIconWrapper><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></NavIconWrapper>;
const SpecbookIcon = () => <NavIconWrapper><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></NavIconWrapper>;

// General Icons
const ReportsIcon = () => <NavIconWrapper><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></NavIconWrapper>;
const SearchIcon = () => <NavIconWrapper><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></NavIconWrapper>;
const ChatIcon = () => <NavIconWrapper><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="15" y1="10" x2="15.01" y2="10"></line><line x1="11" y1="10" x2="11.01" y2="10"></line><line x1="7" y1="10" x2="7.01" y2="10"></line></NavIconWrapper>;
const HelpIcon = () => <NavIconWrapper><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></NavIconWrapper>;
const BellIcon = () => <NavIconWrapper><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></NavIconWrapper>;
const MenuIcon = () => <NavIconWrapper><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></NavIconWrapper>;
const XIcon = () => <NavIconWrapper><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></NavIconWrapper>;


// --- Main Category Icons ---
const ProjectManagementMainIcon = () => <MainIconWrapper className="bg-orange-500"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></MainIconWrapper>;
const CollaborationMainIcon = () => <MainIconWrapper className="bg-sky-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></MainIconWrapper>;
const QualityMainIcon = () => <MainIconWrapper className="bg-rose-500"><polyline points="3 6 4 7 6 5"></polyline><polyline points="3 12 4 13 6 11"></polyline><polyline points="3 18 4 19 6 17"></polyline><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line></MainIconWrapper>;
const FinanceMainIcon = () => <MainIconWrapper className="bg-green-500"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></MainIconWrapper>;
const FieldOpsMainIcon = () => <MainIconWrapper className="bg-amber-500"><path d="M20.5 14.5A4.5 4.5 0 0 0 21 12V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6c0 1.2.4 2.4 1.2 3.2L7 18.5V21h10v-2.5l2.8-2.8H21z"/><path d="M7 15h10"/></MainIconWrapper>;
const DocumentationMainIcon = () => <MainIconWrapper className="bg-cyan-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></MainIconWrapper>;
const BookmarksMainIcon = () => <MainIconWrapper className="bg-yellow-500"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></MainIconWrapper>;

// --- Navigation Data Structure ---

// Fix: Add explicit type definitions for navigation data to resolve TypeScript error.
// These types match the props expected by HoverMenu.tsx.
interface PrimaryMenuItemData {
    key: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    navIcon: React.ReactNode;
}

interface MoreItem {
    key: 'more';
    title: 'More';
    items: string[];
}

interface StandardCategoryData {
    key: string;
    title: string;
    mainIcon: React.ReactNode;
    items: PrimaryMenuItemData[];
}

type CategoryData = StandardCategoryData | MoreItem;


const navigationData: { [key: string]: CategoryData } = {
    projectManagement: {
        key: 'projectManagement', title: 'Project Management', mainIcon: <ProjectManagementMainIcon/>,
        items: [
            { key: 'project', label: 'Project', description: 'Core project management', icon: <MenuIconWrapper className="bg-orange-100 text-orange-600"><ProjectIcon/></MenuIconWrapper>, navIcon: <ProjectIcon/> },
            { key: 'portfolio', label: 'Portfolio', description: 'Oversee multiple projects', icon: <MenuIconWrapper className="bg-gray-100 text-gray-600"><PortfolioIcon/></MenuIconWrapper>, navIcon: <PortfolioIcon/> },
            { key: 'planner', label: 'Planner', description: 'Task and milestone planning', icon: <MenuIconWrapper className="bg-blue-100 text-blue-600"><PlannerIcon/></MenuIconWrapper>, navIcon: <PlannerIcon/> },
            { key: 'schedule', label: 'Schedule', description: 'Detailed project timelines', icon: <MenuIconWrapper className="bg-purple-100 text-purple-600"><ScheduleIcon/></MenuIconWrapper>, navIcon: <ScheduleIcon/> },
        ]
    },
    collaboration: {
        key: 'collaboration', title: 'Collaboration', mainIcon: <CollaborationMainIcon/>,
        items: [
            { key: 'communication', label: 'Communication', description: 'Team messaging and updates', icon: <MenuIconWrapper className="bg-sky-100 text-sky-600"><CommunicationIcon/></MenuIconWrapper>, navIcon: <CommunicationIcon/> },
            { key: 'directory', label: 'Directory', description: 'Contact info for stakeholders', icon: <MenuIconWrapper className="bg-sky-100 text-sky-600"><DirectoryIcon/></MenuIconWrapper>, navIcon: <DirectoryIcon/> },
            { key: 'myTeam', label: 'My Team', description: 'Manage your direct team', icon: <MenuIconWrapper className="bg-sky-100 text-sky-600"><MyTeamIcon/></MenuIconWrapper>, navIcon: <MyTeamIcon/> },
        ]
    },
    quality: {
        key: 'quality', title: 'Quality', mainIcon: <QualityMainIcon/>,
        items: [
            { key: 'punchlist', label: 'Punchlist', description: 'Track and resolve issues', icon: <MenuIconWrapper className="bg-rose-100 text-rose-600"><PunchlistIcon/></MenuIconWrapper>, navIcon: <PunchlistIcon/> },
            { key: 'checklist', label: 'Checklist', description: 'Ensure standards are met', icon: <MenuIconWrapper className="bg-rose-100 text-rose-600"><ChecklistIcon/></MenuIconWrapper>, navIcon: <ChecklistIcon/> },
        ]
    },
    finance: {
        key: 'finance', title: 'Finance & Cost Control', mainIcon: <FinanceMainIcon/>,
        items: [
            { key: 'finance', label: 'Finance', description: 'Main financial dashboard', icon: <MenuIconWrapper className="bg-green-100 text-green-600"><FinanceIcon/></MenuIconWrapper>, navIcon: <FinanceIcon/> },
            { key: 'costs', label: 'Costs', description: 'Track all project expenses', icon: <MenuIconWrapper className="bg-green-100 text-green-600"><CostsIcon/></MenuIconWrapper>, navIcon: <CostsIcon/> },
            { key: 'contract', label: 'Contract', description: 'Manage contracts and vendors', icon: <MenuIconWrapper className="bg-green-100 text-green-600"><ContractIcon/></MenuIconWrapper>, navIcon: <ContractIcon/> },
            { key: 'changeOrder', label: 'Change Order', description: 'Handle contract modifications', icon: <MenuIconWrapper className="bg-teal-100 text-teal-600"><ChangeOrderIcon/></MenuIconWrapper>, navIcon: <ChangeOrderIcon/> },
        ]
    },
    fieldOps: {
        key: 'fieldOps', title: 'Field & Site Operations', mainIcon: <FieldOpsMainIcon/>,
        items: [
            { key: 'site', label: 'Site', description: 'Daily site management tools', icon: <MenuIconWrapper className="bg-orange-100 text-orange-600"><SiteIcon/></MenuIconWrapper>, navIcon: <SiteIcon/> },
            { key: 'field', label: 'Field', description: 'Reports and data collection', icon: <MenuIconWrapper className="bg-amber-100 text-amber-600"><FieldIcon/></MenuIconWrapper>, navIcon: <FieldIcon/> },
            { key: 'equipment', label: 'Equipment', description: 'Track and manage equipment', icon: <MenuIconWrapper className="bg-amber-100 text-amber-600"><EquipmentIcon/></MenuIconWrapper>, navIcon: <EquipmentIcon/> },
            { key: 'safety', label: 'Safety', description: 'Compliance and reports', icon: <MenuIconWrapper className="bg-amber-100 text-amber-600"><SafetyIcon/></MenuIconWrapper>, navIcon: <SafetyIcon/> },
            { key: 'analytics', label: 'Analytics', description: 'Field data and insights', icon: <MenuIconWrapper className="bg-indigo-100 text-indigo-600"><AnalyticsIcon/></MenuIconWrapper>, navIcon: <AnalyticsIcon/> },
            { key: 'feeds', label: 'Feeds', description: 'Real-time project updates', icon: <MenuIconWrapper className="bg-yellow-100 text-yellow-600"><FeedsIcon/></MenuIconWrapper>, navIcon: <FeedsIcon/> },
        ]
    },
    documentation: {
        key: 'documentation', title: 'Documentation', mainIcon: <DocumentationMainIcon/>,
        items: [
            { key: 'document', label: 'Document', description: 'Central document repository', icon: <MenuIconWrapper className="bg-cyan-100 text-cyan-600"><DocumentIcon/></MenuIconWrapper>, navIcon: <DocumentIcon/> },
            { key: 'plans', label: 'Plans', description: 'View and manage blueprints', icon: <MenuIconWrapper className="bg-blue-100 text-blue-600"><PlansIcon/></MenuIconWrapper>, navIcon: <PlansIcon/> },
            { key: 'rfi', label: 'RFI', description: 'Manage requests for information', icon: <MenuIconWrapper className="bg-cyan-100 text-cyan-600"><RFIIcon/></MenuIconWrapper>, navIcon: <RFIIcon/> },
            { key: 'submittals', label: 'Submittals', description: 'Track and approve submittals', icon: <MenuIconWrapper className="bg-cyan-100 text-cyan-600"><SubmittalsIcon/></MenuIconWrapper>, navIcon: <SubmittalsIcon/> },
            { key: 'specbook', label: 'Specbook', description: 'Review project specifications', icon: <MenuIconWrapper className="bg-cyan-100 text-cyan-600"><SpecbookIcon/></MenuIconWrapper>, navIcon: <SpecbookIcon/> },
        ]
    },
    more: {
        key: 'more' as const, title: 'More',
        items: ['Reports', 'Configure']
    }
};

const menuLayout = {
    column1: ['projectManagement', 'collaboration', 'quality'],
    column2: ['finance', 'fieldOps'],
    column3: ['documentation', 'more'],
};

// --- Project Data ---
const projects = [
  {
    id: 'big-mall',
    name: 'Big Mall',
    details: [
      "4900 Moorpark Ave #326, San Jose, CA 95127, USA",
      "Owner - Build Enterprises",
      "GC - A to Z construction",
      "PM - Max Anderson",
      "+1 56535 - 7878"
    ]
  },
  {
    id: 'downtown-tower',
    name: 'Downtown Tower',
    details: [
      "123 Main St, San Francisco, CA 94105, USA",
      "Owner - Skyline Corp",
      "GC - Apex Builders",
      "PM - Jane Doe",
      "+1 415-555-1234"
    ]
  },
  {
    id: 'suburban-complex',
    name: 'Suburban Complex',
    details: [
      "789 Oak Rd, Palo Alto, CA 94301, USA",
      "Owner - Greenfield Dev",
      "GC - Summit Construction",
      "PM - John Smith",
      "+1 650-555-5678"
    ]
  }
];

type Project = typeof projects[0];


interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    activeColor?: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive = false, activeColor = 'text-white', onClick }) => (
    <a href="#" onClick={onClick} className={`flex flex-col items-center gap-2 transition-colors duration-200 ${isActive ? activeColor : 'text-gray-300 hover:text-white'}`}>
        {icon}
        <span className={`text-[12.3px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
    </a>
);

// --- New ProjectSelector Component ---

const ChevronDownIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m6 9 6 6 6-6"/>
    </svg>
);

const CheckIcon = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M20 6 9 17l-5-5"/>
    </svg>
);


interface ProjectSelectorProps {
    projects: Project[];
    selectedProject: Project;
    onSelectProject: (project: Project) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ projects, selectedProject, onSelectProject }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [selectorRef]);

    return (
        <Tooltip content={`Project: ${selectedProject.name}`} position="bottom" delay={400} disabled={isOpen}>
            <div className="relative" ref={selectorRef}>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1.5 px-2 py-1 text-[12.25px] bg-transparent hover:bg-gray-700/50 rounded-md transition-all border border-transparent hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 touch-manipulation group"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-label="Select project"
                >
                    <span className="text-gray-300 text-[11.5px] font-medium uppercase tracking-wide whitespace-nowrap">Project:</span>
                    <span className="font-semibold text-white whitespace-nowrap">{selectedProject.name}</span>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDownIcon className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
                    </motion.div>
                </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 5 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-10 left-0 md:left-auto right-0 md:right-auto w-[calc(100vw-4rem)] md:w-max md:min-w-full mt-1 bg-[#2a2a2a] border border-gray-600 rounded-md shadow-lg max-w-[280px] md:max-w-none"
                    >
                        <ul className="p-1" role="listbox">
                            {projects.map(project => (
                                <li 
                                    key={project.id}
                                    className="text-[12.25px] text-gray-200 rounded-sm hover:bg-cyan-600 hover:text-white cursor-pointer touch-manipulation min-h-[44px] flex items-center"
                                    onClick={() => {
                                        onSelectProject(project);
                                        setIsOpen(false);
                                    }}
                                    role="option"
                                    aria-selected={project.id === selectedProject.id}
                                >
                                    <div className="flex items-center justify-between px-3 py-2 md:px-2 md:py-1 w-full">
                                        <span>{project.name}</span>
                                        {project.id === selectedProject.id && <CheckIcon className="w-4 h-4"/>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
            </div>
        </Tooltip>
    );
};


type StandardCategoryKey = Exclude<keyof typeof navigationData, 'more'>;
type CategoryKeyWithBookmarks = StandardCategoryKey | 'bookmarks';

const categoryAbbreviations: { [key in CategoryKeyWithBookmarks]: string } = {
    projectManagement: 'PM',
    collaboration: 'Team',
    quality: 'Quality',
    finance: 'Finance',
    fieldOps: 'Field',
    documentation: 'Docs',
    bookmarks: 'Bookmarks',
};

interface HeaderProps {
    onSelectionChange: (title: string) => void;
    version?: 'v1' | 'v2';
    onBookmarksDataChange?: (data: {
        bookmarks: Array<{
            categoryKey: string;
            itemKey: string;
            label: string;
            description: string;
            icon: React.ReactNode;
            navIcon: React.ReactNode;
        }>;
        toggleBookmark: (categoryKey: string, itemKey: string) => void;
        handleSelect: (categoryKey: string, subcategoryKey: string) => void;
    }) => void;
    onToggleVersion?: () => void;
}

// Bookmarks management with localStorage
const BOOKMARKS_STORAGE_KEY = 'linarc-bookmarks';

const useBookmarks = () => {
    const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        }
        return new Set();
    });

    const toggleBookmark = (categoryKey: string, itemKey: string) => {
        const bookmarkKey = `${categoryKey}:${itemKey}`;
        setBookmarks(prev => {
            const newBookmarks = new Set(prev);
            if (newBookmarks.has(bookmarkKey)) {
                newBookmarks.delete(bookmarkKey);
            } else {
                newBookmarks.add(bookmarkKey);
            }
            if (typeof window !== 'undefined') {
                localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(Array.from(newBookmarks)));
            }
            return newBookmarks;
        });
    };

    const getBookmarkItems = (navigationData: { [key: string]: CategoryData }): Array<{
        categoryKey: string;
        itemKey: string;
        label: string;
        description: string;
        icon: React.ReactNode;
        navIcon: React.ReactNode;
    }> => {
        const bookmarkItems: Array<{
            categoryKey: string;
            itemKey: string;
            label: string;
            description: string;
            icon: React.ReactNode;
            navIcon: React.ReactNode;
        }> = [];

        bookmarks.forEach(bookmarkKey => {
            const [categoryKey, itemKey] = bookmarkKey.split(':');
            const category = navigationData[categoryKey];
            if (category && 'items' in category && category.key !== 'more') {
                const standardCategory = category as StandardCategoryData;
                const item: PrimaryMenuItemData | undefined = standardCategory.items.find((i: PrimaryMenuItemData) => i.key === itemKey);
                if (item) {
                    bookmarkItems.push({
                        categoryKey,
                        itemKey,
                        label: item.label,
                        description: item.description,
                        icon: item.icon,
                        navIcon: item.navIcon,
                    });
                }
            }
        });

        return bookmarkItems;
    };

    return { bookmarks, toggleBookmark, getBookmarkItems };
};

const Header: React.FC<HeaderProps> = ({ onSelectionChange, version = 'v1', onBookmarksDataChange, onToggleVersion }) => {
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [isBookmarksMenuVisible, setBookmarksMenuVisible] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileProjectSelectorOpen, setIsMobileProjectSelectorOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [activeCategoryKey, setActiveCategoryKey] = useState<StandardCategoryKey>('documentation');
    const [activeSubcategoryKey, setActiveSubcategoryKey] = useState<string>('document');
    const [selectedProject, setSelectedProject] = useState<Project>(projects[0]);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const mobileProjectSelectorRef = useRef<HTMLDivElement>(null);
    const hoverMenuRef = useRef<HTMLDivElement>(null);
    const bookmarksMenuRef = useRef<HTMLDivElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const { bookmarks, toggleBookmark, getBookmarkItems } = useBookmarks();

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const categoryColors: { [key: string]: string } = {
        projectManagement: 'text-orange-500',
        collaboration: 'text-sky-500',
        quality: 'text-rose-500',
        finance: 'text-green-500',
        fieldOps: 'text-amber-500',
        documentation: 'text-cyan-500',
        bookmarks: 'text-yellow-500',
    };

    const bookmarkItems = getBookmarkItems(navigationData);

    // FIX: Add type guard to safely access properties on `category`.
    // This ensures `category` is a `StandardCategoryData` before we try to find an item in its `items` array.
    const handleSelect = useCallback((categoryKey: string, subcategoryKey: string) => {
        if (categoryKey !== 'more') {
            const category = navigationData[categoryKey];
            if ('mainIcon' in category) { // Type guard
                const subcategory = category.items.find(item => item.key === subcategoryKey);

                if (subcategory) {
                    setActiveCategoryKey(categoryKey as StandardCategoryKey);
                    setActiveSubcategoryKey(subcategoryKey);
                    onSelectionChange(`${category.title} / ${subcategory.label}`);
                }
            }
        }
        setMenuVisible(false);
        setBookmarksMenuVisible(false);
    }, [navigationData, onSelectionChange]);

    // Expose bookmarks data to parent for v2 sidebar integration
    useEffect(() => {
        if (version === 'v2' && onBookmarksDataChange) {
            onBookmarksDataChange({
                bookmarks: bookmarkItems,
                toggleBookmark,
                handleSelect
            });
        }
    }, [version, bookmarkItems, toggleBookmark, onBookmarksDataChange, handleSelect]);

    const handleProjectSelect = (project: Project) => {
        setSelectedProject(project);
    };

    // Close mobile menu on outside click or ESC key
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
            // Close mobile project selector when clicking outside
            if (mobileProjectSelectorRef.current && !mobileProjectSelectorRef.current.contains(event.target as Node)) {
                setIsMobileProjectSelectorOpen(false);
            }
            // Close hover menu on mobile when clicking outside
            if (isMobile && hoverMenuRef.current && !hoverMenuRef.current.contains(event.target as Node)) {
                setMenuVisible(false);
            }
            // Close bookmarks menu when clicking outside
            if (bookmarksMenuRef.current && !bookmarksMenuRef.current.contains(event.target as Node)) {
                setBookmarksMenuVisible(false);
            }
            // Close profile menu when clicking outside
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMobileMenuOpen(false);
                setIsMobileProjectSelectorOpen(false);
                setIsProfileMenuOpen(false);
                if (isMobile) {
                    setMenuVisible(false);
                }
            }
        };

        if (isMobileMenuOpen || isMobileProjectSelectorOpen || isProfileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
            if (isMobileMenuOpen) {
                document.body.style.overflow = 'hidden'; // Prevent body scroll when menu is open
            }
        } else if (isMobile && isMenuVisible) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            if (isMobileMenuOpen) {
                document.body.style.overflow = '';
            }
        };
    }, [isMobileMenuOpen, isMobileProjectSelectorOpen, isMobile, isMenuVisible, isBookmarksMenuVisible]);

    const activeCategory = navigationData[activeCategoryKey];

    // FIX: Add a type guard to ensure activeCategory is of type StandardCategoryData.
    // This resolves errors related to accessing properties like `mainIcon` and iterating over `items`
    // which are not guaranteed to exist on the general `CategoryData` type.
    if (!('mainIcon' in activeCategory)) {
        // This path should be unreachable given the state logic, but it's needed for type safety.
        return null;
    }

    const navItems = activeCategory.items;
    const activeColor = categoryColors[activeCategoryKey] || 'text-white';

    // Version-specific styling
    const headerClasses = version === 'v1' 
        ? "bg-[#1e1e1e] text-white font-['Lato'] shadow-lg min-h-[80px] md:h-[80px] border-b-[3px] border-gray-800"
        : "bg-[#1a1a1a] text-white font-['Lato'] shadow-xl min-h-[80px] md:h-[80px] border-b-2 border-cyan-500/50";
    
    const hoverMenuClasses = version === 'v1'
        ? "hover:bg-gray-800/50"
        : "hover:bg-cyan-900/30";
    
    const bookmarksMenuClasses = version === 'v1'
        ? "hover:bg-gray-700/50"
        : "hover:bg-cyan-900/30";
    
    const projectPanelClasses = version === 'v1'
        ? "bg-[#252525]/50 rounded-lg border border-gray-700/50"
        : "bg-[#252525]/70 rounded-lg border border-cyan-600/30";
    
    const chevronBgClasses = version === 'v1'
        ? "bg-[#1e1e1e]"
        : "bg-[#1a1a1a]";

    return (
        <header className={headerClasses}>
            <div className="pl-2 pr-2 md:pr-0 pt-2 pb-2 flex items-center h-full">
                {/* Left & Center Nav Items */}
                <div className="flex items-center gap-x-4 md:gap-x-6 flex-1 min-w-0">
                    {/* Main Category Menu */}
                    <div 
                        ref={hoverMenuRef}
                        className={`relative flex flex-col items-center gap-1 px-2 py-1 rounded-md ${hoverMenuClasses} transition-colors cursor-pointer group shrink-0`}
                        style={{ width: '74px' }}
                        onMouseEnter={() => {
                            if (!isMobile) {
                                setMenuVisible(true);
                                setBookmarksMenuVisible(false);
                            }
                        }}
                        onMouseLeave={() => !isMobile && setMenuVisible(false)}
                        onClick={() => {
                            if (isMobile) {
                                setMenuVisible(!isMenuVisible);
                                setBookmarksMenuVisible(false);
                            }
                        }}
                        role="button"
                        aria-haspopup="true"
                        aria-expanded={isMenuVisible}
                        aria-label={`${activeCategory.title} menu`}
                    >
                        <div className="relative flex items-center justify-center">
                            {activeCategory.mainIcon}
                            <motion.div
                                animate={{ rotate: isMenuVisible ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className={`absolute -bottom-1 ${chevronBgClasses} rounded-full p-0.5 z-[60]`}
                                style={{ right: '-8px' }}
                            >
                                <ChevronDownIcon className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" style={{ marginLeft: '0px', marginRight: '0px' }} />
                            </motion.div>
                        </div>
                        <span className="text-[11px] font-medium text-white whitespace-nowrap">{categoryAbbreviations[activeCategoryKey]}</span>
                        <div className="absolute top-full h-4 w-full" />
                        <AnimatePresence>
                            {isMenuVisible && 
                                <HoverMenu 
                                    navigationData={navigationData}
                                    menuLayout={menuLayout}
                                    onSelect={handleSelect}
                                    bookmarks={bookmarks}
                                    onToggleBookmark={toggleBookmark}
                                />
                            }
                        </AnimatePresence>
                    </div>
                    {/* Bookmarks Button - Only for v1 */}
                    {version === 'v1' && (
                    <div 
                        ref={bookmarksMenuRef}
                        className={`relative flex flex-col items-center gap-1 px-2 py-1 rounded-md ${bookmarksMenuClasses} transition-colors cursor-pointer group shrink-0`}
                        onMouseEnter={() => {
                            if (!isMobile) {
                                setBookmarksMenuVisible(true);
                                setMenuVisible(false);
                            }
                        }}
                        onMouseLeave={() => !isMobile && setBookmarksMenuVisible(false)}
                        onClick={() => {
                            if (isMobile) {
                                setBookmarksMenuVisible(!isBookmarksMenuVisible);
                                setMenuVisible(false);
                            }
                        }}
                        role="button"
                        aria-haspopup="true"
                        aria-expanded={isBookmarksMenuVisible}
                        aria-label="Bookmarks menu"
                    >
                        <div className="relative flex items-center justify-center">
                            <BookmarksMainIcon />
                            <motion.div
                                animate={{ rotate: isBookmarksMenuVisible ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className={`absolute -bottom-1 ${chevronBgClasses} rounded-full p-0.5`}
                                style={{ right: '-12px' }}
                            >
                                <ChevronDownIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" style={{ marginLeft: '0px', marginRight: '0px' }} />
                            </motion.div>
                        </div>
                        <span className="text-[11px] font-medium text-white whitespace-nowrap">{categoryAbbreviations.bookmarks}</span>
                        <div className="absolute top-full h-4 w-full" />
                        <AnimatePresence>
                            {isBookmarksMenuVisible && 
                                <BookmarksMenu 
                                    bookmarks={bookmarkItems}
                                    onSelect={handleSelect}
                                    onToggleBookmark={toggleBookmark}
                                />
                            }
                        </AnimatePresence>
                    </div>
                    )}
                    <nav className="hidden md:block flex-1 min-w-0">
                        <ul className="flex items-center gap-x-5 lg:gap-x-7 xl:gap-x-8">
                            {navItems.map((item) => (
                                <li key={item.key}>
                                    <NavItem 
                                        icon={item.navIcon} 
                                        label={item.label}
                                        isActive={item.key === activeSubcategoryKey}
                                        activeColor={activeColor}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setActiveSubcategoryKey(item.key);
                                            onSelectionChange(`${activeCategory.title} / ${item.label}`);
                                        }}
                                    />
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                {/* Mobile Project Selector Button */}
                <div className="md:hidden relative" ref={mobileProjectSelectorRef}>
                    <Tooltip content={`Project: ${selectedProject.name}`} position="bottom" delay={400} disabled={isMobileProjectSelectorOpen}>
                        <button
                            onClick={() => {
                                setIsMobileProjectSelectorOpen(!isMobileProjectSelectorOpen);
                                setIsMobileMenuOpen(false);
                            }}
                            className="text-gray-300 hover:text-white transition-colors duration-200 touch-manipulation p-2 -mr-2"
                            aria-label="Select project"
                            aria-expanded={isMobileProjectSelectorOpen}
                        >
                            <ProjectIcon />
                        </button>
                    </Tooltip>
                    
                    {/* Mobile Project Selector Dropdown */}
                    <AnimatePresence>
                        {isMobileProjectSelectorOpen && (
                            <>
                                {/* Backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                                    onClick={() => setIsMobileProjectSelectorOpen(false)}
                                />
                                
                                {/* Dropdown Panel */}
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="fixed right-2 top-[90px] w-[calc(100vw-1rem)] max-w-[320px] bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-xl z-50 md:hidden max-h-[calc(100vh-110px)] overflow-y-auto"
                                >
                                    {/* Project Selection */}
                                    <div className="p-3 border-b border-gray-700">
                                        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Select Project</div>
                                        <ul className="space-y-1">
                                            {projects.map(project => (
                                                <li 
                                                    key={project.id}
                                                    className="text-sm text-gray-200 rounded-md hover:bg-cyan-600 hover:text-white cursor-pointer touch-manipulation min-h-[44px] flex items-center"
                                                    onClick={() => {
                                                        handleProjectSelect(project);
                                                        setIsMobileProjectSelectorOpen(false);
                                                    }}
                                                    role="option"
                                                    aria-selected={project.id === selectedProject.id}
                                                >
                                                    <div className="flex items-center justify-between px-3 py-2.5 w-full">
                                                        <span className="font-medium">{project.name}</span>
                                                        {project.id === selectedProject.id && <CheckIcon className="w-4 h-4 text-cyan-500"/>}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    
                                    {/* Project Details */}
                                    <div className="p-3 space-y-3">
                                        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Project Details</div>
                                        <div className="space-y-2.5 text-[12.25px]">
                                            {selectedProject.details[0] && (
                                                <div className="flex items-start gap-2.5">
                                                    <div className="mt-0.5 text-gray-500 shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                            <circle cx="12" cy="10" r="3"></circle>
                                                        </svg>
                                                    </div>
                                                    <div className="text-gray-300 flex-1">
                                                        <div className="font-medium text-gray-400 mb-0.5 text-[11px]">Address</div>
                                                            <div className="text-[12px]">{selectedProject.details[0]}</div>
                                                        </div>
                                                </div>
                                            )}
                                            {selectedProject.details[1] && (
                                                <div className="flex items-start gap-2.5">
                                                    <div className="mt-0.5 text-gray-500 shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
                                                            <path d="M6 12h4"></path>
                                                            <path d="M6 16h4"></path>
                                                            <path d="M10 4h4"></path>
                                                            <path d="M10 8h4"></path>
                                                            <path d="M10 12h4"></path>
                                                            <path d="M10 16h4"></path>
                                                        </svg>
                                                    </div>
                                                    <div className="text-gray-300 flex-1">
                                                        <div className="font-medium text-gray-400 mb-0.5 text-[11px]">Owner</div>
                                                        <div className="text-[12px]">{selectedProject.details[1].replace('Owner - ', '')}</div>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedProject.details[2] && (
                                                <div className="flex items-start gap-2.5">
                                                    <div className="mt-0.5 text-gray-500 shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
                                                            <path d="M6 12h4"></path>
                                                            <path d="M6 16h4"></path>
                                                            <path d="M10 4h4"></path>
                                                            <path d="M10 8h4"></path>
                                                            <path d="M10 12h4"></path>
                                                            <path d="M10 16h4"></path>
                                                        </svg>
                                                    </div>
                                                    <div className="text-gray-300 flex-1">
                                                        <div className="font-medium text-gray-400 mb-0.5 text-[11px]">General Contractor</div>
                                                        <div className="text-[12px]">{selectedProject.details[2].replace('GC - ', '')}</div>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedProject.details[3] && (
                                                <div className="flex items-start gap-2.5">
                                                    <div className="mt-0.5 text-gray-500 shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="12" cy="7" r="4"></circle>
                                                        </svg>
                                                    </div>
                                                    <div className="text-gray-300 flex-1">
                                                        <div className="font-medium text-gray-400 mb-0.5 text-[11px]">Project Manager</div>
                                                        <div className="text-[12px]">{selectedProject.details[3].replace('PM - ', '')}</div>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedProject.details[4] && (
                                                <div className="flex items-start gap-2.5">
                                                    <div className="mt-0.5 text-gray-500 shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                        </svg>
                                                    </div>
                                                    <div className="text-gray-300 flex-1">
                                                        <div className="font-medium text-gray-400 mb-0.5 text-[11px]">Phone</div>
                                                        <div className="text-[12px]">{selectedProject.details[4]}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Hamburger Menu Button - Mobile Only */}
                <button
                    onClick={() => {
                        setIsMobileMenuOpen(true);
                        setIsMobileProjectSelectorOpen(false);
                    }}
                    className="md:hidden text-gray-300 hover:text-white transition-colors duration-200 touch-manipulation p-2 -mr-2"
                    aria-label="Open menu"
                    aria-expanded={isMobileMenuOpen}
                >
                    <MenuIcon />
                </button>

                {/* Right Section: Action Icons + Project Panel */}
                <div className="hidden md:flex items-center h-full shrink-0">
                    {/* Project Panel */}
                    <div className={`flex items-center gap-2 pr-3 lg:pr-4 pl-2.5 ${projectPanelClasses} py-1.5`}>
                        <ProjectSelector
                            projects={projects}
                            selectedProject={selectedProject}
                            onSelectProject={handleProjectSelect}
                        />
                        <ProjectDetailsCard project={selectedProject} />
                    </div>

                    {/* Vertical Divider */}
                    <div className="h-7 w-px bg-gray-700 ml-3 lg:ml-4 mr-3 lg:mr-4"></div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-x-3 lg:gap-x-4 pr-3 lg:pr-4">
                        <Tooltip content="Search" position="bottom" delay={400}>
                            <button className="text-gray-300 hover:text-white transition-colors duration-200 touch-manipulation" aria-label="Search">
                                <SearchIcon />
                            </button>
                        </Tooltip>
                        <Tooltip content="Chat" position="bottom" delay={400}>
                            <button className="text-gray-300 hover:text-white transition-colors duration-200 touch-manipulation" aria-label="Chat">
                                <ChatIcon />
                            </button>
                        </Tooltip>
                        <Tooltip content="Help" position="bottom" delay={400}>
                            <button className="text-gray-300 hover:text-white transition-colors duration-200 touch-manipulation" aria-label="Help">
                                <HelpIcon />
                            </button>
                        </Tooltip>
                        <Tooltip content="Notifications" position="left" delay={400}>
                            <button className="text-gray-300 hover:text-white transition-colors duration-200 touch-manipulation" aria-label="Notifications">
                                <BellIcon />
                            </button>
                        </Tooltip>
                        
                        <div className="relative" ref={profileMenuRef}>
                            <Tooltip content="User Profile" position="left" delay={400} disabled={isProfileMenuOpen}>
                                <button 
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="w-9 h-9 rounded-full bg-black border border-gray-600 flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
                                    </svg>
                                </button>
                            </Tooltip>
                            <AnimatePresence>
                                {isProfileMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                        transition={{ duration: 0.1 }}
                                        className="absolute right-0 top-full mt-2 w-56 bg-[#2a2a2a] border border-gray-600 rounded-lg shadow-xl z-[100] overflow-hidden"
                                    >
                                        <div className="p-3 border-b border-gray-700">
                                            <div className="text-sm font-medium text-white">User Profile</div>
                                            <div className="text-xs text-gray-400">user@example.com</div>
                                        </div>
                                        <div className="p-1">
                                            <button
                                                onClick={() => {
                                                    onToggleVersion?.();
                                                    setIsProfileMenuOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                                                </svg>
                                                Switch to Header {version === 'v1' ? 'V2' : 'V1'}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Slide-Out Panel */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop/Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        
                        {/* Slide-Out Panel */}
                        <motion.div
                            ref={mobileMenuRef}
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-[280px] max-w-[85vw] bg-[#1e1e1e] shadow-2xl z-50 md:hidden flex flex-col"
                        >
                            {/* Header with Close Button */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                                <h2 className="text-lg font-semibold text-white">Menu</h2>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-gray-300 hover:text-white transition-colors duration-200 touch-manipulation p-2"
                                    aria-label="Close menu"
                                >
                                    <XIcon />
                                </button>
                            </div>

                            {/* Menu Items */}
                            <div className="flex-1 overflow-y-auto py-4">
                                <div className="space-y-1 px-2">
                                    {/* Project Selector Section */}
                                    <div className="mb-4 pb-4 border-b border-gray-700">
                                        <div className="px-4 mb-2">
                                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Project</div>
                                        </div>
                                        <div className="px-2">
                                            <ProjectSelector
                                                projects={projects}
                                                selectedProject={selectedProject}
                                                onSelectProject={(project) => {
                                                    handleProjectSelect(project);
                                                }}
                                            />
                                        </div>
                                        <div className="px-2 mt-2">
                                            <ProjectDetailsCard project={selectedProject} />
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            // Add search functionality here
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 touch-manipulation text-left"
                                        aria-label="Search"
                                    >
                                        <SearchIcon />
                                        <span className="text-sm font-medium">Search</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            // Add chat functionality here
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 touch-manipulation text-left"
                                        aria-label="Chat"
                                    >
                                        <ChatIcon />
                                        <span className="text-sm font-medium">Chat</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            // Add help functionality here
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 touch-manipulation text-left"
                                        aria-label="Help"
                                    >
                                        <HelpIcon />
                                        <span className="text-sm font-medium">Help</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            // Add notifications functionality here
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 touch-manipulation text-left"
                                        aria-label="Notifications"
                                    >
                                        <BellIcon />
                                        <span className="text-sm font-medium">Notifications</span>
                                    </button>
                                </div>
                            </div>

                            {/* User Profile Section */}
                            <div className="border-t border-gray-700 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-black border border-gray-600 flex items-center justify-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white truncate">User Profile</div>
                                        <div className="text-xs text-gray-400 truncate">user@example.com</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;