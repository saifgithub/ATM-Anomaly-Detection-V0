import React from 'react';
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface StatsCardProps {
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: 'document' | 'exclamation' | 'map' | 'clock';
}

const iconMap = {
  document: DocumentTextIcon,
  exclamation: ExclamationTriangleIcon,
  map: MapPinIcon,
  clock: ClockIcon,
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
}) => {
  const IconComponent = iconMap[icon];
  const changeColor = changeType === 'increase' ? 'text-green-600' : 'text-red-600';
  const changeSymbol = changeType === 'increase' ? '+' : '';

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <IconComponent className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value.toLocaleString()}
                </div>
                {change !== 0 && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${changeColor}`}>
                    {changeSymbol}{Math.abs(change)}
                    <span className="ml-1 text-gray-500">vs last period</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
