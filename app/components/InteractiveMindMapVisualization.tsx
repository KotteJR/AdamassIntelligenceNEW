'use client';

import React, { useCallback, useMemo, useLayoutEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
  BackgroundVariant,
  NodeMouseHandler,
  EdgeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from './ThemeToggle';

interface MindMapData {
  central: {
    id: string;
    label: string;
    type: string;
    color: string;
    size: string;
  };
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    color: string;
    size: string;
    parentId: string;
    data?: {
      score?: string | number;
      summary?: string;
      details?: string;
      priority?: string;
      subNodes?: Array<{
        id: string;
        label: string;
        type: string;
        details: string;
        impact: 'low' | 'medium' | 'high' | 'critical';
        historicalData?: Array<{
          date: string;
          value: number;
          trend: 'up' | 'down' | 'stable';
        }>;
        whatIfScenarios?: Array<{
          scenario: string;
          description: string;
          impact: 'positive' | 'negative' | 'neutral';
          probability: 'low' | 'medium' | 'high';
        }>;
      }>;
    };
  }>;
  connections: Array<{
    source: string;
    target: string;
    type: string;
    strength: number;
    color: string;
  }>;
}

interface InteractiveMindMapVisualizationProps {
  data: MindMapData;
}

// Enhanced node data types
type CentralNodeData = { 
  label: string;
  isExpanded?: boolean;
  onToggle?: () => void;
};

type BranchNodeData = { 
  label: string; 
  type: string; 
  color?: string; 
  score?: string | number; 
  summary?: string;
  isExpanded?: boolean;
  hasSubNodes?: boolean;
  onToggle?: () => void;
  onWhatIf?: () => void;
  onHistorical?: () => void;
};

type DetailNodeData = { 
  label: string; 
  type: string; 
  color?: string; 
  details?: string; 
  priority?: string;
  impact?: 'low' | 'medium' | 'high' | 'critical';
  historicalData?: Array<{
    date: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  whatIfScenarios?: Array<{
    scenario: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    probability: 'low' | 'medium' | 'high';
  }>;
  onWhatIf?: () => void;
  onHistorical?: () => void;
};

// Interactive Central Node
const InteractiveCentralNode = ({ data }: { data: CentralNodeData }) => {
  const { isDark } = useTheme();
  return (
    <div className={`px-6 py-4 shadow-lg rounded-2xl border-2 min-w-[200px] ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-900'}`}>
      <div className={`text-xl font-bold text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>{data.label}</div>
      {data.onToggle && (
        <button
          onClick={data.onToggle}
          className={`mt-2 w-full px-3 py-1 text-xs rounded-lg transition-colors ${
            isDark 
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          {data.isExpanded ? 'Collapse' : 'Expand'} All
        </button>
      )}
    </div>
  );
};

// Interactive Branch Node
const InteractiveBranchNode = ({ data }: { data: BranchNodeData }) => {
  const { isDark } = useTheme();
  const bgColor = isDark 
    ? (data.type === 'strength' ? 'bg-green-900/50 border-green-400' :
       data.type === 'weakness' ? 'bg-red-900/50 border-red-400' :
       data.type === 'opportunity' ? 'bg-blue-900/50 border-blue-400' :
       data.type === 'threat' ? 'bg-yellow-900/50 border-yellow-400' :
       'bg-slate-800 border-slate-600')
    : (data.type === 'strength' ? 'bg-green-50 border-green-400' :
       data.type === 'weakness' ? 'bg-red-50 border-red-400' :
       data.type === 'opportunity' ? 'bg-blue-50 border-blue-400' :
       data.type === 'threat' ? 'bg-yellow-50 border-yellow-400' :
       'bg-slate-50 border-slate-400');

  return (
    <div className={`px-4 py-3 shadow-md rounded-xl border-2 ${bgColor} min-w-[160px] max-w-[200px]`}>
      <div className={`text-sm font-semibold text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>{data.label}</div>
      {data.score && (
        <div className={`text-xs text-center mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Score: {data.score}</div>
      )}
      {data.summary && (
        <div className={`text-xs text-center mt-1 leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{data.summary}</div>
      )}
      
      {/* Interactive Controls */}
      <div className="flex gap-1 mt-2">
        {data.hasSubNodes && data.onToggle && (
          <button
            onClick={data.onToggle}
            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
              isDark 
                ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {data.isExpanded ? '−' : '+'}
          </button>
        )}
        {data.onWhatIf && (
          <button
            onClick={data.onWhatIf}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              isDark 
                ? 'bg-blue-700/50 hover:bg-blue-600/50 text-blue-300' 
                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            }`}
            title="What-if Analysis"
          >
            ?
          </button>
        )}
        {data.onHistorical && (
          <button
            onClick={data.onHistorical}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              isDark 
                ? 'bg-purple-700/50 hover:bg-purple-600/50 text-purple-300' 
                : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
            }`}
            title="Historical Data"
          >
            📊
          </button>
        )}
      </div>
    </div>
  );
};

// Interactive Detail Node
const InteractiveDetailNode = ({ data }: { data: DetailNodeData }) => {
  const { isDark } = useTheme();
  const bgColor = isDark
    ? (data.type === 'strength' ? 'bg-green-800/50 border-green-500' :
       data.type === 'weakness' ? 'bg-red-800/50 border-red-500' :
       data.type === 'recommendation' ? 'bg-blue-800/50 border-blue-500' :
       data.type === 'opportunity' ? 'bg-purple-800/50 border-purple-500' :
       data.type === 'threat' ? 'bg-orange-800/50 border-orange-500' :
       'bg-slate-700 border-slate-500')
    : (data.type === 'strength' ? 'bg-green-100 border-green-300' :
       data.type === 'weakness' ? 'bg-red-100 border-red-300' :
       data.type === 'recommendation' ? 'bg-blue-100 border-blue-300' :
       data.type === 'opportunity' ? 'bg-purple-100 border-purple-300' :
       data.type === 'threat' ? 'bg-orange-100 border-orange-300' :
       'bg-gray-100 border-gray-300');

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return isDark ? 'bg-red-900/50 text-red-200' : 'bg-red-200 text-red-800';
      case 'high':
        return isDark ? 'bg-orange-900/50 text-orange-200' : 'bg-orange-200 text-orange-800';
      case 'medium':
        return isDark ? 'bg-yellow-900/50 text-yellow-200' : 'bg-yellow-200 text-yellow-800';
      case 'low':
        return isDark ? 'bg-green-900/50 text-green-200' : 'bg-green-200 text-green-800';
      default:
        return isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <div className={`px-3 py-2 shadow-sm rounded-lg border ${bgColor} min-w-[120px] max-w-[180px]`}>
      <div className={`text-xs font-medium text-center ${isDark ? 'text-white' : 'text-slate-800'}`}>{data.label}</div>
      {data.details && (
        <div className={`text-[10px] text-center mt-1 leading-tight ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{data.details}</div>
      )}
      {data.priority && (
        <div className="text-[10px] font-medium text-center mt-1">
          <span className={`px-1 rounded ${isDark 
            ? (data.priority === 'Critical' ? 'bg-red-700 text-red-200' : 
               data.priority === 'High' ? 'bg-orange-700 text-orange-200' : 
               'bg-blue-700 text-blue-200')
            : (data.priority === 'Critical' ? 'bg-red-200 text-red-800' : 
               data.priority === 'High' ? 'bg-orange-200 text-orange-800' : 
               'bg-blue-200 text-blue-800')}`}>
            {data.priority}
          </span>
        </div>
      )}
      {data.impact && (
        <div className="text-[10px] font-medium text-center mt-1">
          <span className={`px-1 rounded ${getImpactColor(data.impact)}`}>
            {data.impact}
          </span>
        </div>
      )}
      
      {/* Interactive Controls */}
      <div className="flex gap-1 mt-2">
        {data.onWhatIf && (
          <button
            onClick={data.onWhatIf}
            className={`flex-1 px-1 py-1 text-[10px] rounded transition-colors ${
              isDark 
                ? 'bg-blue-700/50 hover:bg-blue-600/50 text-blue-300' 
                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            }`}
            title="What-if Analysis"
          >
            ?
          </button>
        )}
        {data.onHistorical && (
          <button
            onClick={data.onHistorical}
            className={`flex-1 px-1 py-1 text-[10px] rounded transition-colors ${
              isDark 
                ? 'bg-purple-700/50 hover:bg-purple-600/50 text-purple-300' 
                : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
            }`}
            title="Historical Data"
          >
            📊
          </button>
        )}
      </div>
    </div>
  );
};

// Modal Components
const WhatIfModal = ({ 
  isOpen, 
  onClose, 
  scenarios, 
  nodeLabel 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  scenarios?: Array<{
    scenario: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    probability: 'low' | 'medium' | 'high';
  }>;
  nodeLabel: string;
}) => {
  const { isDark } = useTheme();
  
  if (!isOpen) return null;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return isDark ? 'bg-green-900/50 border-green-400 text-green-200' : 'bg-green-50 border-green-400 text-green-800';
      case 'negative':
        return isDark ? 'bg-red-900/50 border-red-400 text-red-200' : 'bg-red-50 border-red-400 text-red-800';
      case 'neutral':
        return isDark ? 'bg-slate-700 border-slate-500 text-slate-300' : 'bg-slate-50 border-slate-400 text-slate-700';
      default:
        return isDark ? 'bg-slate-700 border-slate-500 text-slate-300' : 'bg-slate-50 border-slate-400 text-slate-700';
    }
  };

  const getProbabilityColor = (probability: string) => {
    switch (probability) {
      case 'high':
        return isDark ? 'bg-green-700 text-green-200' : 'bg-green-200 text-green-800';
      case 'medium':
        return isDark ? 'bg-yellow-700 text-yellow-200' : 'bg-yellow-200 text-yellow-800';
      case 'low':
        return isDark ? 'bg-red-700 text-red-200' : 'bg-red-200 text-red-800';
      default:
        return isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`max-w-2xl w-full mx-4 rounded-xl border-2 p-6 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            What-if Analysis: {nodeLabel}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {scenarios ? scenarios.map((scenario, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getImpactColor(scenario.impact)}`}>
              <div className="flex items-start justify-between mb-2">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {scenario.scenario}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full ${getProbabilityColor(scenario.probability)}`}>
                  {scenario.probability} probability
                </span>
              </div>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {scenario.description}
              </p>
            </div>
          )) : (
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-500' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                No what-if scenarios available for this node.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HistoricalDataModal = ({ 
  isOpen, 
  onClose, 
  data, 
  nodeLabel 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  data?: Array<{
    date: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  nodeLabel: string;
}) => {
  const { isDark } = useTheme();
  
  if (!isOpen) return null;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`max-w-2xl w-full mx-4 rounded-xl border-2 p-6 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Historical Data: {nodeLabel}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-3">
          {data ? data.map((item, index) => (
            <div key={index} className={`p-3 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-500' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Value: {item.value}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(item.trend)}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.trend === 'up' ? (isDark ? 'bg-green-700 text-green-200' : 'bg-green-200 text-green-800') :
                    item.trend === 'down' ? (isDark ? 'bg-red-700 text-red-200' : 'bg-red-200 text-red-800') :
                    (isDark ? 'bg-yellow-700 text-yellow-200' : 'bg-yellow-200 text-yellow-800')
                  }`}>
                    {item.trend}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-500' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                No historical data available for this node.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  central: InteractiveCentralNode,
  branch: InteractiveBranchNode,
  detail: InteractiveDetailNode,
};

// Enhanced layout function with expandable nodes
const generateInteractiveMindMapLayout = (
  data: MindMapData, 
  expandedNodes: Set<string>
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Central node at the center
  nodes.push({
    id: data.central.id,
    type: 'central',
    position: { x: 0, y: 0 },
    data: { 
      label: data.central.label,
      type: data.central.type,
      isExpanded: expandedNodes.has(data.central.id)
    },
  });

  // Find branch nodes (direct children of central)
  const branchNodes = data.nodes.filter(node => node.parentId === data.central.id);
  const detailNodes = data.nodes.filter(node => node.parentId !== data.central.id);

  // Position branch nodes in a circle around the central node
  const radius = 300;
  const angleStep = (2 * Math.PI) / branchNodes.length;

  branchNodes.forEach((node, index) => {
    const angle = index * angleStep;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    nodes.push({
      id: node.id,
      type: 'branch',
      position: { x, y },
      data: { 
        label: node.label,
        type: node.type,
        score: (node as any).data?.score,
        summary: (node as any).data?.summary,
        isExpanded: expandedNodes.has(node.id),
        hasSubNodes: detailNodes.some(dn => dn.parentId === node.id)
      },
    });

    // Add edge from central to branch
    edges.push({
      id: `edge-${data.central.id}-${node.id}`,
      source: data.central.id,
      target: node.id,
      type: 'smoothstep',
      animated: false,
      style: { 
        stroke: node.color || '#64748b', 
        strokeWidth: 3 
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: node.color || '#64748b',
      },
    });
  });

  // Position detail nodes around their parent branch nodes (only if expanded)
  branchNodes.forEach((branchNode, branchIndex) => {
    if (!expandedNodes.has(branchNode.id)) return;
    
    const childNodes = detailNodes.filter(node => node.parentId === branchNode.id);
    if (childNodes.length === 0) return;

    const branchAngle = branchIndex * angleStep;
    const branchX = Math.cos(branchAngle) * radius;
    const branchY = Math.sin(branchAngle) * radius;

    const childRadius = 150;
    const childAngleStep = Math.PI / (childNodes.length + 1);
    const startAngle = branchAngle - Math.PI / 2;

    childNodes.forEach((childNode, childIndex) => {
      const childAngle = startAngle + (childIndex + 1) * childAngleStep;
      const x = branchX + Math.cos(childAngle) * childRadius;
      const y = branchY + Math.sin(childAngle) * childRadius;

      nodes.push({
        id: childNode.id,
        type: 'detail',
        position: { x, y },
        data: { 
          label: childNode.label,
          type: childNode.type,
          details: (childNode as any).data?.details,
          priority: (childNode as any).data?.priority,
          impact: (childNode as any).data?.impact,
          historicalData: (childNode as any).data?.historicalData,
          whatIfScenarios: (childNode as any).data?.whatIfScenarios
        },
      });

      // Add edge from branch to detail
      edges.push({
        id: `edge-${branchNode.id}-${childNode.id}`,
        source: branchNode.id,
        target: childNode.id,
        type: 'smoothstep',
        animated: false,
        style: { 
          stroke: childNode.color || '#94a3b8', 
          strokeWidth: 2 
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: childNode.color || '#94a3b8',
        },
      });
    });
  });

  return { nodes, edges };
};

const InteractiveMindMapFlow = ({ data }: InteractiveMindMapVisualizationProps) => {
  const { fitView } = useReactFlow();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [whatIfModal, setWhatIfModal] = useState<{ isOpen: boolean; nodeId: string; nodeLabel: string; scenarios?: any[] }>({
    isOpen: false,
    nodeId: '',
    nodeLabel: '',
    scenarios: []
  });
  const [historicalModal, setHistoricalModal] = useState<{ isOpen: boolean; nodeId: string; nodeLabel: string; data?: any[] }>({
    isOpen: false,
    nodeId: '',
    nodeLabel: '',
    data: []
  });
  
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => 
    generateInteractiveMindMapLayout(data, expandedNodes), [data, expandedNodes]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node expansion
  const handleNodeToggle = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Handle what-if analysis
  const handleWhatIf = useCallback((nodeId: string, nodeLabel: string, scenarios?: any[]) => {
    setWhatIfModal({
      isOpen: true,
      nodeId,
      nodeLabel,
      scenarios
    });
  }, []);

  // Handle historical data
  const handleHistorical = useCallback((nodeId: string, nodeLabel: string, data?: any[]) => {
    setHistoricalModal({
      isOpen: true,
      nodeId,
      nodeLabel,
      data
    });
  }, []);

  // Update node data with interactive handlers
  const enhancedNodes = useMemo(() => {
    return nodes.map(node => {
      const nodeData = node.data as any;
      const enhancedData = { ...nodeData };

      if (node.type === 'central') {
        enhancedData.onToggle = () => {
          // Toggle all nodes
          const allNodeIds = [data.central.id, ...data.nodes.map(n => n.id)];
          setExpandedNodes(prev => {
            const newSet = new Set(prev);
            const allExpanded = allNodeIds.every(id => newSet.has(id));
            if (allExpanded) {
              allNodeIds.forEach(id => newSet.delete(id));
            } else {
              allNodeIds.forEach(id => newSet.add(id));
            }
            return newSet;
          });
        };
      } else if (node.type === 'branch') {
        enhancedData.onToggle = () => handleNodeToggle(node.id);
        enhancedData.onWhatIf = () => handleWhatIf(node.id, nodeData.label, nodeData.whatIfScenarios);
        enhancedData.onHistorical = () => handleHistorical(node.id, nodeData.label, nodeData.historicalData);
      } else if (node.type === 'detail') {
        enhancedData.onWhatIf = () => handleWhatIf(node.id, nodeData.label, nodeData.whatIfScenarios);
        enhancedData.onHistorical = () => handleHistorical(node.id, nodeData.label, nodeData.historicalData);
      }

      return {
        ...node,
        data: enhancedData
      };
    });
  }, [nodes, data, handleNodeToggle, handleWhatIf, handleHistorical]);

  // Fit view when component mounts or nodes change
  useLayoutEffect(() => {
    setTimeout(() => {
      fitView({ padding: 0.1, duration: 800 });
    }, 100);
  }, [fitView, expandedNodes]);

  return (
    <>
      <ReactFlow
        nodes={enhancedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        className="bg-slate-50"
      >
        <Controls 
          position="bottom-right"
          className="!bg-white !border-slate-200 !shadow-lg"
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="#e2e8f0"
        />
      </ReactFlow>

      {/* Modals */}
      <WhatIfModal
        isOpen={whatIfModal.isOpen}
        onClose={() => setWhatIfModal({ isOpen: false, nodeId: '', nodeLabel: '', scenarios: [] })}
        scenarios={whatIfModal.scenarios}
        nodeLabel={whatIfModal.nodeLabel}
      />
      
      <HistoricalDataModal
        isOpen={historicalModal.isOpen}
        onClose={() => setHistoricalModal({ isOpen: false, nodeId: '', nodeLabel: '', data: [] })}
        data={historicalModal.data}
        nodeLabel={historicalModal.nodeLabel}
      />
    </>
  );
};

const InteractiveMindMapVisualization: React.FC<InteractiveMindMapVisualizationProps> = ({ data }) => {
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <InteractiveMindMapFlow data={data} />
      </ReactFlowProvider>
    </div>
  );
};

export default InteractiveMindMapVisualization;
