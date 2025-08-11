import React from 'react';

interface StrategicRecommendation {
  id: string;
  action_title: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  suggested_timeline: string;
  impact_statement: string;
  visual_icon_suggestion: string; // e.g., "timeline", "growth_chart", "user_group"
}

interface StrategicRecommendationItemProps {
  recommendation: StrategicRecommendation;
  index: number;
}

const priorityColors = {
  High: 'border-red-500 bg-red-100 text-red-700',
  Medium: 'border-amber-500 bg-amber-100 text-amber-700',
  Low: 'border-green-500 bg-green-100 text-green-700',
};

const categoryColors: { [key: string]: string } = {
  'Product Development': 'bg-slate-100 text-slate-700',
  'Market Expansion': 'bg-slate-100 text-slate-700',
  'Operational Efficiency': 'bg-slate-100 text-slate-700',
  'Brand Building': 'bg-slate-100 text-slate-700',
  'Customer Acquisition': 'bg-slate-100 text-slate-700',
  'Technology': 'bg-slate-100 text-slate-700',
  'Partnerships': 'bg-slate-100 text-slate-700',
  'Default': 'bg-slate-100 text-slate-700'
};

// A simple function to get a placeholder icon based on suggestion
// In a real app, you might use an icon library like Heroicons or FontAwesome
const getIconForSuggestion = (suggestion: string) => {
  // Basic Tailwind styled placeholders for now
  const baseStyle = "w-8 h-8 flex items-center justify-center rounded-lg text-white text-sm font-bold";
  switch (suggestion.toLowerCase()) {
    case 'timeline': return <div className={`${baseStyle} bg-slate-500`}>T</div>;
    case 'growth_chart': return <div className={`${baseStyle} bg-slate-500`}>📈</div>;
    case 'user_group': return <div className={`${baseStyle} bg-slate-500`}>👥</div>;
    case 'gear': return <div className={`${baseStyle} bg-slate-500`}>⚙️</div>;
    case 'lightbulb': return <div className={`${baseStyle} bg-slate-500`}>💡</div>;
    case 'rocket': return <div className={`${baseStyle} bg-slate-500`}>🚀</div>;
    case 'map_pin': return <div className={`${baseStyle} bg-slate-500`}>📍</div>;
    default: return <div className={`${baseStyle} bg-slate-500`}>?</div>;
  }
};

const StrategicRecommendationItem: React.FC<StrategicRecommendationItemProps> = ({ recommendation, index }) => {
  const {
    action_title,
    description,
    category,
    priority,
    suggested_timeline,
    impact_statement,
    visual_icon_suggestion,
  } = recommendation;

  const prioColor = priorityColors[priority] || priorityColors.Medium;
  const catColor = categoryColors[category] || categoryColors.Default;

  return (
    <div className="flex items-start space-x-4 p-4">
      <div className="flex-shrink-0 mt-1">
        {getIconForSuggestion(visual_icon_suggestion)}
      </div>
      <div className="flex-grow">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3">
          <h4 className="text-base font-semibold text-slate-800">{action_title}</h4>
          <div className="flex items-center mt-2 sm:mt-0 space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-lg ${catColor}`}>
              {category}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-lg ${prioColor} border`}>
              {priority} Priority
            </span>
          </div>
        </div>
        
        <p className="text-sm text-slate-600 mb-3 leading-relaxed">{description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs mt-3 pt-3 border-t border-slate-200">
          <div>
            <strong className="text-slate-500 block mb-1">Suggested Timeline:</strong>
            <span className="text-slate-700">{suggested_timeline}</span>
          </div>
          <div>
            <strong className="text-slate-500 block mb-1">Expected Impact:</strong>
            <span className="text-slate-700">{impact_statement}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategicRecommendationItem; 