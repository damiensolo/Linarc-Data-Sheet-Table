
import React from 'react';
import { useProject } from '../../context/ProjectContext';
import TableView from '../views/table/TableView';
import BoardView from '../views/board/BoardView';
import GanttView from '../views/gantt/GanttView';
import LookaheadView from '../views/lookahead/LookaheadView';
import SpreadsheetView from '../views/spreadsheet/SpreadsheetView';
import SpreadsheetViewV2 from '../views/spreadsheetV2/SpreadsheetViewV2';
import DashboardView from '../views/dashboard/DashboardView';

const MainContent: React.FC<{ isScrolled: boolean }> = ({ isScrolled }) => {
    const { activeViewMode, activeView } = useProject();

    const renderView = () => {
        switch(activeViewMode) {
          case 'dashboard':
            return <DashboardView key={activeView.id} />;
          case 'table':
            return <TableView key={activeView.id} isScrolled={isScrolled} />;
          case 'spreadsheet':
            return <SpreadsheetView key={activeView.id} />;
          case 'spreadsheetV2':
            return <SpreadsheetViewV2 key={activeView.id} />;
          case 'board':
            return <BoardView key={activeView.id} />;
          case 'gantt':
            return <GanttView key={activeView.id} />;
          case 'lookahead':
            return <LookaheadView key={activeView.id} />;
          default:
            return null;
        }
    }

    return <>{renderView()}</>;
};

export default MainContent;
