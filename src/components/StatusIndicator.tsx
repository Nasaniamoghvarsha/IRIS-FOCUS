import React from 'react';
import { Eye, EyeOff, CameraOff } from 'lucide-react';

interface StatusIndicatorProps {
    isLookingAtScreen: boolean;
    isEnabled: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ isLookingAtScreen, isEnabled }) => {
    if (!isEnabled) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-500">
                <CameraOff size={16} />
                <span className="text-sm font-bold tracking-tight">Camera Off</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 ${isLookingAtScreen
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                : 'border-blue-500/30 bg-blue-500/10 text-blue-500'
            }`}>
            {isLookingAtScreen ? (
                <>
                    <Eye size={16} className="animate-pulse" />
                    <span className="text-sm font-bold tracking-tight uppercase">Focused</span>
                </>
            ) : (
                <>
                    <EyeOff size={16} />
                    <span className="text-sm font-bold tracking-tight uppercase">Looking Away</span>
                </>
            )}
        </div>
    );
};
