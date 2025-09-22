'use client';

import React, { useCallback, useMemo, useLayoutEffect } from 'react';
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
    data?: unknown;
  }>;
  connections: Array<{
    source: string;
    target: string;
    type: string;
    strength: number;
    color: string;
  }>;
}

interface MindMapVisualizationProps {
  data: MindMapData;
}

// Custom node components
type CentralNodeData = { label: string };
type BranchNodeData = { label: string; type: string; color?: string; score?: string | number; summary?: string };
type DetailNodeData = { label: string; type: string; color?: string; details?: string; priority?: string };

const CentralNode = ({ data }: { data: CentralNodeData }) => {
  const { isDark } = useTheme();
  return (
    <div className={`px-6 py-4 shadow-lg rounded-2xl border-2 min-w-[200px] ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-900'}`}>
      <div className={`text-xl font-bold text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>{data.label}</div>
    </div>
  );
};

const BranchNode = ({ data }: { data: BranchNodeData }) => {
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
    </div>
  );
};

const DetailNode = ({ data }: { data: DetailNodeData }) => {
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
    </div>
  );
};

const nodeTypes = {
  central: CentralNode,
  branch: BranchNode,
  detail: DetailNode,
};

// Layout function to position nodes in a mind map style
const generateMindMapLayout = (data: MindMapData): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Central node at the center
  nodes.push({
    id: data.central.id,
    type: 'central',
    position: { x: 0, y: 0 },
    data: { 
      label: data.central.label,
      type: data.central.type 
    },
  });

  // Find branch nodes (direct children of central)
  const branchNodes = data.nodes.filter(node => node.parentId === data.central.id);
  const detailNodes = data.nodes.filter(node => node.parentId !== data.central.id);

  // Position branch nodes in a circle around the central node
  const radius = 320;
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
        // guard optional nested data as any to satisfy type checker for dynamic JSON
        score: (node as any).data?.score,
        summary: (node as any).data?.summary
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

  // Position detail nodes around their parent branch nodes
  branchNodes.forEach((branchNode, branchIndex) => {
    const childNodes = detailNodes.filter(node => node.parentId === branchNode.id);
    if (childNodes.length === 0) return;

    const branchAngle = branchIndex * angleStep;
    const branchX = Math.cos(branchAngle) * radius;
    const branchY = Math.sin(branchAngle) * radius;

    const childRadius = 180;
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
          action: (childNode as any).data?.action
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

const MindMapFlow = ({ data }: MindMapVisualizationProps) => {
  const { fitView } = useReactFlow();
  
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => 
    generateMindMapLayout(data), [data]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Fit view when component mounts
  useLayoutEffect(() => {
    setTimeout(() => {
      fitView({ padding: 0.1, duration: 800 });
    }, 100);
  }, [fitView]);

  return (
    <ReactFlow
      nodes={nodes}
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
  );
};

const MindMapVisualization: React.FC<MindMapVisualizationProps> = ({ data }) => {
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <MindMapFlow data={data} />
      </ReactFlowProvider>
    </div>
  );
};

export default MindMapVisualization;