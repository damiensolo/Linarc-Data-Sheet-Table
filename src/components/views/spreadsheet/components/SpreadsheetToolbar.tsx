
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScissorsIcon, CopyIcon, TrashIcon, ClipboardIcon, FillColorIcon, BorderColorIcon, TextColorIcon, ActivityIcon, DatabaseIcon, CalculatorIcon, SettingsIcon } from '../../../common/Icons';
import ViewControls from '../../../layout/ViewControls';
import FieldsMenu from '../../../layout/FieldsMenu';
import { Popover } from '../../../common/ui/Popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../common/ui/Tooltip';
import ColorPicker from '../../../common/ui/ColorPicker';
import { BudgetLineItemStyle } from '../../../../types';
import { BACKGROUND_COLORS, TEXT_BORDER_COLORS } from '../../../../constants/designTokens';

interface SpreadsheetToolbarProps {
    isAllSelected: boolean;
    handleToggleAll: () => void;
    toolbarCheckboxRef: React.RefObject<HTMLInputElement>;
    hasRowSelection: boolean;
    selectedCount: number;
    onStyleUpdate: (style: Partial<BudgetLineItemStyle>) => void;
}

const SpreadsheetToolbar: React.FC<SpreadsheetToolbarProps> = ({
    isAllSelected,
    handleToggleAll,
    toolbarCheckboxRef,
    hasRowSelection,
    selectedCount,
    onStyleUpdate
}) => {
    return (
        <div className="flex items-center h-14 border-b border-gray-200 bg-white flex-shrink-0 transition-all z-40 relative pr-4">
            <div className="w-14 flex items-center justify-center flex-shrink-0 border-r border-gray-200">
                <input 
                    type="checkbox" 
                    checked={isAllSelected} 
                    onChange={handleToggleAll}
                    ref={toolbarCheckboxRef}
                    aria-label="Select all visible rows"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
            </div>

            <div className="flex-1 pl-4 flex items-center">
                <AnimatePresence mode="wait">
                {hasRowSelection ? (
                    <motion.div 
                        key="actions"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-4 flex-1"
                    >
                        <TooltipProvider>
                            <div className="flex items-center gap-1 p-1.5 rounded-lg">
                                <Tooltip>
                                    <TooltipTrigger>
                                        <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-gray-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <ScissorsIcon className="w-5 h-5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Cut</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                    <TooltipTrigger>
                                        <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-gray-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <CopyIcon className="w-5 h-5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Copy</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                    <TooltipTrigger>
                                        <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-gray-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <ClipboardIcon className="w-5 h-5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Paste</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                    <TooltipTrigger>
                                        <button className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-all shadow-sm border border-transparent hover:border-red-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-red-500">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                                
                                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                                
                                <ColorPicker 
                                    icon={<FillColorIcon className="w-5 h-5" />} 
                                    label="Background" 
                                    onColorSelect={(color) => onStyleUpdate({ backgroundColor: color })} 
                                    presets={BACKGROUND_COLORS}
                                />
                                <ColorPicker 
                                    icon={<BorderColorIcon className="w-5 h-5" />} 
                                    label="Border" 
                                    onColorSelect={(color) => onStyleUpdate({ borderColor: color })} 
                                    presets={TEXT_BORDER_COLORS}
                                />
                                <ColorPicker 
                                    icon={<TextColorIcon className="w-5 h-5" />} 
                                    label="Text" 
                                    onColorSelect={(color) => onStyleUpdate({ textColor: color })} 
                                    presets={TEXT_BORDER_COLORS}
                                />
                            </div>
                        </TooltipProvider>
                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                            {selectedCount} selected
                        </span>
                    </motion.div>
                ) : (
                        <motion.div
                        key="controls"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-4 w-full"
                        >
                        <ViewControls />
                        <div className="w-px h-6 bg-gray-300"></div>
                        
                        {/* Mini Actions */}
                        <div className="flex items-center gap-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                            <ActivityIcon className="w-4 h-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Toggle Critical Path</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                            <CalculatorIcon className="w-4 h-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Compute Critical Path</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                            <DatabaseIcon className="w-4 h-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Create Baseline</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* Settings Menu */}
                        <div className="ml-auto pl-4 border-l border-gray-200 h-6 flex items-center">
                            <Popover
                                trigger={
                                    <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                        <SettingsIcon className="w-4 h-4" />
                                    </button>
                                }
                                content={
                                    <FieldsMenu onClose={() => {}} disableClickOutside className="right-0 mt-2" />
                                }
                                align="end"
                            />
                        </div>
                        </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SpreadsheetToolbar;
