'use client'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

//Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, Title)

export default function DoughnutChart({ labels, dataPoints }) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Emotions',
        data: dataPoints,
        backgroundColor: [
          '#2153c2',
          '#158641',
          '#8698a5',
          '#cca717',
          '#c33a3c',
          '#FF6384',

        ],
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: false,
        text: '',
      },
    },
  }

  return <Doughnut data={data} options={options} />
}
