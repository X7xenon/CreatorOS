import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

export const PerformanceChart: React.FC<{ dataPoints?: any[] }> = ({ dataPoints }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(20, 20, 20, 0.9)',
        titleColor: '#fff',
        bodyColor: '#aaa',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#888' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#888' }
      }
    },
    elements: {
      line: { tension: 0.4 }, // smooth curves
    }
  };

  const hasData = dataPoints && dataPoints.length > 0;
  
  const labels = hasData 
    ? dataPoints.map(d => d.date.split('-').slice(1).join('/')) 
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
  const chartData = hasData 
    ? dataPoints.map(d => d.followers)
    : [1.2, 1.9, 1.5, 2.8, 2.2, 3.5, 4.2];

  const data = {
    labels: labels,
    datasets: [
      {
        fill: true,
        label: hasData ? 'Followers' : 'Views',
        data: chartData,
        borderColor: '#3b82f6', // accent color
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointRadius: 4,
      },
    ],
  };

  return (
    <div style={{ height: '300px' }}>
      <Line options={options} data={data} />
    </div>
  );
};
