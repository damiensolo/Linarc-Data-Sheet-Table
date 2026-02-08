import React, { useRef, useEffect, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import AppHeader from './AppHeader';
import MainContent from './MainContent';
import ItemDetailsPanel from '../shared/ItemDetailsPanel';
import CreateViewModal from '../shared/CreateViewModal';
import Header from '../../mainnav/new/Header';
import Sidebar from '../../mainnav/new/Sidebar';

/** Bookmarks data passed from Header (v2) for Sidebar integration */
type BookmarksData = {
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
};

const AppLayout: React.FC = () => {
    const { modalState, setModalState, handleSaveView, detailedTask, setDetailedTaskId, handlePriorityChange } = useProject();
    const mainContentRef = useRef<HTMLDivElement>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [bookmarksData, setBookmarksData] = useState<BookmarksData | null>(null);
    const [headerVersion, setHeaderVersion] = useState<'v1' | 'v2'>('v2');

    useEffect(() => {
        const contentEl = mainContentRef.current;
        const handleScroll = () => setIsScrolled((contentEl?.scrollTop ?? 0) > 0);
        contentEl?.addEventListener('scroll', handleScroll);
        return () => contentEl?.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="flex flex-col h-full bg-white font-sans text-gray-800 overflow-hidden">
            {modalState && (
                <CreateViewModal
                    title={modalState.type === 'rename' ? 'Rename View' : 'Create New View'}
                    initialName={modalState.view?.name}
                    onSave={handleSaveView}
                    onCancel={() => setModalState(null)}
                />
            )}
            
            {/* Header v2: exposes bookmarks to Sidebar via onBookmarksDataChange */}
            <Header
                version={headerVersion}
                onSelectionChange={(title) => console.log('Navigated to:', title)}
                onBookmarksDataChange={setBookmarksData}
                onToggleVersion={() => setHeaderVersion(v => v === 'v1' ? 'v2' : 'v1')}
            />
            
            <div className="flex flex-1 overflow-hidden">
                {/* New Sidebar v2 with bookmarks from Header */}
                <Sidebar
                    version={headerVersion}
                    bookmarks={bookmarksData?.bookmarks ?? []}
                    onSelect={bookmarksData?.handleSelect}
                    onToggleBookmark={bookmarksData?.toggleBookmark}
                />

                {/* Main Application Area Wrapper */}
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
                    {/* Existing App Header (View Controls) */}
                    <AppHeader />
                    
                    {/* Existing Content Area */}
                    <div className="flex flex-1 overflow-hidden relative">
                        <main ref={mainContentRef} className="flex-1 overflow-auto transition-all duration-300 ease-in-out">
                            <MainContent isScrolled={isScrolled} />
                        </main>
                        <ItemDetailsPanel 
                            task={detailedTask} 
                            onClose={() => setDetailedTaskId(null)} 
                            onPriorityChange={handlePriorityChange} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AppLayout;